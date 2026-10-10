import { Card, Badge } from "@/components/ui";
import { requireAdmin } from "@/server/services/session-user";
import { ensureDb } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Auditoría" };

type SearchParams = Promise<{ accion?: string; pagina?: string }>;

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Inicio de sesión",
  "auth.logout": "Cierre de sesión",
  "auth.register": "Registro",
  "competition.create": "Competencia creada",
  "competition.update": "Competencia editada",
  "competition.publish": "Competencia publicada",
  "competition.close": "Competencia cerrada",
  "competition.resolve": "Competencia resuelta",
  "competition.cancel": "Competencia cancelada",
  "prediction.create": "Pronóstico registrado",
  "wallet.adjust": "Ajuste de saldo",
  "wallet.daily_bonus": "Recarga diaria",
  "user.self_exclude": "Autoexclusión",
  "user.limit_change": "Cambio de límite",
  "user.suspend": "Usuario suspendido",
  "user.reactivate": "Usuario reactivado",
  "user.delete": "Cuenta eliminada",
  "account.password_change": "Contraseña cambiada",
};

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const accion = sp.accion ?? "";
  const page = Math.max(0, Number(sp.pagina ?? "0") || 0);
  const pageSize = 25;

  const client = await ensureDb();
  const where = accion ? "WHERE a.action = ?" : "";
  const countR = await client.execute({
    sql: `SELECT COUNT(*) AS c FROM audit_logs a ${where}`,
    args: accion ? [accion] : [],
  });
  const total = Number(countR.rows[0]?.c ?? 0);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const r = await client.execute({
    sql: `SELECT a.*, u.username AS actor_username
          FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
          ${where}
          ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    args: [...(accion ? [accion] : []), pageSize, page * pageSize],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Auditoría</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro inmutable de operaciones. Las IPs se almacenan anonimizadas.
        </p>
      </header>

      <nav className="mb-4 flex flex-wrap gap-2 text-sm" aria-label="Filtrar por acción">
        <a href="/admin/auditoria" className={`rounded-lg px-3 py-1.5 ${!accion ? "bg-primary-600 text-white" : "bg-surface-muted hover:bg-surface"}`}>
          Todas
        </a>
        {Object.keys(ACTION_LABELS).map((a) => (
          <a
            key={a}
            href={`/admin/auditoria?accion=${encodeURIComponent(a)}`}
            className={`rounded-lg px-3 py-1.5 ${accion === a ? "bg-primary-600 text-white" : "bg-surface-muted hover:bg-surface"}`}
          >
            {ACTION_LABELS[a]}
          </a>
        ))}
      </nav>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-160 text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Actor</th>
              <th className="px-4 py-2">Entidad</th>
              <th className="px-4 py-2">Detalle</th>
              <th className="px-4 py-2 text-right">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {r.rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Sin registros para este filtro.</td></tr>
            ) : (
              r.rows.map((row) => {
                const meta = row.metadata ? safeParse(String(row.metadata)) : null;
                return (
                  <tr key={String(row.id)} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      <Badge tone="neutral">{ACTION_LABELS[String(row.action)] ?? String(row.action)}</Badge>
                    </td>
                    <td className="px-4 py-2">{row.actor_username ? `@${String(row.actor_username)}` : "sistema"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {String(row.entity_type)}{row.entity_id ? ` · id ${String(row.entity_id).slice(0, 8)}…` : ""}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{meta ? JSON.stringify(meta).slice(0, 120) : "—"}</td>
                    <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                      {new Date(String(row.created_at)).toLocaleString("es-CO", { timeZone: "America/Bogota" })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">Página {page + 1} de {pages}</span>
            <div className="flex gap-2">
              {page > 0 && <a className="rounded-lg bg-surface-muted px-3 py-1.5 hover:bg-surface" href={`/admin/auditoria?${accion ? `accion=${encodeURIComponent(accion)}&` : ""}pagina=${page - 1}`}>← Anterior</a>}
              {page < pages - 1 && <a className="rounded-lg bg-surface-muted px-3 py-1.5 hover:bg-surface" href={`/admin/auditoria?${accion ? `accion=${encodeURIComponent(accion)}&` : ""}pagina=${page + 1}`}>Siguiente →</a>}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
