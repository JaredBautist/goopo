import bcrypt from "bcryptjs";
import { ensureDb } from "@/server/db/client";
import { createId } from "@/lib/id";
import { SIGNUP_BONUS } from "@/lib/constants";
import { checkAge } from "@/server/domain/rules";

const BCRYPT_ROUNDS = 10;

export type RegisterInput = {
  email: string;
  username: string;
  displayName: string;
  password: string;
  birthDate: string;
};

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: "duplicate_email" | "duplicate_username" | "underage" | "weak_password" };

export function passwordMeetsPolicy(pw: string): boolean {
  return pw.length >= 8 && /[a-z]/i.test(pw) && /\d/.test(pw);
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  if (!passwordMeetsPolicy(input.password)) {
    return { ok: false, error: "weak_password" };
  }
  const now = new Date();
  if (checkAge(input.birthDate, now) < 18) {
    return { ok: false, error: "underage" };
  }

  const client = await ensureDb();
  const id = createId();
  const email = input.email.toLowerCase().trim();
  const username = input.username.toLowerCase().trim();
  const nowIso = now.toISOString();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    await client.execute({
      sql: `INSERT INTO users (id, email, username, display_name, password_hash, role, birth_date, age_confirmed_at, status, balance, created_at, updated_at, last_login_at)
            VALUES (?, ?, ?, ?, ?, 'participant', ?, ?, 'active', ?, ?, ?, ?)`,
      args: [
        id,
        email,
        username,
        input.displayName.trim() || username,
        passwordHash,
        input.birthDate,
        nowIso, // age_confirmed_at (el registro valida mayoría de edad)
        SIGNUP_BONUS,
        nowIso,
        nowIso,
        nowIso,
      ],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("users_email_uq")) return { ok: false, error: "duplicate_email" };
    if (msg.includes("users_username_uq")) return { ok: false, error: "duplicate_username" };
    throw err;
  }

  // Ledger: bonus de bienvenida
  await client.execute({
    sql: `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_after, note, created_at)
          VALUES (?, ?, 'signup_bonus', ?, ?, 'Bonificación de bienvenida (demo)', ?)`,
    args: [createId(), id, SIGNUP_BONUS, SIGNUP_BONUS, nowIso],
  });

  return { ok: true, userId: id };
}

export type LoginResult =
  | { ok: true; userId: string; role: "participant" | "admin"; username: string; mustConfirmAge: boolean }
  | { ok: false; error: "invalid_credentials" };

/**
 * Login con mensaje genérico en caso de fallo (no revela si existe el email).
 */
export async function authenticate(
  identifier: string,
  password: string,
): Promise<LoginResult> {
  const client = await ensureDb();
  const idOrEmail = identifier.toLowerCase().trim();
  const r = await client.execute({
    sql: `SELECT id, password_hash, role, username, birth_date, age_confirmed_at FROM users
          WHERE email = ? OR username = ? LIMIT 1`,
    args: [idOrEmail, idOrEmail],
  });
  const row = r.rows[0];
  if (!row) {
    // Coste constante aproximado para no filtrar por tiempo de respuesta.
    await bcrypt.compare(password, "$2a$10$C6UzMDM.H6dfI/f/IKcEeO7VVZkOGBGTstRpMxrRstLPkxEFXm.gG");
    return { ok: false, error: "invalid_credentials" };
  }

  const ok = await bcrypt.compare(password, String(row.password_hash));
  if (!ok) return { ok: false, error: "invalid_credentials" };

  const nowIso = new Date().toISOString();
  await client.execute({
    sql: `UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?`,
    args: [nowIso, nowIso, String(row.id)],
  });

  const hasAge =
    Boolean(row.age_confirmed_at) &&
    checkAge(String(row.birth_date), new Date()) >= 18;

  return {
    ok: true,
    userId: String(row.id),
    role: String(row.role) as "participant" | "admin",
    username: String(row.username),
    mustConfirmAge: !hasAge,
  };
}

