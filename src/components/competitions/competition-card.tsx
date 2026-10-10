import Link from "next/link";
import Image from "next/image";
import { Card, Badge } from "@/components/ui";
import { Countdown } from "./countdown";
import type { CompetitionSummary } from "@/server/services/competitions.service";
import { formatGoopos } from "@/lib/constants";
import { getCompetitionThumbnail } from "@/lib/thumbnails";

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" | "info" | "purple" }> = {
  open: { label: "Abierta", tone: "success" },
  closed: { label: "Cerrada", tone: "warning" },
  resolved: { label: "Resuelta", tone: "info" },
  cancelled: { label: "Cancelada", tone: "danger" },
  draft: { label: "Borrador", tone: "neutral" },
};

const CATEGORY_LABEL: Record<string, string> = {
  deportes: "Deportes",
  esports: "eSports",
  academico: "Académico",
  entretenimiento: "Entretenimiento",
  clima: "Clima",
  comunidad: "Comunidad",
  otro: "Otro",
};

export function CompetitionCard({ comp }: { comp: CompetitionSummary }) {
  const st = STATUS_LABEL[comp.status] ?? { label: comp.status, tone: "neutral" as const };
  const thumbUrl = getCompetitionThumbnail(comp.slug, comp.category, comp.coverEmoji, comp.title);

  return (
    <Link href={`/competencias/${comp.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary-500/40 p-0">
        {/* Banner de portada con miniatura real de alta calidad */}
        <div className="relative h-40 w-full overflow-hidden bg-surface-muted">
          <Image
            src={thumbUrl}
            alt={comp.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/15">
              {CATEGORY_LABEL[comp.category] ?? comp.category}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <Badge tone={st.tone} className="backdrop-blur-md shadow-sm">{st.label}</Badge>
          </div>
        </div>

        {/* Contenido de la tarjeta */}
        <div className="flex flex-1 flex-col p-5 space-y-3">
          <h3 className="font-display font-bold text-base leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {comp.title}
          </h3>

          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">{comp.description}</p>

          <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Entrada</p>
              <p className="text-xs sm:text-sm font-semibold">{formatGoopos(comp.entryCost)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Pozo</p>
              <p className="text-xs sm:text-sm font-bold text-accent-600 dark:text-accent-400">{formatGoopos(comp.pool)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {comp.status === "open" ? "Cierra en" : "Participantes"}
              </p>
              <div className="text-xs sm:text-sm font-semibold">
                {comp.status === "open" ? (
                  <Countdown closesAt={comp.closesAt} className="tabular-nums" />
                ) : (
                  comp.participantsCount
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
