import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureDb } from "@/server/db/client";
import { verifySessionToken, SESSION_COOKIE } from "@/server/session";
import type { SessionUser } from "@/types/domain";

/**
 * Devuelve el usuario de la sesión actual con los datos frescos de la DB
 * (saldo, estado, límites). Null si no hay sesión válida.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const client = await ensureDb();
  const r = await client.execute({
    sql: `SELECT id, email, username, display_name, role, status, balance, daily_limit, birth_date
          FROM users WHERE id = ?`,
    args: [payload.userId],
  });
  const row = r.rows[0];
  if (!row) return null;

  return {
    id: String(row.id),
    email: String(row.email),
    username: String(row.username),
    displayName: String(row.display_name),
    role: String(row.role) as SessionUser["role"],
    status: String(row.status) as SessionUser["status"],
    balance: Number(row.balance),
    dailyLimit: row.daily_limit === null ? null : Number(row.daily_limit),
    birthDate: String(row.birth_date),
  };
}

/** Requiere usuario; si no hay sesión redirige a /ingresar. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  return user;
}

/** Requiere rol admin; redirige si no lo es. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
