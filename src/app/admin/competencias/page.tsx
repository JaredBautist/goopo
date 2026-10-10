import Link from "next/link";
import Image from "next/image";
import { Card, Badge, Button } from "@/components/ui";
import { requireAdmin } from "@/server/services/session-user";
import { listCompetitions, syncCompetitionStates } from "@/server/services/competitions.service";
import { publishCompetitionAction, closeCompetitionAction, duplicateCompetitionAction } from "@/actions/admin";
import { formatGoopos } from "@/lib/constants";
import { getCompetitionThumbnail } from "@/lib/thumbnails";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Competencias" };

const STATUS_TONE: Record<string, "success" | "warning" | "info" | "danger" | "neutral"> = {
  open: "success", closed: "warning", resolved: "info", cancelled: "danger", draft: "neutral",
};

export default async function AdminCompetitionsPage() {
  await requireAdmin();
  await syncCompetitionStates();
  const comps = await listCompetitions({ includeDrafts: true, limit: 100 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Competencias</h1>
          <p className="mt-1 text-sm text-muted-foreground">{comps.length} competencias (incluye borradores).</p>
        </div>
        <Link href="/admin/competencias/nueva">
          <Button>+ Nueva competencia</Button>
        </Link>
      </header>

      <div className="space-y-2">
        {comps.map((c) => (
          <Card key={c.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-muted">
              <Image
                src={getCompetitionThumbnail(c.slug, c.category, c.coverEmoji, c.title)}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-52 flex-1">
              <Link href={`/admin/competencias/${c.id}`} className="font-medium hover:text-primary-700 dark:hover:text-primary-300">
                {c.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatGoopos(c.entryCost)} · {c.participantsCount} participantes · pozo {formatGoopos(c.pool)} · cierra {new Date(c.closesAt).toLocaleDateString("es-CO")}
              </p>
            </div>
            <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{c.status}</Badge>
            <div className="flex flex-wrap gap-1.5">
              {c.status === "draft" && (
                <form action={publishCompetitionAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button size="sm" variant="secondary" type="submit">Publicar</Button>
                </form>
              )}
              {c.status === "open" && (
                <form action={closeCompetitionAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button size="sm" variant="secondary" type="submit">Cerrar ahora</Button>
                </form>
              )}
              {(c.status === "open" || c.status === "closed") && (
                <Link href={`/admin/competencias/${c.id}`}>
                  <Button size="sm">{c.status === "closed" ? "Resolver" : "Gestionar"}</Button>
                </Link>
              )}
              <form action={duplicateCompetitionAction}>
                <input type="hidden" name="id" value={c.id} />
                <Button size="sm" variant="ghost" type="submit">Duplicar</Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
