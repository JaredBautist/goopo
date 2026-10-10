/** Constantes del dominio Goopo. */
export const SIGNUP_BONUS = 1000;
export const DAILY_BONUS = 200;
export const DAILY_BONUS_THRESHOLD = 200; // solo si el saldo < 200
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_AGE_YEARS = 18;
export const MAX_OPTIONS = 8;
export const MIN_OPTIONS = 2;
export const RATE_LIMIT_LOGIN = 5; // intentos por minuto
export const RATE_LIMIT_PREDICT = 10; // participaciones por minuto

/** Formatea Goopos: 1250 -> "1.250 G" (es-CO, sin decimales). */
export function formatGoopos(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const formatted = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(abs);
  return `${sign}${formatted} G`;
}
