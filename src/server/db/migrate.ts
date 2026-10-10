import type { Client } from "@libsql/client";

/** Idempotent DDL migration, executable at runtime (Vercel /tmp mode). */
export async function runMigrations(client: Client): Promise<void> {
  await client.execute("PRAGMA foreign_keys = ON;");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant','admin')),
      birth_date TEXT NOT NULL,
      age_confirmed_at TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','self_excluded','suspended')),
      self_excluded_until TEXT,
      balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
      daily_limit INTEGER,
      daily_limit_changed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      last_login_at TEXT
    );
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS competitions (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'otro',
      cover_emoji TEXT NOT NULL DEFAULT '🎲',
      rules_text TEXT NOT NULL,
      entry_cost INTEGER NOT NULL CHECK (entry_cost > 0),
      max_participants INTEGER,
      opens_at TEXT NOT NULL,
      closes_at TEXT NOT NULL CHECK (closes_at > opens_at),
      expected_result_at TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed','resolved','cancelled')),
      tie_rule TEXT NOT NULL DEFAULT 'split_equal' CHECK (tie_rule IN ('split_equal','earliest_wins','refund_all')),
      winning_option_id TEXT,
      resolution_note TEXT,
      resolved_at TEXT,
      cancelled_reason TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS options (
      id TEXT PRIMARY KEY,
      competition_id TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      description TEXT,
      position INTEGER NOT NULL
    );
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      competition_id TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      option_id TEXT NOT NULL REFERENCES options(id),
      stake INTEGER NOT NULL CHECK (stake > 0),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','won','lost','refunded')),
      payout INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK (type IN ('signup_bonus','stake','payout','refund','daily_bonus','admin_adjust')),
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
      competition_id TEXT,
      prediction_id TEXT,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      metadata TEXT,
      ip TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      href TEXT,
      read_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);

  const indexes: [string, string][] = [
    ["users_email_uq", "CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users(email)"],
    ["users_username_uq", "CREATE UNIQUE INDEX IF NOT EXISTS users_username_uq ON users(username)"],
    ["competitions_slug_uq", "CREATE UNIQUE INDEX IF NOT EXISTS competitions_slug_uq ON competitions(slug)"],
    ["competitions_status_closes_idx", "CREATE INDEX IF NOT EXISTS competitions_status_closes_idx ON competitions(status, closes_at)"],
    ["competitions_category_idx", "CREATE INDEX IF NOT EXISTS competitions_category_idx ON competitions(category)"],
    ["options_competition_idx", "CREATE INDEX IF NOT EXISTS options_competition_idx ON options(competition_id, position)"],
    ["predictions_comp_user_uq", "CREATE UNIQUE INDEX IF NOT EXISTS predictions_comp_user_uq ON predictions(competition_id, user_id)"],
    ["predictions_user_created_idx", "CREATE INDEX IF NOT EXISTS predictions_user_created_idx ON predictions(user_id, created_at)"],
    ["predictions_competition_idx", "CREATE INDEX IF NOT EXISTS predictions_competition_idx ON predictions(competition_id)"],
    ["wallet_user_created_idx", "CREATE INDEX IF NOT EXISTS wallet_user_created_idx ON wallet_transactions(user_id, created_at)"],
    ["audit_created_idx", "CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs(created_at)"],
    ["audit_action_idx", "CREATE INDEX IF NOT EXISTS audit_action_idx ON audit_logs(action)"],
    ["notifications_user_read_idx", "CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, read_at)"],
  ];
  for (const [, ddl] of indexes) {
    await client.execute(ddl);
  }
}
