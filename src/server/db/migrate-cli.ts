import { createClient } from "@libsql/client";
import { runMigrations } from "./migrate";

const url = process.env.TURSO_DATABASE_URL ?? "file:./data/goopo.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });
await runMigrations(client);
console.log(`[db:migrate] migraciones aplicadas en ${url}`);
client.close();
