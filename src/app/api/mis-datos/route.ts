import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/services/session-user";
import { ensureDb } from "@/server/db/client";
import { listLedgerAll, ledgerToCsv } from "@/server/services/wallet.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/mis-datos?formato=csv → CSV del ledger; por defecto JSON completo. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const url = new URL(req.url);
  const format = url.searchParams.get("formato") ?? "json";

  if (format === "csv") {
    const rows = await listLedgerAll(user.id);
    const csv = ledgerToCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="goopo-movimientos.csv"`,
      },
    });
  }

  const client = await ensureDb();
  const u = await client.execute({
    sql: `SELECT id, email, username, display_name, birth_date, role, status, balance, daily_limit, created_at FROM users WHERE id = ?`,
    args: [user.id],
  });
  const row = u.rows[0];
  const data = {
    perfil: row
      ? {
          id: row.id,
          email: row.email,
          username: row.username,
          display_name: row.display_name,
          birth_date: row.birth_date,
          role: row.role,
          status: row.status,
          balance: row.balance,
          daily_limit: row.daily_limit,
          created_at: row.created_at,
        }
      : null,
    movimientos: (await listLedgerAll(user.id)).map((l) => ({
      tipo: l.type,
      monto: l.amount,
      saldo_posterior: l.balanceAfter,
      fecha: l.createdAt,
      nota: l.note,
    })),
    aviso: "Portabilidad de datos — plataforma Goopo",
  };
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="goopo-mis-datos.json"`,
    },
  });
}
