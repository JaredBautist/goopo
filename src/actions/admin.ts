"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/services/session-user";
import { ensureDb } from "@/server/db/client";
import { createId } from "@/lib/id";
import { uniqueSlug } from "@/server/services/competitions.service";
import { logAudit } from "@/server/services/audit.service";
import { syncCompetitionStates } from "@/server/services/competitions.service";
import { resolveCompetition, cancelCompetition } from "@/server/services/predictions.service";
import { applyWalletMovement, adminAdjustBalance } from "@/server/services/wallet.service";

export type AdminState = { error?: string; ok?: string };

const optionSchema = z.object({
  label: z.string().min(1).max(120),
  description: z.string().max(300).optional().nullable(),
});

const competitionSchema = z.object({
  title: z.string().min(5).max(140),
  description: z.string().min(10).max(600),
  category: z.enum(["deportes", "esports", "academico", "entretenimiento", "clima", "comunidad", "otro"]),
  coverEmoji: z.string().min(1).max(255).default("🎲"),
  rulesText: z.string().min(20).max(5000),
  entryCost: z.coerce.number().int().min(1).max(10000),
  maxParticipants: z.coerce.number().int().min(2).max(1000).optional().nullable(),
  opensAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
  closesAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
  expectedResultAt: z.string().optional().nullable(),
  tieRule: z.enum(["split_equal", "earliest_wins", "refund_all"]),
  options: z.array(optionSchema).min(2).max(8),
});

function toIso(local: string): string {
  // Los inputs datetime-local llegan sin zona; asumimos hora Colombia (UTC-5)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) {
    return new Date(`${local}:00-05:00`).toISOString();
  }
  return new Date(local).toISOString();
}

export async function createCompetitionAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdmin();

  const optionLabels = formData.getAll("optionLabel").map(String).filter((s) => s.trim() !== "");
  const optionDescs = formData.getAll("optionDescription").map(String);
  const options = optionLabels.map((label, i) => ({
    label: label.trim(),
    description: optionDescs[i]?.trim() || null,
  }));

  const maxP = String(formData.get("maxParticipants") ?? "").trim();

  const parsed = competitionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    coverEmoji: formData.get("coverEmoji") || "🎲",
    rulesText: formData.get("rulesText"),
    entryCost: formData.get("entryCost"),
    maxParticipants: maxP === "" ? null : Number(maxP),
    opensAt: formData.get("opensAt"),
    closesAt: formData.get("closesAt"),
    expectedResultAt: String(formData.get("expectedResultAt") ?? "").trim() || null,
    tieRule: formData.get("tieRule"),
    options,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `Datos inválidos: ${first?.message ?? "revisa el formulario"} (campo: ${first?.path.join(".")})` };
  }
  const data = parsed.data;
  if (new Date(toIso(String(data.closesAt))) <= new Date(toIso(String(data.opensAt)))) {
    return { error: "El cierre debe ser posterior a la apertura." };
  }

  const client = await ensureDb();
  const id = createId();
  const slug = await uniqueSlug(data.title);
  const nowIso = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO competitions (id, slug, title, description, category, cover_emoji, rules_text, entry_cost, max_participants, opens_at, closes_at, expected_result_at, status, tie_rule, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
    args: [
      id, slug, data.title, data.description, data.category, data.coverEmoji, data.rulesText,
      data.entryCost, data.maxParticipants ?? null,
      toIso(String(data.opensAt)), toIso(String(data.closesAt)),
      data.expectedResultAt ? toIso(data.expectedResultAt) : null,
      data.tieRule, admin.id, nowIso, nowIso,
    ],
  });

  for (let i = 0; i < data.options.length; i++) {
    await client.execute({
      sql: `INSERT INTO options (id, competition_id, label, description, position) VALUES (?, ?, ?, ?, ?)`,
      args: [createId(), id, data.options[i]!.label, data.options[i]!.description ?? null, i],
    });
  }

  await logAudit({
    actorId: admin.id,
    action: "competition.create",
    entityType: "competition",
    entityId: id,
    metadata: { title: data.title, options: data.options.length },
  });

  revalidatePath("/admin/competencias");
  redirect(`/admin/competencias/${id}`);
}

export async function updateCompetitionAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const client = await ensureDb();
  const r = await client.execute({
    sql: `SELECT status, created_by FROM competitions WHERE id = ?`,
    args: [id],
  });
  const row = r.rows[0];
  if (!row) return { error: "Competencia no encontrada." };
  const status = String(row.status);

  // Transparencia: con participaciones solo se editan reglas aclaratorias
  const preds = await client.execute({
    sql: `SELECT COUNT(*) AS c FROM predictions WHERE competition_id = ?`,
    args: [id],
  });
  const hasPredictions = Number(preds.rows[0]?.c ?? 0) > 0;

  if (status === "resolved" || status === "cancelled") {
    return { error: "La competencia es inmutable." };
  }

  if (hasPredictions || status === "closed") {
    const rulesText = String(formData.get("rulesText") ?? "").trim();
    if (rulesText.length < 20) return { error: "Reglas demasiado cortas." };
    await client.execute({
      sql: `UPDATE competitions SET rules_text = ?, updated_at = ? WHERE id = ?`,
      args: [rulesText, new Date().toISOString(), id],
    });
  } else {
    // edición completa permitida (draft/open sin participaciones)
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const rulesText = String(formData.get("rulesText") ?? "").trim();
    const entryCost = Number(formData.get("entryCost"));
    const maxP = String(formData.get("maxParticipants") ?? "").trim();
    if (title.length < 5 || description.length < 10 || rulesText.length < 20 || !Number.isInteger(entryCost) || entryCost <= 0) {
      return { error: "Datos inválidos." };
    }
    await client.execute({
      sql: `UPDATE competitions SET title = ?, description = ?, rules_text = ?, entry_cost = ?, max_participants = ?, updated_at = ? WHERE id = ?`,
      args: [
        title, description, rulesText, entryCost,
        maxP === "" ? null : Number(maxP),
        new Date().toISOString(), id,
      ],
    });
  }

  await logAudit({
    actorId: admin.id,
    action: "competition.update",
    entityType: "competition",
    entityId: id,
    metadata: { limited: hasPredictions || status === "closed" },
  });
  revalidatePath(`/admin/competencias/${id}`);
  return { ok: "Cambios guardados." };
}

export async function publishCompetitionAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const client = await ensureDb();
  await client.execute({
    sql: `UPDATE competitions SET status = 'open', updated_at = ? WHERE id = ? AND status = 'draft'`,
    args: [new Date().toISOString(), id],
  });
  await logAudit({ actorId: admin.id, action: "competition.publish", entityType: "competition", entityId: id });
  revalidatePath("/admin/competencias");
  revalidatePath(`/admin/competencias/${id}`);
}

export async function closeCompetitionAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const client = await ensureDb();
  await client.execute({
    sql: `UPDATE competitions SET status = 'closed', updated_at = ? WHERE id = ? AND status = 'open'`,
    args: [new Date().toISOString(), id],
  });
  await logAudit({ actorId: admin.id, action: "competition.close", entityType: "competition", entityId: id, metadata: { manual: true } });
  revalidatePath("/admin/competencias");
  revalidatePath(`/admin/competencias/${id}`);
}

/** Previsualización del reparto para el diálogo de resolver (se calcula en el cliente de la página admin). */
export async function resolveCompetitionAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const winningOptionId = String(formData.get("winningOptionId") ?? "");
  const note = String(formData.get("resolutionNote") ?? "").trim() || null;
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (confirm !== "RESOLVER") {
    return { error: "Escribe RESOLVER para confirmar." };
  }
  if (!winningOptionId) return { error: "Elige la opción ganadora." };

  await syncCompetitionStates();
  const result = await resolveCompetition({
    competitionId: id,
    winningOptionId,
    resolutionNote: note,
    adminId: admin.id,
  });
  if (!result.ok) return { error: result.reason };

  revalidatePath("/admin");
  revalidatePath("/admin/competencias");
  revalidatePath(`/admin/competencias/${id}`);
  return { ok: `Resuelta: ${result.winnersCount} ganador(es), ${result.paidTotal} G repartidos.` };
}

export async function cancelCompetitionAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "CANCELAR") return { error: "Escribe CANCELAR para confirmar." };
  if (reason.length < 10) return { error: "Describe el motivo (mínimo 10 caracteres)." };

  const result = await cancelCompetition({ competitionId: id, reason, adminId: admin.id });
  if (!result.ok) return { error: result.reason };

  revalidatePath("/admin");
  revalidatePath("/admin/competencias");
  revalidatePath(`/admin/competencias/${id}`);
  return { ok: "Competencia cancelada y participantes reembolsados." };
}

/* ---------- usuarios ---------- */

export async function suspendUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const client = await ensureDb();
  const cur = await client.execute({ sql: `SELECT status FROM users WHERE id = ?`, args: [userId] });
  const status = cur.rows[0] ? String(cur.rows[0].status) : "";
  const next = status === "suspended" ? "active" : "suspended";
  await client.execute({
    sql: `UPDATE users SET status = ?, updated_at = ? WHERE id = ? AND role != 'admin'`,
    args: [next, new Date().toISOString(), userId],
  });
  await logAudit({
    actorId: admin.id,
    action: next === "suspended" ? "user.suspend" : "user.reactivate",
    entityType: "user",
    entityId: userId,
  });
  revalidatePath("/admin/usuarios");
}

export async function adjustBalanceAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const amount = Number(formData.get("amount"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!Number.isInteger(amount) || amount === 0) return { error: "Monto inválido (entero con signo, distinto de 0)." };
  if (reason.length < 5) return { error: "Describe el motivo del ajuste." };

  try {
    await adminAdjustBalance({ userId, amount, reason });
  } catch {
    return { error: "No se pudo ajustar: el saldo quedaría negativo." };
  }

  await logAudit({
    actorId: admin.id,
    action: "wallet.adjust",
    entityType: "user",
    entityId: userId,
    metadata: { amount, reason },
  });
  revalidatePath("/admin/usuarios");
  return { ok: `Ajuste aplicado: ${amount > 0 ? "+" : ""}${amount} G.` };
}

export async function duplicateCompetitionAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const client = await ensureDb();
  const src = await client.execute({ sql: `SELECT * FROM competitions WHERE id = ?`, args: [id] });
  const row = src.rows[0];
  if (!row) return;

  const newId = createId();
  const title = `${String(row.title)} (copia)`;
  const slug = await uniqueSlug(title);
  const nowIso = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO competitions (id, slug, title, description, category, cover_emoji, rules_text, entry_cost, max_participants, opens_at, closes_at, expected_result_at, status, tie_rule, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
    args: [
      newId, slug, title, String(row.description), String(row.category), String(row.cover_emoji),
      String(row.rules_text), Number(row.entry_cost),
      row.max_participants === null ? null : Number(row.max_participants),
      String(row.opens_at), String(row.closes_at),
      row.expected_result_at ? String(row.expected_result_at) : null,
      String(row.tie_rule), admin.id, nowIso, nowIso,
    ],
  });

  const opts = await client.execute({
    sql: `SELECT label, description, position FROM options WHERE competition_id = ? ORDER BY position`,
    args: [id],
  });
  for (const o of opts.rows) {
    await client.execute({
      sql: `INSERT INTO options (id, competition_id, label, description, position) VALUES (?, ?, ?, ?, ?)`,
      args: [createId(), newId, String(o.label), o.description ? String(o.description) : null, Number(o.position)],
    });
  }

  await logAudit({
    actorId: admin.id,
    action: "competition.create",
    entityType: "competition",
    entityId: newId,
    metadata: { duplicatedFrom: id },
  });
  revalidatePath("/admin/competencias");
  redirect(`/admin/competencias/${newId}`);
}

export async function previewPayoutAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  void _prev; void formData;
  return {};
}

void applyWalletMovement;
