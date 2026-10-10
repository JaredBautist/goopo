import Link from "next/link";
import Image from "next/image";
import { Card, Badge, EmptyState } from "@/components/ui";
import { getCurrentUser } from "@/server/services/session-user";
import { ensureDb } from "@/server/db/client";
import { formatGoopos } from "@/lib/constants";
import { getCompetitionThumbnail } from "@/lib/thumbnails";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mis pronósticos" };

type SearchParams = Promise<{ tab?: string }>;

const PRED_LABEL: Record<string, { label: string; tone: "success" | "danger" | "warning" | "info" }> = {
  active: { label: "En juego", tone: "info" },
  won: { label: "Ganada", tone: "success" },
  lost: { label: "Perdida", tone: "danger" },
  refunded: { label: "Reembolsada", tone: "warning" },
};

export default async function MyPredictionsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const sp = await searchParams;
  const tab = ["activos", "resueltos", "todos"].includes(sp.tab ?? "") ? sp.tab! : "todos";

  const client = await ensureDb();
  const statusFilter =
    tab === "activos" ? "AND p.status = 'active'" : tab === "resueltos" ? "AND p.status != 'active'" : "";
  const r = await client.execute({
    sql: `SELECT p.id, p.stake, p.status, p.payout, p.created_at,
            c.slug, c.title, c.cover_emoji, c.category, c.status as comp_status,
            o.label as option_label
          FROM predictions p
          JOIN competitions c ON c.id = p.competition_id
          JOIN options o ON o.id = p.option_id
          WHERE p.user_id = ? ${statusFilter}
          ORDER BY p.created_at DESC
          LIMIT 100`,
    args: [user.id],
  });

  const rows = r.rows.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    category: String(row.category),
    emoji: String(row.cover_emoji),
    optionLabel: String(row.option_label),
    stake: Number(row.stake),
    status: String(row.status),
    payout: Number(row.payout),
    compStatus: String(row.comp_status),
    createdAt: String(row.created_at),
  }));

  // resumen (sobre todas)
  const all = await client.execute({
    sql: `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN status = 'won' THEN payout - stake ELSE 0 END) AS net
          FROM predictions WHERE user_id = ?`,
    args: [user.id],
  });
  const total = Number(all.rows[0]?.total ?? 0);
  const wins = Number(all.rows[0]?.wins ?? 0);
  const net = Number(all.rows[0]?.net ?? 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Mis pronósticos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Historial completo de tus participaciones.</p>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Participaciones</p>
          <p className="font-display text-xl font-bold">{total}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Aciertos</p>
          <p className="font-display text-xl font-bold">{wins} <span className="text-xs font-normal text-muted-foreground">({total ? Math.round((wins / total) * 100) : 0}%)</span></p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Neto</p>
          <p className={`font-display text-xl font-bold ${net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {formatGoopos(net)}
          </p>
        </Card>
      </div>

      <nav className="mb-4 flex gap-2" aria-label="Filtrar pronósticos">
        {[
          ["todos", "Todos"],
          ["activos", "Activos"],
          ["resueltos", "Resueltos"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`/mis-pronosticos?tab=${value}`}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${tab === value ? "bg-primary-600 text-white" : "bg-surface-muted hover:bg-surface"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Aún no tienes pronósticos aquí"
          description="Participa en una competencia abierta y aparecerá en esta lista."
          action={<Link href="/competencias" className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">Ver competencias</Link>}
        />
      ) : (
        <div className="space-y-3">
          {rows.map((p) => {
            const st = PRED_LABEL[p.status] ?? { label: p.status, tone: "info" as const };
            return (
              <Card key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 sm:p-4 hover:border-border transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-muted">
                    <Image
                      src={getCompetitionThumbnail(p.slug, p.category, p.emoji, p.title)}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/competencias/${p.slug}`} className="font-semibold text-sm hover:text-primary-600 dark:hover:text-primary-400 line-clamp-1">
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      Tu elección: <strong className="text-foreground font-medium">{p.optionLabel}</strong>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString("es-CO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  <Badge tone={st.tone} className="text-xs">{st.label}</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Entrada {formatGoopos(p.stake)}
                    {p.status === "won" && <strong className="text-emerald-500 font-bold"> · +{formatGoopos(p.payout)}</strong>}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
