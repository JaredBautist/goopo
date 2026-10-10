import { createClient } from "@libsql/client";
import { runMigrations } from "./migrate";
import { seedDatabase } from "./seed";

const url = process.env.TURSO_DATABASE_URL ?? "file:./data/goopo.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });
await runMigrations(client);
await seedDatabase(client);
console.log(`[db:seed] datos de demostración listos en ${url}`);
client.close();
