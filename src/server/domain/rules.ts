/**
 * Validaciones de negocio para participar. PURO — recibe datos y decide.
 */

import { MIN_AGE_YEARS } from "@/lib/constants";

export type UserForParticipation = {
  id: string;
  status: "active" | "self_excluded" | "suspended";
  selfExcludedUntil: string | null;
  birthDate: string; // YYYY-MM-DD
  ageConfirmedAt: string | null;
  balance: number;
  dailyLimit: number | null;
};

export type CompetitionForParticipation = {
  id: string;
  status: "draft" | "open" | "closed" | "resolved" | "cancelled";
  opensAt: string;
  closesAt: string;
  entryCost: number;
  maxParticipants: number | null;
};

export type WeeklyOption = { id: string; competitionId: string };

export type AlreadyPlaced = { predictionId: string };

export type ParticipationCheck = {
  ok: boolean;
  reason?: string;
  code?:
    | "unauthenticated"
    | "user_status"
    | "underage"
    | "not_open"
    | "outside_window"
    | "option_invalid"
    | "already_placed"
    | "full"
    | "insufficient_balance"
    | "daily_limit";
};

export function checkAge(birthDate: string, now: Date): number {
  const b = new Date(birthDate + "T00:00:00Z");
  if (Number.isNaN(b.getTime())) return -1;
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export function isAdultOn(birthDate: string, at: Date): boolean {
  return checkAge(birthDate, at) >= MIN_AGE_YEARS;
}

export function isSelfExcluded(user: {
  status: string;
  selfExcludedUntil: string | null;
}, now: Date): boolean {
  if (user.status === "self_excluded") {
    if (!user.selfExcludedUntil) return true; // sin fecha, permanente
    return new Date(user.selfExcludedUntil) > now;
  }
  return false;
}

export function dailyStakeUsed(
  stakesToday: number,
  entryCost: number,
  dailyLimit: number | null,
): boolean {
  if (dailyLimit === null) return false;
  return stakesToday + entryCost > dailyLimit;
}

/**
 * Valida toda la participated-precondition de forma secuencial.
 * Devuelve la primera razón de rechazo, o ok.
 */
export function validateParticipation(input: {
  user: UserForParticipation | null;
  competition: CompetitionForParticipation;
  option: WeeklyOption | null;
  alreadyPlaced: AlreadyPlaced | null;
  participantsCount: number;
  stakesToday: number;
  now: Date;
}): ParticipationCheck {
  const { user, competition: comp, option, alreadyPlaced, participantsCount, stakesToday, now } = input;

  if (!user) return { ok: false, code: "unauthenticated", reason: "Debes iniciar sesión para participar." };

  if (user.status === "suspended") {
    return { ok: false, code: "user_status", reason: "Tu cuenta está suspendida." };
  }
  if (isSelfExcluded(user, now)) {
    return {
      ok: false,
      code: "user_status",
      reason: `Tienes una autoexclusión activa hasta ${user.selfExcludedUntil ?? "fecha indefinida"}.`,
    };
  }
  if (!user.ageConfirmedAt || !isAdultOn(user.birthDate, now)) {
    return { ok: false, code: "underage", reason: "Debes confirmar ser mayor de 18 años." };
  }
  if (comp.status !== "open") {
    return { ok: false, code: "not_open", reason: "La competencia no está abierta." };
  }
  const nowIso = now.toISOString();
  if (comp.opensAt > nowIso) {
    return { ok: false, code: "outside_window", reason: "La competencia aún no abre." };
  }
  if (nowIso >= comp.closesAt) {
    return { ok: false, code: "outside_window", reason: "El periodo de participación ya cerró." };
  }
  if (!option || option.competitionId !== comp.id) {
    return { ok: false, code: "option_invalid", reason: "Opción inválida para esta competencia." };
  }
  if (alreadyPlaced) {
    return { ok: false, code: "already_placed", reason: "Ya participaste en esta competencia." };
  }
  if (comp.maxParticipants !== null && participantsCount >= comp.maxParticipants) {
    return { ok: false, code: "full", reason: "Cupo máximo de participantes alcanzado." };
  }
  if (user.balance < comp.entryCost) {
    return {
      ok: false,
      code: "insufficient_balance",
      reason: `Saldo insuficiente. Necesitas ${comp.entryCost} G y tienes ${user.balance} G.`,
    };
  }
  if (dailyStakeUsed(stakesToday, comp.entryCost, user.dailyLimit)) {
    return {
      ok: false,
      code: "daily_limit",
      reason: `Superarías tu límite diario de ${user.dailyLimit} G en apuestas.`,
    };
  }

  return { ok: true };
}
