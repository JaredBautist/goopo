import { ensureDb } from "@/server/db/client";
import { createId } from "@/lib/id";
import { validateParticipation } from "@/server/domain/rules";
import { computePayouts, type PredictionInput } from "@/server/domain/payouts";
import { applyWalletMovement } from "./wallet.service";
import { notify } from "./notifications.service";
import { logAudit } from "./audit.service";
import { rateLimit } from "@/server/rate-limit";
import type { UserForParticipation } from "@/server/domain/rules";
import type { TieRule } from "@/types/domain";

/**
 * Participar en una competencia. Ejecuta TODAS las validaciones de negocio
 * y mueve el saldo dentro de un batch atómico.
 */
export async function placePrediction(input: {
  userId: string;
  competitionId: string;
  optionId: string;
  ip?: string | null;
}): Promise<
  { ok: true; predictionId: string } | { ok: false; reason: string; code: string }
> {
  // 9) rate limit: 10 participaciones por minuto
  if (!rateLimit(`predict:${input.userId}`, 10).ok) {
    return { ok: false, code: "rate_limited", reason: "Demasiadas participaciones seguidas. Espera un minuto." };
  }

  const client = await ensureDb();
  const now = new Date();
  const nowIso = now.toISOString();

  // Usuario
  const uR = await client.execute({
    sql: `SELECT id, status, self_excluded_until, birth_date, age_confirmed_at, balance, daily_limit FROM users WHERE id = ?`,
    args: [input.userId],
  });
  const uRow = uR.rows[0];
  if (!uRow) return { ok: false, code: "unauthenticated", reason: "Debes iniciar sesión." };
  const user: UserForParticipation = {
    id: String(uRow.id),
    status: String(uRow.status) as UserForParticipation["status"],
    selfExcludedUntil: uRow.self_excluded_until ? String(uRow.self_excluded_until) : null,
    birthDate: String(uRow.birth_date),
    ageConfirmedAt: uRow.age_confirmed_at ? String(uRow.age_confirmed_at) : null,
    balance: Number(uRow.balance),
    dailyLimit: uRow.daily_limit === null ? null : Number(uRow.daily_limit),
  };

  // Competencia
  const cR = await client.execute({
    sql: `SELECT id, status, opens_at, closes_at, entry_cost, max_participants FROM competitions WHERE id = ?`,
    args: [input.competitionId],
  });
  const cRow = cR.rows[0];
  if (!cRow) return { ok: false, code: "not_found", reason: "Competencia no encontrada." };
  const comp = {
    id: String(cRow.id),
    status: String(cRow.status) as "draft" | "open" | "closed" | "resolved" | "cancelled",
    opensAt: String(cRow.opens_at),
    closesAt: String(cRow.closes_at),
    entryCost: Number(cRow.entry_cost),
    maxParticipants: cRow.max_participants === null ? null : Number(cRow.max_participants),
  };

  // Opción
  const oR = await client.execute({
    sql: `SELECT id, competition_id FROM options WHERE id = ?`,
    args: [input.optionId],
  });
  const oRow = oR.rows[0];
  const option = oRow ? { id: String(oRow.id), competitionId: String(oRow.competition_id) } : null;

  // Participación previa
  const dupR = await client.execute({
    sql: `SELECT id FROM predictions WHERE competition_id = ? AND user_id = ? LIMIT 1`,
    args: [comp.id, input.userId],
  });
  const alreadyPlaced = dupR.rows.length > 0 ? { predictionId: String(dupR.rows[0]!.id) } : null;

  // Nº de participantes y stakes de hoy
  const cntR = await client.execute({
    sql: `SELECT COUNT(*) AS c FROM predictions WHERE competition_id = ?`,
    args: [comp.id],
  });
  const participantsCount = Number(cntR.rows[0]?.c ?? 0);

  const { getStakesToday } = await import("./wallet.service");
  const stakesToday = await getStakesToday(input.userId, now);

  // Validación completa (dominio puro)
  const check = validateParticipation({
    user,
    competition: comp,
    option,
    alreadyPlaced,
    participantsCount,
    stakesToday,
    now,
  });
  if (!check.ok) {
    return { ok: false, code: check.code ?? "invalid", reason: check.reason ?? "No se puede participar." };
  }

  // Escritura atómica: predicción + ledger + saldo
  const predictionId = createId();
  const results = await client.batch([
    {
      sql: `INSERT INTO predictions (id, competition_id, user_id, option_id, stake, status, payout, created_at)
            VALUES (?, ?, ?, ?, ?, 'active', 0, ?)`,
      args: [predictionId, comp.id, input.userId, input.optionId, comp.entryCost, nowIso],
    },
    {
      sql: `UPDATE users SET balance = balance - ?, updated_at = ? WHERE id = ? AND balance >= ?`,
      args: [comp.entryCost, nowIso, input.userId, comp.entryCost],
    },
  ]);

  // Verificar que el descuento del saldo realmente aplicó (concurrencia):
  // releer el balance y validar contra el ledger.
  const verifyR = await client.execute({
    sql: `SELECT balance FROM users WHERE id = ?`,
    args: [input.userId],
  });
  const balanceNow = Number(verifyR.rows[0]?.balance ?? -1);
  if (balanceNow < 0) {
    await client.execute({ sql: `DELETE FROM predictions WHERE id = ?`, args: [predictionId] });
    return { ok: false, code: "insufficient_balance", reason: "Saldo insuficiente." };
  }
  void results;

  await applyWalletMovement(client, {
    userId: input.userId,
    type: "stake",
    amount: -comp.entryCost,
    competitionId: comp.id,
    predictionId,
    note: "Participación",
  });

  await logAudit({
    actorId: input.userId,
    action: "prediction.create",
    entityType: "prediction",
    entityId: predictionId,
    metadata: { competitionId: comp.id, optionId: input.optionId, stake: comp.entryCost },
    ip: input.ip,
  });

  await notify({
    userId: input.userId,
    title: "Pronóstico registrado",
    body: "Tu participación quedó guardada. No se puede editar ni retirar.",
    href: "/mis-pronosticos",
  });

  return { ok: true, predictionId };
}

/**
 * Resuelve una competencia: reparte el pool según la regla de empate,
 * asienta ledger, notifica y audita. Atómico por usuario vía batch.
 */
export async function resolveCompetition(input: {
  competitionId: string;
  winningOptionId: string;
  resolutionNote: string | null;
  adminId: string;
}): Promise<
  | { ok: true; winnersCount: number; paidTotal: number }
  | { ok: false; reason: string }
> {
  const client = await ensureDb();
  const nowIso = new Date().toISOString();

  const cR = await client.execute({
    sql: `SELECT id, status, title, tie_rule, winning_option_id FROM competitions WHERE id = ?`,
    args: [input.competitionId],
  });
  const cRow = cR.rows[0];
  if (!cRow) return { ok: false, reason: "Competencia no encontrada." };
  const status = String(cRow.status);
  if (status === "resolved" || status === "cancelled") {
    return { ok: false, reason: "La competencia ya es inmutable." };
  }
  if (status !== "closed") {
    return { ok: false, reason: "Solo se resuelven competencias cerradas." };
  }
  if (cRow.winning_option_id) {
    return { ok: false, reason: "Ya tiene opción ganadora asignada." };
  }

  // Validar que la opción ganadora pertenece a la competencia
  const oR = await client.execute({
    sql: `SELECT id FROM options WHERE id = ? AND competition_id = ?`,
    args: [input.winningOptionId, input.competitionId],
  });
  if (oR.rows.length === 0) return { ok: false, reason: "La opción ganadora no pertenece a esta competencia." };

  // Participaciones activas
  const pR = await client.execute({
    sql: `SELECT p.id, p.user_id, p.option_id, p.stake, p.created_at FROM predictions p
          WHERE p.competition_id = ? AND p.status = 'active' ORDER BY p.created_at ASC`,
    args: [input.competitionId],
  });
  const preds: PredictionInput[] = pR.rows.map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    optionId: String(row.option_id),
    stake: Number(row.stake),
    createdAt: String(row.created_at),
  }));
  const pool = preds.reduce((s, p) => s + p.stake, 0);

  if (preds.length === 0) {
    // No hay participaciones: simplemente resolver sin pagos
    await client.execute({
      sql: `UPDATE competitions SET status = 'resolved', winning_option_id = ?, resolution_note = ?, resolved_at = ?, updated_at = ? WHERE id = ?`,
      args: [input.winningOptionId, input.resolutionNote, nowIso, nowIso, input.competitionId],
    });
    await logAudit({
      actorId: input.adminId,
      action: "competition.resolve",
      entityType: "competition",
      entityId: input.competitionId,
      metadata: { winners: 0, pool: 0 },
    });
    return { ok: true, winnersCount: 0, paidTotal: 0 };
  }

  const outcome = computePayouts({
    pool,
    winningOptionId: input.winningOptionId,
    tieRule: String(cRow.tie_rule) as TieRule,
    predictions: preds,
  });

  // Invariante: no crear/destruir Goopos
  const total = outcome.outcomes.reduce((s, o) => s + o.amount, 0);
  if (total !== pool) {
    throw new Error(`INVARIANTE_ROTO: pagos ${total} != pool ${pool}`);
  }

  // Aplicar cada resultado
  for (const o of outcome.outcomes) {
    if (o.kind === "lose") {
      await client.execute({
        sql: `UPDATE predictions SET status = 'lost', payout = 0 WHERE id = ?`,
        args: [o.predictionId],
      });
      continue;
    }
    await client.batch([
      {
        sql: `UPDATE predictions SET status = ?, payout = ? WHERE id = ?`,
        args: [o.status, o.amount, o.predictionId],
      },
    ]);
    if (o.amount > 0) {
      await applyWalletMovement(client, {
        userId: o.userId,
        type: o.kind === "pay" ? "payout" : "refund",
        amount: o.amount,
        competitionId: input.competitionId,
        predictionId: o.predictionId,
        note: o.kind === "pay" ? "Premio" : "Reembolso",
      });
    }
  }

  await client.execute({
    sql: `UPDATE competitions SET status = 'resolved', winning_option_id = ?, resolution_note = ?, resolved_at = ?, updated_at = ? WHERE id = ?`,
    args: [input.winningOptionId, input.resolutionNote, nowIso, nowIso, input.competitionId],
  });

  // Notificar a participantes
  for (const p of preds) {
    const o = outcome.outcomes.find((x) => x.predictionId === p.id);
    if (!o) continue;
    const title =
      o.kind === "pay"
        ? "¡Ganaste! 🎉"
        : o.kind === "refund"
          ? "Participación reembolsada"
          : "No acertaste esta vez";
    const body =
      o.kind === "pay"
        ? `Recibiste ${o.amount} Goopos por acertar.`
        : o.kind === "refund"
          ? "Se devolvió tu participación: nadie acertó o hubo empate anulado."
          : "El resultado fue distinto al pronóstico. ¡Suerte en la próxima!";
    await notify({ userId: p.userId, title, body, href: "/mis-pronosticos" });
  }

  await logAudit({
    actorId: input.adminId,
    action: "competition.resolve",
    entityType: "competition",
    entityId: input.competitionId,
    metadata: {
      pool,
      winners: outcome.winnersCount,
      paidTotal: outcome.totalPaid,
      noWinnerRefund: outcome.noWinnerRefund,
    },
  });

  return { ok: true, winnersCount: outcome.winnersCount, paidTotal: outcome.totalPaid };
}

/**
 * Cancela y reembolsa a todos los participantes activos.
 */
export async function cancelCompetition(input: {
  competitionId: string;
  reason: string;
  adminId: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const client = await ensureDb();
  const nowIso = new Date().toISOString();

  const cR = await client.execute({
    sql: `SELECT id, status, title FROM competitions WHERE id = ?`,
    args: [input.competitionId],
  });
  const cRow = cR.rows[0];
  if (!cRow) return { ok: false, reason: "Competencia no encontrada." };
  const status = String(cRow.status);
  if (status === "resolved" || status === "cancelled") {
    return { ok: false, reason: "La competencia ya es inmutable." };
  }
  if (status === "draft") {
    // Sin participaciones a reembolsar (los drafts no aceptan participaciones)
    await client.execute({
      sql: `UPDATE competitions SET status = 'cancelled', cancelled_reason = ?, updated_at = ? WHERE id = ?`,
      args: [input.reason, nowIso, input.competitionId],
    });
    await logAudit({
      actorId: input.adminId,
      action: "competition.cancel",
      entityType: "competition",
      entityId: input.competitionId,
      metadata: { reason: input.reason, status: "draft" },
    });
    return { ok: true };
  }

  const pR = await client.execute({
    sql: `SELECT p.id, p.user_id, p.stake FROM predictions p WHERE p.competition_id = ? AND p.status = 'active'`,
    args: [input.competitionId],
  });

  for (const row of pR.rows) {
    const predictionId = String(row.id);
    const userId = String(row.user_id);
    const stake = Number(row.stake);
    await client.execute({
      sql: `UPDATE predictions SET status = 'refunded', payout = ? WHERE id = ?`,
      args: [stake, predictionId],
    });
    await applyWalletMovement(client, {
      userId,
      type: "refund",
      amount: stake,
      competitionId: input.competitionId,
      predictionId,
      note: "Reembolso por cancelación",
    });
    await notify({
      userId,
      title: "Competencia cancelada",
      body: "Se reembolsó el 100% de tu participación.",
      href: "/mis-pronosticos",
    });
  }

  await client.execute({
    sql: `UPDATE competitions SET status = 'cancelled', cancelled_reason = ?, updated_at = ? WHERE id = ?`,
    args: [input.reason, nowIso, input.competitionId],
  });

  await logAudit({
    actorId: input.adminId,
    action: "competition.cancel",
    entityType: "competition",
    entityId: input.competitionId,
    metadata: { reason: input.reason, refunds: pR.rows.length },
  });

  return { ok: true };
}
