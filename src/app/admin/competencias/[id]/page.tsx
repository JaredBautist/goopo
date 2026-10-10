import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, Badge, Button } from "@/components/ui";
import { requireAdmin } from "@/server/services/session-user";
import { ensureDb } from "@/server/db/client";
import { syncCompetitionStates } from "@/server/services/competitions.service";
import { formatGoopos } from "@/lib/constants";
import { ResolvePanel } from "@/components/admin/resolve-panel";
import { CancelPanel } from "@/components/admin/cancel-panel";
import { getCompetitionThumbnail } from "@/lib/thumbnails";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Gestionar competencia" };

const STATUS_TONE: Record<string, "success" | "warning" | "info" | "danger" | "neutral"> = {
  open: "success", closed: "warning", resolved: "info", cancelled: "danger", draft: "neutral",
};

export default async function AdminCompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  await syncCompetitionStates();
  const client = await ensureDb();

  const cR = await client.execute({
    sql: `SELECT * FROM competitions WHERE id = ?`,
    args: [id],
  });
  const row = cR.rows[0];
  if (!row) notFound();

  const opts = await client.execute({
    sql: `SELECT o.*, (SELECT COUNT(*) FROM predictions p WHERE p.option_id = o.id) AS votes
          FROM options o WHERE o.competition_id = ? ORDER BY position`,
    args: [id],
  });
  const preds = await client.execute({
    sql: `SELECT p.id, p.stake, p.status, p.payout, u.username, u.display_name, o.label
          FROM predictions p JOIN users u ON u.id = p.user_id JOIN options o ON o.id = p.option_id
          WHERE p.competition_id = ? ORDER BY p.created_at`,
    args: [id],
  });

  const status = String(row.status);
  const pool = preds.rows.reduce((s, r) => s + Number(r.stake), 0);
  const options = opts.rows.map((o) => ({
    id: String(o.id),
    label: String(o.label),
    votes: Number(o.votes),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin/competencias" className="text-sm text-muted-foreground hover:text-foreground">← Competencias</Link>
      <header className="mt-3 mb-6 flex flex-wrap items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface-muted shadow-sm">
          <Image
            src={getCompetitionThumbnail(String(row.slug), String(row.category), String(row.cover_emoji), String(row.title))}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{String(row.title)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatGoopos(Number(row.entry_cost))} · {preds.rows.length} participaciones · pozo {formatGoopos(pool)}
          </p>
        </div>
        <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge>
      </header>

      {status === "draft" && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-primary-200 p-5 dark:border-primary-800">
          <p className="text-sm">Esta competencia es un borrador: publícala para que sea visible.</p>
          <form
            action={async (fd) => {
              "use server";
              const { publishCompetitionAction } = await import("@/actions/admin");
              await publishCompetitionAction(fd);
            }}
          >
            <input type="hidden" name="id" value={id} />
            <Button type="submit">Publicar</Button>
          </form>
        </Card>
      )}

      {status === "open" && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-amber-200 p-5 dark:border-amber-900">
          <p className="text-sm">La competencia está abierta. Puedes cerrarla manualmente antes de tiempo.</p>
          <form
            action={async (fd) => {
              "use server";
              const { closeCompetitionAction } = await import("@/actions/admin");
              await closeCompetitionAction(fd);
            }}
          >
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="secondary">Cerrar ahora</Button>
          </form>
        </Card>
      )}

      {status === "closed" && (
        <div className="mb-6">
          <ResolvePanel competitionId={id} options={options} pool={pool} participantCount={preds.rows.length} tieRule={String(row.tie_rule)} />
        </div>
      )}

      {(status === "open" || status === "closed") && (
        <div className="mb-6">
          <CancelPanel competitionId={id} />
        </div>
      )}

      {status === "resolved" && (
        <Card className="mb-6 border-sky-200 bg-sky-50 p-5 dark:border-sky-900 dark:bg-sky-950/40">
          <p className="font-semibold text-sky-900 dark:text-sky-200">🏁 Competencia resuelta (inmutable)</p>
          {row.resolution_note ? <p className="mt-1 text-sm text-sky-900/80 dark:text-sky-200/70">{String(row.resolution_note)}</p> : null}
        </Card>
      )}

      <Card className="mb-6 overflow-x-auto">
        <div className="border-b border-border px-5 py-3">
          <h2 className="font-display font-semibold">Participaciones ({preds.rows.length})</h2>
        </div>
        {preds.rows.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Sin participaciones.</p>
        ) : (
          <table className="w-full min-w-130 text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2">Participante</th>
                <th className="px-4 py-2">Opción</th>
                <th className="px-4 py-2 text-right">Entrada</th>
                <th className="px-4 py-2 text-right">Pago</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {preds.rows.map((p) => (
                <tr key={String(p.id)} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">{String(p.display_name)}</td>
                  <td className="px-4 py-2">{String(p.label)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatGoopos(Number(p.stake))}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{Number(p.payout) > 0 ? formatGoopos(Number(p.payout)) : "—"}</td>
                  <td className="px-4 py-2 text-xs">{String(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <div className="border-b border-border px-5 py-3">
          <h2 className="font-display font-semibold">Editar</h2>
          <p className="text-xs text-muted-foreground">
            Con participaciones registradas, la transparencia impide cambiar opciones, costo, cierre y regla de empate;
            solo puedes aclarar las reglas.
          </p>
        </div>
        <form
          className="space-y-3 p-5"
          action={async (fd) => {
            "use server";
            const { updateCompetitionAction } = await import("@/actions/admin");
            await updateCompetitionAction({}, fd);
          }}
        >
          <input type="hidden" name="id" value={id} />
          {status === "draft" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="t">Título</label>
                <input id="t" name="title" defaultValue={String(row.title)} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="ec">Costo (G)</label>
                <input id="ec" name="entryCost" type="number" min={1} defaultValue={Number(row.entry_cost)} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium" htmlFor="d">Descripción</label>
                <textarea id="d" name="description" defaultValue={String(row.description)} rows={2} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="rt">Reglas</label>
            <textarea id="rt" name="rulesText" defaultValue={String(row.rules_text)} rows={6} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <Button type="submit" variant="secondary">Guardar cambios</Button>
        </form>
      </Card>
    </div>
  );
}
