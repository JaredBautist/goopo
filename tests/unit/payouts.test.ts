import { describe, it, expect } from "vitest";
import { computePayouts, type PredictionInput } from "@/server/domain/payouts";

function pred(id: string, userId: string, optionId: string, stake: number, createdAt: string): PredictionInput {
  return { id, userId, optionId, stake, createdAt };
}

const T0 = "2024-01-01T00:00:00.000Z";

describe("payouts — un solo ganador", () => {
  it("se lleva todo el pool", () => {
    const preds = [
      pred("p1", "u1", "A", 100, T0),
      pred("p2", "u2", "B", 100, T0),
      pred("p3", "u3", "B", 100, T0),
    ];
    const r = computePayouts({ pool: 300, winningOptionId: "A", tieRule: "split_equal", predictions: preds });
    expect(r.winnersCount).toBe(1);
    const winner = r.outcomes.find((o) => o.kind === "pay")!;
    expect(winner.amount).toBe(300);
    expect(r.totalPaid).toBe(300);
  });
});

describe("payouts — split_equal", () => {
  it("reparte sin residuo", () => {
    const preds = [
      pred("p1", "u1", "A", 100, T0),
      pred("p2", "u2", "A", 100, T0),
      pred("p3", "u3", "B", 100, T0),
    ];
    const r = computePayouts({ pool: 200, winningOptionId: "A", tieRule: "split_equal", predictions: preds });
    const pays = r.outcomes.filter((o) => o.kind === "pay");
    expect(pays).toHaveLength(2);
    expect(pays.every((o) => o.amount === 100)).toBe(true);
    expect(r.totalPaid).toBe(200);
  });

  it("asigna el residuo al primer ganador", () => {
    const preds = [
      pred("p1", "u1", "A", 100, T0),      // primero: se lleva el residuo
      pred("p2", "u2", "A", 100, T0 + "1"),
      pred("p3", "u3", "A", 100, "2024-01-02T00:00:00.000Z"),
      pred("p4", "u4", "B", 100, T0),
    ];
    const r = computePayouts({ pool: 1000, winningOptionId: "A", tieRule: "split_equal", predictions: preds });
    expect(r.outcomes.filter((o) => o.kind === "pay")).toHaveLength(3);
    const amounts = r.outcomes.filter((o) => o.kind === "pay").map((o) => o.amount).sort((a, b) => b - a);
    expect(amounts[0]).toBe(334); // 333 + residuo 1
    expect(r.totalPaid).toBe(1000);
  });

  it("invariante: sum(payouts)==pool con datos aleatorios con semilla", () => {
    let s = 42;
    const rand = () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
    for (let i = 0; i < 300; i++) {
      const preds = Array.from({ length: 2 + Math.floor(rand() * 10) }, (_, j) => {
        const optionId = rand() < 0.5 ? "A" : "B";
        return pred(`p${j}`, `u${j}`, optionId, Math.max(1, Math.floor(rand() * 500)), tIso(j));
      });
      const pool = preds.reduce((s2, p) => s2 + p.stake, 0);
      const winId = rand() < 0.5 ? "A" : "B";
      const rule = rand() < 0.33 ? "earliest_wins" : rand() < 0.5 ? "refund_all" : "split_equal";
      const r = computePayouts({
        pool,
        winningOptionId: winId,
        tieRule: rule as "split_equal" | "earliest_wins" | "refund_all",
        predictions: preds,
      });
      const sums = r.outcomes.reduce((s2, o) => s2 + o.amount, 0);
      expect(sums).toBe(pool);
    }
  });
});

describe("payouts — earliest_wins", () => {
  it("el primero en acertar se lleva todo (desempate por created_at, luego id)", () => {
    const preds = [
      pred("p2", "u2", "A", 100, "2024-01-02T00:00:00.000Z"),
      pred("p1", "u1", "A", 100, T0),
      pred("p3", "u3", "A", 100, "2024-01-03T00:00:00.000Z"),
      pred("p4", "u4", "B", 100, T0),
    ];
    const r = computePayouts({ pool: 400, winningOptionId: "A", tieRule: "earliest_wins", predictions: preds });
    const winner = r.outcomes.find((o) => o.kind === "pay")!;
    expect(winner.predictionId).toBe("p1");
    expect(winner.amount).toBe(400);
    expect(r.totalPaid).toBe(400);
  });
});

describe("payouts — refund_all", () => {
  it("con un ganador se lleva el pool", () => {
    const preds = [pred("p1", "u1", "A", 100, T0), pred("p2", "u2", "B", 100, T0)];
    const r = computePayouts({ pool: 200, winningOptionId: "A", tieRule: "refund_all", predictions: preds });
    expect(r.winnersCount).toBe(1);
    expect(r.totalPaid).toBe(200);
  });

  it("con empate, todos son reembolsados", () => {
    const preds = [
      pred("p1", "u1", "A", 100, T0),
      pred("p2", "u2", "A", 100, T0 + "1"),
      pred("p3", "u3", "B", 100, T0),
    ];
    const r = computePayouts({ pool: 300, winningOptionId: "A", tieRule: "refund_all", predictions: preds });
    expect(r.outcomes.every((o) => o.kind === "refund")).toBe(true);
    expect(r.totalPaid).toBe(300);
  });
});

describe("payouts — nadie acertó", () => {
  it("reembolsa el 100% a todos", () => {
    const preds = [
      pred("p1", "u1", "B", 100, T0),
      pred("p2", "u2", "C", 100, T0),
    ];
    const r = computePayouts({ pool: 200, winningOptionId: "A", tieRule: "split_equal", predictions: preds });
    expect(r.noWinnerRefund).toBe(true);
    expect(r.totalPaid).toBe(200);
    expect(r.outcomes.every((o) => o.kind === "refund" && o.amount === 100)).toBe(true);
  });
});

function tIso(j: number): string {
  return new Date(Date.parse(T0) + j * 1000).toISOString();
}
