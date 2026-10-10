"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/services/session-user";
import { ensureDb } from "@/server/db/client";
import { logAudit } from "@/server/services/audit.service";
import { claimDailyBonus } from "@/server/services/wallet.service";
import { resolveEffectiveDailyLimit, selfExclusionUntil, type SelfExclusionPeriod } from "@/server/domain/responsible-play";
import { markRead, markAllRead } from "@/server/services/notifications.service";
import { createId } from "@/lib/id";
export type AccountState = { error?: string; ok?: string };

export async function updateDisplayNameAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const user = await requireUser();
  const name = z.string().min(1).max(60).safeParse(formData.get("displayName"));
  if (!name.success) return { error: "Nombre inválido (1–60 caracteres)." };
  const client = await ensureDb();
  await client.execute({
    sql: `UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?`,
    args: [name.data, new Date().toISOString(), user.id],
  });
  revalidatePath("/mi-cuenta");
  return { ok: "Nombre actualizado." };
}

export async function changePasswordAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const user = await requireUser();
  const parsed = z
    .object({
      current: z.string().min(1),
      next: z.string().min(8).regex(/[a-zA-Z]/).regex(/\d/),
    })
    .safeParse({
      current: formData.get("current"),
      next: formData.get("next"),
    });
  if (!parsed.success) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres, con letras y números." };
  }
  const client = await ensureDb();
  const r = await client.execute({
    sql: `SELECT password_hash FROM users WHERE id = ?`,
    args: [user.id],
  });
  const hash = r.rows[0] ? String(r.rows[0].password_hash) : "";
  const ok = await bcrypt.compare(parsed.data.current, hash);
  if (!ok) return { error: "La contraseña actual no es correcta." };

  const newHash = await bcrypt.hash(parsed.data.next, 10);
  await client.execute({
    sql: `UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`,
    args: [newHash, new Date().toISOString(), user.id],
  });
  await logAudit({ actorId: user.id, action: "account.password_change", entityType: "user", entityId: user.id });
  revalidatePath("/mi-cuenta");
  return { ok: "Contraseña actualizada." };
}

export async function setDailyLimitAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const user = await requireUser();
  const raw = String(formData.get("limit") ?? "").trim();
  let requested: number | null = null;
  if (raw !== "") {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 50) {
      return { error: "El límite diario mínimo es 50 G (o vacío para sin límite)." };
    }
    requested = n;
  }

  const client = await ensureDb();
  const r = await client.execute({
    sql: `SELECT daily_limit, daily_limit_changed_at FROM users WHERE id = ?`,
    args: [user.id],
  });
  const currentLimit = r.rows[0]?.daily_limit === null || r.rows[0]?.daily_limit === undefined ? null : Number(r.rows[0].daily_limit);
  const changedAt = r.rows[0]?.daily_limit_changed_at ? String(r.rows[0].daily_limit_changed_at) : null;

  const { effective, pending } = resolveEffectiveDailyLimit({
    currentLimit,
    requested,
    changedAt,
    now: new Date(),
  });

  await client.execute({
    sql: `UPDATE users SET daily_limit = ?, daily_limit_changed_at = ?, updated_at = ? WHERE id = ?`,
    args: [effective, new Date().toISOString(), user.id],
  });

  await logAudit({
    actorId: user.id,
    action: "user.limit_change",
    entityType: "user",
    entityId: user.id,
    metadata: { requested, effective, pending },
  });

  revalidatePath("/mi-cuenta");
  return pending
    ? { ok: `El aumento a ${pending} G se aplicará en 24 horas.` }
    : { ok: "Límite actualizado." };
}

export async function selfExcludeAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const user = await requireUser();
  const period = String(formData.get("period") ?? "");
  if (period !== "24h" && period !== "7d" && period !== "30d") {
    return { error: "Elige un periodo válido." };
  }
  const until = selfExclusionUntil(period as SelfExclusionPeriod, new Date());
  const client = await ensureDb();
  await client.execute({
    sql: `UPDATE users SET status = 'self_excluded', self_excluded_until = ?, updated_at = ? WHERE id = ?`,
    args: [until, new Date().toISOString(), user.id],
  });
  await logAudit({ actorId: user.id, action: "user.self_exclude", entityType: "user", entityId: user.id, metadata: { period, until } });
  revalidatePath("/mi-cuenta");
  return { ok: `Autoexclusión activa hasta ${new Date(until).toLocaleString("es-CO")}.` };
}

export async function claimDailyBonusAction(
  _prev: AccountState,
  _formData: FormData,
): Promise<AccountState> {
  const user = await requireUser();
  const result = await claimDailyBonus(user.id);
  if (!result.ok) {
    return result.reason === "balance_too_high"
      ? { error: "La recarga demo está disponible solo si tu saldo es menor a 200 G." }
      : { error: "Ya reclamaste la recarga en las últimas 24 horas." };
  }
  await logAudit({ actorId: user.id, action: "wallet.daily_bonus", entityType: "user", entityId: user.id, metadata: { amount: result.amount } });
  revalidatePath("/billetera");
  revalidatePath("/mi-cuenta");
  return { ok: `Recibiste ${result.amount} G de recarga demo.` };
}

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await markRead(user.id, id);
  revalidatePath("/notificaciones");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  await markAllRead(user.id);
  revalidatePath("/notificaciones");
}

export async function exportMyDataAction(): Promise<void> {
  // La descarga real (JSON y CSV) se hace desde /api/mis-datos
  redirect("/api/mis-datos");
}

export async function deleteAccountAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const user = await requireUser();
  const confirm = String(formData.get("confirm") ?? "").trim().toUpperCase();
  if (confirm !== "ELIMINAR") {
    return { error: "Escribe ELIMINAR para confirmar." };
  }
  const client = await ensureDb();
  const nowIso = new Date().toISOString();
  // Anonimiza: invisible para otros, mantiene integridad del ledger/predictions
  await client.execute({
    sql: `UPDATE users SET
            email = ?,
            username = ?,
            display_name = 'Usuario eliminado',
            password_hash = ?,
            status = 'suspended',
            balance = 0,
            updated_at = ?
          WHERE id = ?`,
    args: [
      `eliminado-${user.id}@goopo.invalid`,
      `anon_${user.id.slice(0, 10)}`,
      bcrypt.hashSync(createId(), 4),
      nowIso,
      user.id,
    ],
  });
  await logAudit({ actorId: user.id, action: "user.delete", entityType: "user", entityId: user.id, metadata: { anonymized: true } });
  redirect("/api/logout");
}

