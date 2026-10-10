import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";
import { runMigrations } from "./migrate";
import { seedDatabase } from "./seed";

export type DbMode = "local" | "tmp" | "turso";

export function resolveDbUrl(): { url: string; mode: DbMode } {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    return { url: process.env.TURSO_DATABASE_URL, mode: "turso" };
  }
  if (process.env.VERCEL) {
    return { url: "file:/tmp/goopo.db", mode: "tmp" };
  }
  return { url: "file:./data/goopo.db", mode: "local" };
}

let clientPromise: Promise<Client> | null = null;
let readyPromise: Promise<Client> | null = null;

function createOnce(): Promise<Client> {
  if (!clientPromise) {
    const { url } = resolveDbUrl();
    clientPromise = (async () => {
      const c = createClient({ url });
      await c.execute("SELECT 1").catch((err) => {
        clientPromise = null;
        throw err;
      });
      return c;
    })();
  }
  return clientPromise;
}

/** Returns the raw libsql client, initializing + seeding on first call. */
export async function ensureDb(): Promise<Client> {
  if (!readyPromise) {
    readyPromise = (async () => {
      const client = await createOnce();
      await runMigrations(client);
      // Seed whenever the database has no users yet (idempotent, all modes).
      const r = await client.execute("SELECT COUNT(*) AS c FROM users");
      const count = Number(r.rows[0]?.c ?? 0);
      if (count === 0) {
        await seedDatabase(client);
      }
      return client;
    })().catch((err) => {
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}

/** Returns a Drizzle ORM instance bound to the singleton libsql client. */
export async function getDb() {
  const client = await ensureDb();
  return drizzle(client, { schema });
}

/** Exposed for the health endpoint / docs. */
export function getDbMode(): DbMode {
  return resolveDbUrl().mode;
}

export function getDbUrl(): string {
  return resolveDbUrl().url;
}
