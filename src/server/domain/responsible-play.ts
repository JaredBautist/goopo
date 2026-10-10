/**
 * Juego responsable: límites diarios y autoexclusión. PURO.
 */

import { MIN_AGE_YEARS } from "@/lib/constants";

export const DAILY_LIMIT_MIN = 50;
export const SELF_EXCLUSION_OPTIONS_HOURS = { "24h": 24, "7d": 168, "30d": 720 } as const;
export type SelfExclusionPeriod = keyof typeof SELF_EXCLUSION_OPTIONS_HOURS;

/** Calcula la fecha de fin de autoexclusión. */
export function selfExclusionUntil(period: SelfExclusionPeriod, now: Date): string {
  const hours = SELF_EXCLUSION_OPTIONS_HOURS[period];
  return new Date(now.getTime() + hours * 3600_000).toISOString();
}

/**
 * Límite diario: bajarlo aplica ya; subirlo aplica tras 24 h.
 */
export function resolveEffectiveDailyLimit(input: {
  currentLimit: number | null;
  requested: number | null;
  changedAt: string | null;
  now: Date;
}): { effective: number | null; pending: number | null } {
  let requested = input.requested;
  const { currentLimit, changedAt, now } = input;

  if (requested === null) return { effective: null, pending: null };
  if (requested < DAILY_LIMIT_MIN) requested = DAILY_LIMIT_MIN;

  if (currentLimit === null || requested <= currentLimit) {
    return { effective: requested, pending: null };
  }

  // Subir el límite requiere 24 h de espera (cooling-off).
  const changed = changedAt ? new Date(changedAt) : null;
  const canApply =
    changed !== null && now.getTime() - changed.getTime() >= 24 * 3600_000;
  if (canApply) return { effective: requested, pending: null };
  return { effective: currentLimit, pending: requested };
}

export { MIN_AGE_YEARS };
