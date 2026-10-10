import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, Badge, Button } from "@/components/ui";
import { getCurrentUser } from "@/server/services/session-user";
import { ensureDb } from "@/server/db/client";
import { syncCompetitionStates } from "@/server/services/competitions.service";
import { formatGoopos } from "@/lib/constants";
import { TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Panel" };

function lastNDaysIso(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10));
  }
  return days;
}

export default async function AdminDashboard() {
  const admin = await getCurrentUser();
  if (!admin) redirect("/ingresar");
  if (admin.role !== "admin") redirect("/");
  await syncCompetitionStates();
  const client = await ensureDb();

  const stats = await client.execute(`SELECT
    (SELECT COUNT(*) FROM competitions WHERE status='open') AS open_c,
    (SELECT COUNT(*) FROM competitions WHERE status='closed') AS closed_c,
    (SELECT COUNT(*) FROM competitions WHERE status='resolved') AS resolved_c,
    (SELECT COUNT(*) FROM competitions WHERE status='draft') AS draft_c,
    (SELECT COUNT(*) FROM users) AS users_c,
    (SELECT COALESCE(SUM(balance),0) FROM users) AS goopos_circ,
    (SELECT COUNT(*) FROM predictions WHERE date(created_at) = date('now')) AS preds_today`);

  const r = (stats.rows[0] ?? {}) as Record<string, unknown>;
  const pending = await client.execute(`
    SELECT c.id, c.slug, c.title, c.cover_emoji, c.closes_at,
      (SELECT COUNT(*) FROM predictions p WHERE p.competition_id = c.id) AS preds
    FROM competitions c WHERE c.status = 'closed' ORDER BY c.closes_at ASC LIMIT 10`);

  // Participaciones por día (7 días)
  const perDay = await client.execute(`
    SELECT date(created_at) AS d, COUNT(*) AS c
    FROM predictions
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY date(created_at) ORDER BY d`);
  const dayMap = new Map<string, number>();
  for (const d of lastNDaysIso(7)) {
    dayMap.set(d, 0);
  }
  for (const row of perDay.rows) {
    const key = String(row.d);
    if (dayMap.has(key)) dayMap.set(key, Number(row.c));
  }
  const maxDay = Math.max(1, ...dayMap.values());

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Panel de administración</h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumen general de la plataforma.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/competencias"><Button variant="secondary" size="sm">Competencias</Button></Link>
          <Link href="/admin/competencias/nueva"><Button size="sm">+ Nueva</Button></Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            ["Abiertas", Number(r.open_c ?? 0), "text-green-600 dark:text-green-400"],
            ["Cerradas (por resolver)", Number(r.closed_c ?? 0), "text-amber-600 dark:text-amber-400"],
            ["Resueltas", Number(r.resolved_c ?? 0), "text-sky-600 dark:text-sky-400"],
            ["Borradores", Number(r.draft_c ?? 0), ""],
            ["Usuarios", Number(r.users_c ?? 0), ""],
            ["Goopos en circulación", formatGoopos(Number(r.goopos_circ ?? 0)), "text-accent-600 dark:text-accent-400"],
            ["Participaciones hoy", Number(r.preds_today ?? 0), ""],
          ] as [string, number | string, string][]
        ).map(([label, value, cls], i) => (
          <Card key={i} className="p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${cls}`}>
              {typeof value === "number" ? new Intl.NumberFormat("es-CO").format(value) : value}
            </p>
          </Card>
        ))}
      </div>

      {/* Por resolver */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">⚖️ Competencias por resolver</h2>
        {pending.rows.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No hay competencias cerradas esperando resultado.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {pending.rows.map((row) => (
              <Card key={String(row.id)} className="flex flex-wrap items-center gap-3 p-4">
                <span className="text-2xl" aria-hidden>{String(row.cover_emoji)}</span>
                <div className="flex-1">
                  <Link href={`/admin/competencias/${row.id}`} className="font-medium hover:text-primary-700 dark:hover:text-primary-300">
                    {String(row.title)}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Cerró el {new Date(String(row.closes_at)).toLocaleString("es-CO", { timeZone: "America/Bogota" })} · {Number(row.preds)} participaciones
                  </p>
                </div>
                <Badge tone="warning">Esperando resultado</Badge>
                <Link href={`/admin/competencias/${row.id}`}>
                  <Button size="sm">Resolver</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Gráfica simple participaciones por día */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <TrendingUp className="h-5 w-5" aria-hidden /> Participaciones por día (7 días)
        </h2>
        <Card className="mt-3 p-5">
          <div className="flex h-40 items-end gap-3" role="img" aria-label="Gráfica de participaciones por día">
            {[...dayMap.entries()].map(([d, c]) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold tabular-nums">{c}</span>
                <div
                  className="w-full rounded-t-lg bg-primary-500/80"
                  style={{ height: `${Math.max(4, (c / maxDay) * 100)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{d.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
