/**
 * Cálculo de reparto de premios (PURO, sin acceso a base de datos).
 *
 * Invariante: la suma de todos los pagos/reembolsos devueltos es EXACTAMENTE
 * igual al pool. No se crean ni destruyen Goopos.
 */

import type { TieRule } from "@/types/domain";

export type PredictionInput = {
  id: string;
  userId: string;
  optionId: string;
  stake: number;
  createdAt: string; // ISO; desempate temporal
  /** Pre-cálculo opcional para el orden estable entre predicciones con el mismo createdAt. */
  seq?: number;
};

export type ResolutionInput = {
  pool: number;
  winningOptionId: string | null;
  tieRule: TieRule;
  predictions: PredictionInput[];
};

export type Outcome =
  | { kind: "pay"; predictionId: string; userId: string; amount: number; status: "won" }
  | { kind: "refund"; predictionId: string; userId: string; amount: number; status: "refunded" }
  | { kind: "lose"; predictionId: string; userId: string; amount: 0; status: "lost" };

export type ResolutionResult = {
  outcomes: Outcome[];
  totalPaid: number; // suma de pagos + reembolsos (debe === pool cuando hay preds)
  winnersCount: number;
  noWinnerRefund: boolean;
};

/** Ordena predicciones por createdAt asc, luego id (estable, determinista). */
function stableSort(preds: PredictionInput[]): PredictionInput[] {
  return [...preds].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) ||
      (a.seq ?? 0) - (b.seq ?? 0) ||
      a.id.localeCompare(b.id),
  );
}

/**
 * Calcula el reparto del pool según la regla de empate.
 * Pendiente de validación externa: pool >= 0.
 */
export function computePayouts(input: ResolutionInput): ResolutionResult {
  const { pool, winningOptionId, tieRule } = input;
  const preds = stableSort(input.predictions);

  if (preds.length === 0) {
    return { outcomes: [], totalPaid: 0, winnersCount: 0, noWinnerRefund: false };
  }

  // Sin ganadores → reembolso a todos.
  const winners = preds.filter((p) => winningOptionId !== null && p.optionId === winningOptionId);

  if (winners.length === 0) {
    const outcomes: Outcome[] = preds.map((p) => ({
      kind: "refund",
      predictionId: p.id,
      userId: p.userId,
      amount: p.stake,
      status: "refunded",
    }));
    return {
      outcomes,
      totalPaid: preds.reduce((s, p) => s + p.stake, 0),
      winnersCount: 0,
      noWinnerRefund: true,
    };
  }

  if (tieRule === "earliest_wins") {
    const outcomes: Outcome[] = [];
    for (const p of preds) {
      if (p === winners[0]) {
        outcomes.push({ kind: "pay", predictionId: p.id, userId: p.userId, amount: pool, status: "won" });
      } else if (winners.includes(p)) {
        outcomes.push({ kind: "lose", predictionId: p.id, userId: p.userId, amount: 0, status: "lost" });
      } else {
        outcomes.push({ kind: "lose", predictionId: p.id, userId: p.userId, amount: 0, status: "lost" });
      }
    }
    return { outcomes, totalPaid: pool, winnersCount: 1, noWinnerRefund: false };
  }

  if (tieRule === "refund_all") {
    if (winners.length > 1) {
      const outcomes: Outcome[] = preds.map((p) => ({
        kind: "refund",
        predictionId: p.id,
        userId: p.userId,
        amount: p.stake,
        status: "refunded", // todos (ganadores y no ganadores) reembolsados
      }));
      return {
        outcomes,
        totalPaid: preds.reduce((s, p) => s + p.stake, 0),
        winnersCount: winners.length,
        noWinnerRefund: false,
      };
    }
    const outcomes: Outcome[] = [];
    for (const p of preds) {
      if (winners.includes(p)) {
        outcomes.push({ kind: "pay", predictionId: p.id, userId: p.userId, amount: pool, status: "won" });
      } else {
        outcomes.push({ kind: "lose", predictionId: p.id, userId: p.userId, amount: 0, status: "lost" });
      }
    }
    return { outcomes, totalPaid: pool, winnersCount: 1, noWinnerRefund: false };
  }

  // split_equal (regla por defecto)
  const base = Math.floor(pool / winners.length);
  const remainder = pool - base * winners.length; // 0..winners.length-1
  const outcomes: Outcome[] = [];
  let remainderLeft = remainder;
  for (const p of preds) {
    if (winners.includes(p)) {
      let amount = base;
      if (remainderLeft > 0) {
        amount += remainderLeft; // el primer ganador (orden estable) se lleva el residuo completo
        remainderLeft = 0;
      }
      outcomes.push({ kind: "pay", predictionId: p.id, userId: p.userId, amount, status: "won" });
    } else {
      outcomes.push({ kind: "lose", predictionId: p.id, userId: p.userId, amount: 0, status: "lost" });
    }
  }
  return { outcomes, totalPaid: pool, winnersCount: winners.length, noWinnerRefund: false };
}
