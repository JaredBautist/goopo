import { describe, it, expect } from "vitest";
import {
  selfExclusionUntil,
  resolveEffectiveDailyLimit,
} from "@/server/domain/responsible-play";
import {
  checkAge,
  isAdultOn,
  isSelfExcluded,
  dailyStakeUsed,
  validateParticipation,
  type UserForParticipation,
} from "@/server/domain/rules";

const NOW = new Date("2026-10-09T12:00:00Z");

describe("edades", () => {
  it("18 recién cumplidos cuenta como mayor", () => {
    const b = "2008-10-09";
    expect(isAdultOn(b, NOW)).toBe(true);
  });
  it("un día antes de cumplir 18 es menor", () => {
    const b = "2008-10-10";
    expect(isAdultOn(b, NOW)).toBe(false);
  });
  it("checkAge calcula simple", () => {
    expect(checkAge("2000-01-01", NOW)).toBe(26);
  });
});

describe("autoexclusión", () => {
  it("24h termina mañana a esta hora", () => {
    expect(selfExclusionUntil("24h", NOW)).toBe("2026-10-10T12:00:00.000Z");
  });
  it("30d termina en 30 días", () => {
    expect(selfExclusionUntil("30d", NOW)).toBe("2026-11-08T12:00:00.000Z");
  });
  it("usuario activo sin exclusión", () => {
    expect(isSelfExcluded({ status: "active", selfExcludedUntil: null }, NOW)).toBe(false);
  });
  it("excluido con fecha futura está activo la exclusión", () => {
    expect(
      isSelfExcluded(
        { status: "self_excluded", selfExcludedUntil: "2026-10-15T12:00:00Z" },
        NOW,
      ),
    ).toBe(true);
  });
  it("excluido con fecha pasada ya quedó desbloqueado", () => {
    expect(
      isSelfExcluded(
        { status: "self_excluded", selfExcludedUntil: "2026-10-01T12:00:00Z" },
        NOW,
      ),
    ).toBe(false);
  });
});

describe("límite diario", () => {
  it("sin límite nunca bloquea", () => {
    expect(dailyStakeUsed(5000, 100, null)).toBe(false);
  });
  it("bloquea al superar", () => {
    expect(dailyStakeUsed(450, 100, 500)).toBe(true);
  });
  it("justo en el límite permita", () => {
    expect(dailyStakeUsed(400, 100, 500)).toBe(false);
  });
});

describe("resolveEffectiveDailyLimit", () => {
  it("bajar aplica de inmediato", () => {
    const r = resolveEffectiveDailyLimit({
      currentLimit: 500,
      requested: routine(50),
      changedAt: NOW.toISOString(),
      now: NOW,
    });
    expect(r.effective).toBe(50);
    expect(r.pending).toBeNull();
  });
  it("subir queda pendiente 24h", () => {
    const r = resolveEffectiveDailyLimit({
      currentLimit: 500,
      requested: 1000,
      changedAt: NOW.toISOString(),
      now: NOW,
    });
    expect(r.effective).toBe(500);
    expect(r.pending).toBe(1000);
  });
  it("subir aplica tras 24h", () => {
    const r = resolveEffectiveDailyLimit({
      currentLimit: 500,
      requested: 1000,
      changedAt: new Date(NOW.getTime() - 25 * 3600_000).toISOString(),
      now: NOW,
    });
    expect(r.effective).toBe(1000);
    expect(r.pending).toBeNull();
  });
});

// helper
function routine(n: number) {
  return n;
}

describe("validateParticipation", () => {
  const baseComp = {
    id: "c1",
    status: "open" as const,
    opensAt: "2026-10-09T00:00:00Z",
    closesAt: "2026-10-10T00:00:00Z",
    entryCost: 100,
    maxParticipants: null,
  };
  const baseUser: UserForParticipation = {
    id: "u1",
    status: "active",
    selfExcludedUntil: null,
    birthDate: "1990-01-01",
    ageConfirmedAt: "2026-01-01T00:00:00Z",
    balance: 1000,
    dailyLimit: null,
  };

  it("acepta cuando todo es válido", () => {
    const r = validateParticipation({
      user: baseUser,
      competition: baseComp,
      option: { id: "o1", competitionId: "c1" },
      alreadyPlaced: null,
      participantsCount: 0,
      stakesToday: 0,
      now: NOW,
    });
    expect(r.ok).toBe(true);
  });

  it("rechaza menor de edad", () => {
    const r = validateParticipation({
      user: { ...baseUser, birthDate: "2015-01-01" },
      competition: baseComp,
      option: { id: "o1", competitionId: "c1" },
      alreadyPlaced: null,
      participantsCount: 0,
      stakesToday: 0,
      now: NOW,
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("underage");
  });

  it("rechaza opción de otra competencia", () => {
    const r = validateParticipation({
      user: baseUser,
      competition: baseComp,
      option: { id: "oX", competitionId: "otra" },
      alreadyPlaced: null,
      participantsCount: 0,
      stakesToday: 0,
      now: NOW,
    });
    expect(r.code).toBe("option_invalid");
  });

  it("rechaza duplicada", () => {
    const r = validateParticipation({
      user: baseUser,
      competition: baseComp,
      option: { id: "o1", competitionId: "c1" },
      alreadyPlaced: { predictionId: "p1" },
      participantsCount: 0,
      stakesToday: 0,
      now: NOW,
    });
    expect(r.code).toBe("already_placed");
  });

  it("rechaza cupo lleno", () => {
    const r = validateParticipation({
      user: baseUser,
      competition: { ...baseComp, maxParticipants: 2 },
      option: { id: "o1", competitionId: "c1" },
      alreadyPlaced: null,
      participantsCount: 2,
      stakesToday: 0,
      now: NOW,
    });
    expect(r.code).toBe("full");
  });

  it("rechaza saldo insuficiente", () => {
    const r = validateParticipation({
      user: { ...baseUser, balance: 50 },
      competition: baseComp,
      option: { id: "o1", competitionId: "c1" },
      alreadyPlaced: null,
      participantsCount: 0,
      stakesToday: 0,
      now: NOW,
    });
    expect(r.code).toBe("insufficient_balance");
  });

  it("rechaza límite diario superado", () => {
    const r = validateParticipation({
      user: { ...baseUser, dailyLimit: 200 },
      competition: baseComp,
      option: { id: "o1", competitionId: "c1" },
      alreadyPlaced: null,
      participantsCount: 0,
      stakesToday: 150,
      now: NOW,
    });
    expect(r.code).toBe("daily_limit");
  });

  it("rechaza usuario autoexcluido", () => {
    const r = validateParticipation({
      user: { ...baseUser, status: "self_excluded", selfExcludedUntil: "2026-11-01T00:00:00Z" },
      competition: baseComp,
      option: { id: "o1", competitionId: "c1" },
      alreadyPlaced: null,
      participantsCount: 0,
      stakesToday: 0,
      now: NOW,
    });
    expect(r.code).toBe("user_status");
  });

  it("rechaza competencia cerrada", () => {
    const r = validateParticipation({
      user: baseUser,
      competition: { ...baseComp, status: "closed" },
      option: { id: "o1", competitionId: "c1" },
      alreadyPlaced: null,
      participantsCount: 0,
      stakesToday: 0,
      now: NOW,
    });
    expect(r.code).toBe("not_open");
  });
});
