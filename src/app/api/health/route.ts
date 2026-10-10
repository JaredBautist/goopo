import { NextResponse } from "next/server";
import { ensureDb, getDbMode, getDbUrl } from "@/server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERSION = "0.1.0";

export async function GET() {
  try {
    const client = await ensureDb();
    const r = await client.execute("SELECT COUNT(*) AS c FROM users");
    const users = Number(r.rows[0]?.c ?? 0);
    let authSecretConfigured = false;
    try {
      // Detect without crashing if the env var is absent.
      authSecretConfigured = Boolean(process.env.AUTH_SECRET);
    } catch {
      authSecretConfigured = false;
    }

    return NextResponse.json({
      status: "ok",
      db: "connected",
      mode: getDbMode(),
      url: getDbUrl(),
      users,
      authSecretConfigured,
      version: VERSION,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        db: "error",
        message: err instanceof Error ? err.message : String(err),
        mode: getDbMode(),
        version: VERSION,
        time: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
