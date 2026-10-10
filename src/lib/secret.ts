/**
 * Secreto de demostración: se usa solo si AUTH_SECRET no está definida
 * (caso "subir a Vercel y listo"). Para producción real, define AUTH_SECRET.
 */
export function getAuthSecretValue(): string {
  return (
    process.env.AUTH_SECRET ??
    "goopo-demo-secret-do-not-use-in-production-1234567890"
  );
}

export function isUsingDemoSecret(): boolean {
  return !process.env.AUTH_SECRET;
}
