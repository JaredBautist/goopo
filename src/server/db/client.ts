import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";
import { runMigrations } from "./migrate";
import { seedDatabase } from "./seed";

export type DbMode = "local" | "tmp" | "turso";

let activeMode: DbMode = "local";
let activeUrl = "file:./data/goopo.db";

export function resolveDbConfig(): { url: string; authToken?: string; mode: DbMode } {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
      mode: "turso",
    };
  }
  if (process.env.VERCEL) {
    return { url: "file:/tmp/goopo.db", mode: "tmp" };
  }
  return { url: "file:./data/goopo.db", mode: "local" };
}

export function resolveDbUrl(): { url: string; mode: DbMode } {
  const conf = resolveDbConfig();
  return { url: conf.url, mode: conf.mode };
}

let clientPromise: Promise<Client> | null = null;
let readyPromise: Promise<Client> | null = null;

function createOnce(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const config = resolveDbConfig();
      activeMode = config.mode;
      activeUrl = config.url;

      if (config.mode === "turso") {
        try {
          const c = createClient({
            url: config.url,
            authToken: config.authToken,
          });
          await c.execute("SELECT 1");
          return c;
        } catch (tursoErr) {
          console.warn("[db] Falló conexión a Turso, degradando a SQLite local/tmp:", tursoErr);
          activeMode = process.env.VERCEL ? "tmp" : "local";
          activeUrl = process.env.VERCEL ? "file:/tmp/goopo.db" : "file:./data/goopo.db";
          const fallback = createClient({ url: activeUrl });
          await fallback.execute("SELECT 1");
          return fallback;
        }
      }

      const c = createClient({ url: config.url });
      await c.execute("SELECT 1").catch((err) => {
        clientPromise = null;
        throw err;
      });
      return c;
    })().catch((err) => {
      clientPromise = null;
      throw err;
    });
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
  return activeMode;
}

export function getDbUrl(): string {
  return activeUrl;
}
