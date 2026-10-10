import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/types/domain";

export const SESSION_COOKIE = "goopo_session";
const SESSION_DAYS = 7;
const ISSUER = "goopo";

/**
 * Secreto de demostración: se usa solo si AUTH_SECRET no está definida
 * (caso "subir a Vercel y listo"). Para producción real, define AUTH_SECRET.
 */
function getSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ?? "goopo-demo-secret-do-not-use-in-production-1234567890";
  if (!process.env.AUTH_SECRET) {
    console.warn(
      "[goopo] AUTH_SECRET no definida: usando secreto de demostración. Define AUTH_SECRET para un despliegue serio.",
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  role: Role;
  username: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { issuer: ISSUER });
    if (!isValidPayload(payload)) return null;
    return {
      userId: payload.userId as string,
      role: payload.role as Role,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

function isValidPayload(p: JWTPayload): boolean {
  return typeof p.userId === "string" && (p.role === "participant" || p.role === "admin");
}

/** Lee la sesión desde las cookies (Server Components / Server Actions). */
export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Establece la cookie de sesión (7 días). */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

/** Borra la cookie de sesión. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 3600;
