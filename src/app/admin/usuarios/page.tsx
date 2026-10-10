import { Card, Badge, Button, Input } from "@/components/ui";
import { requireAdmin } from "@/server/services/session-user";
import { ensureDb } from "@/server/db/client";
import { suspendUserAction } from "@/actions/admin";
import { AdjustBalanceForm } from "./adjust-form";
import { formatGoopos } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Usuarios" };

type SearchParams = Promise<{ q?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const client = await ensureDb();
  const r = await client.execute({
    sql: `SELECT id, email, username, display_name, role, status, balance, created_at, self_excluded_until
          FROM users WHERE (? = '' OR email LIKE ? OR username LIKE ? OR display_name LIKE ?)
          ORDER BY created_at DESC LIMIT 100`,
    args: [q, `%${q}%`, `%${q}%`, `%${q}%`],
  });

  const STATUS_TONE: Record<string, "success" | "danger" | "warning"> = {
    active: "success", suspended: "danger", self_excluded: "warning",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">{r.rows.length} cuentas.</p>
      </header>

      <form className="mb-4" action="/admin/usuarios" role="search">
        <Input name="q" defaultValue={q} placeholder="Buscar por correo, usuario o nombre…" className="max-w-md" aria-label="Buscar usuarios" />
      </form>

      <div className="space-y-2">
        {r.rows.map((row) => {
          const id = String(row.id);
          const status = String(row.status);
          return (
            <Card key={id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-56 flex-1">
                <p className="font-medium">
                  {String(row.display_name)}
                  {String(row.role) === "admin" && <Badge tone="purple" className="ml-2">admin</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{String(row.username)} · {String(row.email)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">{formatGoopos(Number(row.balance))}</p>
                <p className="text-xs text-muted-foreground">
                  {status === "self_excluded" && row.self_excluded_until
                    ? `autoexcluido hasta ${new Date(String(row.self_excluded_until)).toLocaleDateString("es-CO")}`
                    : ""}
                </p>
              </div>
              <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge>
              <div className="flex gap-1.5">
                {String(row.role) !== "admin" && (
                  <form action={suspendUserAction}>
                    <input type="hidden" name="userId" value={id} />
                    <Button size="sm" variant={status === "suspended" ? "secondary" : "danger"} type="submit">
                      {status === "suspended" ? "Reactivar" : "Suspender"}
                    </Button>
                  </form>
                )}
                <AdjustBalanceForm userId={id} username={String(row.username)} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
