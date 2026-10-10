import { ensureDb } from "@/server/db/client";
import { createId } from "@/lib/id";
import { DAILY_BONUS, DAILY_BONUS_THRESHOLD } from "@/lib/constants";
import type { WalletTxType } from "@/types/domain";

/**
 * Movimiento atómico de saldo: actualiza users.balance y añade la línea
 * del ledger con balance_after. Debe llamarse DENTRO de un flujo transaccional
 * (para SQLite en un solo proceso client.execute es sucesivo; para garatía
 * estricta usamos batch del cliente libsql).
 */
export async function applyWalletMovement(
  client: Awaited<ReturnType<typeof ensureDb>>,
  input: {
    userId: string;
    type: WalletTxType;
    amount: number; // con signo
    competitionId?: string;
    predictionId?: string;
    note?: string;
  },
): Promise<{ newBalance: number }> {
  const cur = await client.execute({
    sql: `SELECT balance FROM users WHERE id = ?`,
    args: [input.userId],
  });
  const current = Number(cur.rows[0]?.balance ?? 0);
  const newBalance = current + input.amount;
  if (newBalance < 0) {
    throw new Error("SALDO_INSUFICIENTE");
  }

  await client.batch([
    {
      sql: `UPDATE users SET balance = ?, updated_at = ? WHERE id = ?`,
      args: [newBalance, new Date().toISOString(), input.userId],
    },
    {
      sql: `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_after, competition_id, prediction_id, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        createId(),
        input.userId,
        input.type,
        input.amount,
        newBalance,
        input.competitionId ?? null,
        input.predictionId ?? null,
        input.note ?? null,
        new Date().toISOString(),
      ],
    },
  ]);

  return { newBalance };
}

export type LedgerRow = {
  id: string;
  type: WalletTxType;
  amount: number;
  balanceAfter: number;
  competitionId: string | null;
  note: string | null;
  createdAt: string;
};

export async function listLedger(
  userId: string,
  page = 0,
  pageSize = 25,
): Promise<{ rows: LedgerRow[]; total: number }> {
  const client = await ensureDb();
  const totalR = await client.execute({
    sql: `SELECT COUNT(*) AS c FROM wallet_transactions WHERE user_id = ?`,
    args: [userId],
  });
  const r = await client.execute({
    sql: `SELECT id, type, amount, balance_after, competition_id, note, created_at
          FROM wallet_transactions WHERE user_id = ?
          ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    args: [userId, pageSize, page * pageSize],
  });
  return {
    total: Number(totalR.rows[0]?.c ?? 0),
    rows: r.rows.map((row) => ({
      id: String(row.id),
      type: String(row.type) as WalletTxType,
      amount: Number(row.amount),
      balanceAfter: Number(row.balance_after),
      competitionId: row.competition_id ? String(row.competition_id) : null,
      note: row.note ? String(row.note) : null,
      createdAt: String(row.created_at),
    })),
  };
}

export async function listLedgerAll(userId: string): Promise<LedgerRow[]> {
  const client = await ensureDb();
  const r = await client.execute({
    sql: `SELECT id, type, amount, balance_after, competition_id, note, created_at
          FROM wallet_transactions WHERE user_id = ? ORDER BY created_at ASC`,
    args: [userId],
  });
  return r.rows.map((row) => ({
    id: String(row.id),
    type: String(row.type) as WalletTxType,
    amount: Number(row.amount),
    balanceAfter: Number(row.balance_after),
    competitionId: row.competition_id ? String(row.competition_id) : null,
    note: row.note ? String(row.note) : null,
    createdAt: String(row.created_at),
  }));
}

/** Suma de stakes del día (para límite diario), en zona horaria de Colombia. */
export async function getStakesToday(userId: string, now = new Date()): Promise<number> {
  const client = await ensureDb();
  // Aproximación día local Bogotá (UTC-5)
  const start = new Date(now.getTime() - (5 * 3600 + (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60)) * 1000);
  start.setUTCHours(0, 0, 0, 0);
  const startIso = new Date(start.getTime() - 5 * 3600_000).toISOString();
  const r = await client.execute({
    sql: `SELECT COALESCE(SUM(ABS(amount)), 0) AS s FROM wallet_transactions
          WHERE user_id = ? AND type = 'stake' AND created_at >= ?`,
    args: [userId, startIso],
  });
  return Number(r.rows[0]?.s ?? 0);
}

/** Recarga diaria demo: +200 G si saldo < 200 y no se ha reclamado en 24 h. */
export async function claimDailyBonus(userId: string): Promise<
  { ok: true; amount: number } | { ok: false; reason: "balance_too_high" | "not_24h_yet" }
> {
  const client = await ensureDb();
  const cur = await client.execute({
    sql: `SELECT balance FROM users WHERE id = ?`,
    args: [userId],
  });
  const balance = Number(cur.rows[0]?.balance ?? 0);
  if (balance >= DAILY_BONUS_THRESHOLD) {
    return { ok: false, reason: "balance_too_high" };
  }
  const last = await client.execute({
    sql: `SELECT MAX(created_at) AS last FROM wallet_transactions WHERE user_id = ? AND type = 'daily_bonus'`,
    args: [userId],
  });
  const lastAt = last.rows[0]?.last ? new Date(String(last.rows[0].last)) : null;
  if (lastAt && Date.now() - lastAt.getTime() < 24 * 3600_000) {
    return { ok: false, reason: "not_24h_yet" };
  }
  await applyWalletMovement(client, {
    userId,
    type: "daily_bonus",
    amount: DAILY_BONUS,
    note: "Recarga diaria demo",
  });
  return { ok: true, amount: DAILY_BONUS };
}

/** Recarga demo de Goopos: permite a usuarios de prueba sumar fondos para explorar la plataforma. */
export async function rechargeDemoWallet(input: {
  userId: string;
  amount: number;
}): Promise<{ ok: true; amount: number; newBalance: number }> {
  if (input.amount <= 0 || input.amount > 10_000) {
    throw new Error("MONTO_INVALIDO");
  }
  const client = await ensureDb();
  const { newBalance } = await applyWalletMovement(client, {
    userId: input.userId,
    type: "daily_bonus",
    amount: input.amount,
    note: `Recarga demo de Goopos (+${input.amount} G)`,
  });
  return { ok: true, amount: input.amount, newBalance };
}

/** Ajuste manual de saldo (admin), siempre con motivo. */
export async function adminAdjustBalance(input: {
  userId: string;
  amount: number; // con signo
  reason: string;
}): Promise<void> {
  const client = await ensureDb();
  await applyWalletMovement(client, {
    userId: input.userId,
    type: "admin_adjust",
    amount: input.amount,
    note: input.reason,
  });
}

export function ledgerToCsv(rows: LedgerRow[]): string {
  const lines = ["tipo,monto,saldo_posterior,fecha,referencia,nota"];
  for (const r of rows) {
    const note = (r.note ?? "").replaceAll('"', '""');
    const comp = r.competitionId ?? "";
    lines.push(
      [r.type, String(r.amount), String(r.balanceAfter), r.createdAt, comp, `"${note}"`].join(","),
    );
  }
  return lines.join("\n");
}
