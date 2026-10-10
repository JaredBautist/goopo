import Image from "next/image";
import { Card, Badge, EmptyState } from "@/components/ui";
import { ensureDb } from "@/server/db/client";
import { getCurrentUser } from "@/server/services/session-user";
import { syncCompetitionStates } from "@/server/services/competitions.service";
import { formatGoopos } from "@/lib/constants";
import { getUserAvatar } from "@/lib/avatars";
import { Medal } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ranking" };

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 3600_000).toISOString();
}

type SearchParams = Promise<{ rango?: string }>;

export default async function RankingPage({ searchParams }: { searchParams: SearchParams }) {
  await syncCompetitionStates();
  const sp = await searchParams;
  const range = sp.rango === "30d" ? "30d" : "all";
  const sinceIso = range === "30d" ? daysAgoIso(30) : null;

  const client = await ensureDb();
  const user = await getCurrentUser();

  const r = await client.execute({
    sql: `SELECT u.id, u.username, u.display_name,
            SUM(CASE WHEN p.status = 'won' THEN 1 ELSE 0 END) AS wins,
            COUNT(p.id) AS played,
            COALESCE(SUM(CASE WHEN p.status = 'won' THEN p.payout - p.stake ELSE 0 END), 0) AS net
          FROM users u
          JOIN predictions p ON p.user_id = u.id
          JOIN competitions c ON c.id = p.competition_id AND c.status = 'resolved'
          ${sinceIso ? "AND p.created_at >= ?" : ""}
          GROUP BY u.id
          HAVING COUNT(p.id) > 0
          ORDER BY net DESC, wins DESC, played ASC
          LIMIT 50`,
    args: sinceIso ? [sinceIso] : [],
  });

  const rows = r.rows.map((row, i) => ({
    pos: i + 1,
    userId: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
    wins: Number(row.wins),
    played: Number(row.played),
    net: Number(row.net),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Ranking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Neto en competencias resueltasPremios − participaciones. Criterios de desempate: más aciertos, luego menos participaciones.
          </p>
        </div>
        <nav className="flex gap-2" aria-label="Rango temporal">
          <a
            href="/ranking?rango=all"
            className={`rounded-xl px-3 py-2 text-sm font-medium ${range === "all" ? "bg-primary-600 text-white" : "bg-surface-muted hover:bg-surface"}`}
          >
            Todo el tiempo
          </a>
          <a
            href="/ranking?rango=30d"
            className={`rounded-xl px-3 py-2 text-sm font-medium ${range === "30d" ? "bg-primary-600 text-white" : "bg-surface-muted hover:bg-surface"}`}
          >
            Últimos 30 días
          </a>
        </nav>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon="🏅"
          title="Aún no hay datos de ranking"
          description="Cuando se resuelvan competencias con participaciones, el ranking aparecerá aquí."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-85 text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3.5 sm:px-4 py-3">#</th>
                <th className="px-3.5 sm:px-4 py-3">Participante</th>
                <th className="px-3 sm:px-4 py-3 text-center">Aciertos</th>
                <th className="hidden sm:table-cell px-4 py-3 text-center">% acierto</th>
                <th className="px-3.5 sm:px-4 py-3 text-right">Neto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.userId}
                  className={`border-b border-border last:border-0 ${user?.id === row.userId ? "bg-primary-50 dark:bg-primary-900/30 font-semibold" : ""}`}
                >
                  <td className="px-3.5 sm:px-4 py-3 font-semibold text-xs sm:text-sm">
                    {row.pos === 1 ? "🥇" : row.pos === 2 ? "🥈" : row.pos === 3 ? "🥉" : row.pos}
                  </td>
                  <td className="px-3.5 sm:px-4 py-3">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="relative h-6 w-6 sm:h-7 sm:w-7 shrink-0 overflow-hidden rounded-full border border-border/80 bg-surface-muted">
                        <Image
                          src={getUserAvatar(row.username)}
                          alt={row.displayName}
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      </div>
                      <span className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{row.displayName}</span>
                      {user?.id === row.userId && (
                        <Badge tone="purple" className="ml-1 text-[10px] sm:text-xs">Tú</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center tabular-nums text-xs sm:text-sm">{row.wins}</td>
                  <td className="hidden sm:table-cell px-4 py-3 text-center tabular-nums text-xs sm:text-sm">
                    {Math.round((row.wins / Math.max(1, row.played)) * 100)}%
                  </td>
                  <td className={`px-3.5 sm:px-4 py-3 text-right font-semibold tabular-nums text-xs sm:text-sm ${row.net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatGoopos(row.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Medal className="h-3.5 w-3.5" aria-hidden /> Se calcula solo con competencias resueltas. Los Goopos son virtuales y sin valor real.
      </p>
    </div>
  );
}
