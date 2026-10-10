import Link from "next/link";
import { Button, Card, Input, Select, EmptyState } from "@/components/ui";
import { CompetitionCard } from "@/components/competitions/competition-card";
import { listCompetitions, syncCompetitionStates } from "@/server/services/competitions.service";
import type { CompetitionStatus } from "@/types/domain";
import { Sparkles, SlidersHorizontal, RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Competencias" };

type SearchParams = Promise<{
  q?: string;
  estado?: string;
  categoria?: string;
  orden?: string;
}>;

const STATUS_TABS: { value: string; label: string; dotClass: string }[] = [
  { value: "all", label: "Todas", dotClass: "bg-slate-400" },
  { value: "open", label: "Abiertas", dotClass: "bg-emerald-500 animate-pulse" },
  { value: "closed", label: "Cerradas", dotClass: "bg-amber-500" },
  { value: "resolved", label: "Resueltas", dotClass: "bg-sky-500" },
];

const CATEGORIES = [
  { value: "todas", label: "Todas las categorías" },
  { value: "deportes", label: "Deportes" },
  { value: "esports", label: "eSports" },
  { value: "academico", label: "Académico" },
  { value: "entretenimiento", label: "Entretenimiento" },
  { value: "clima", label: "Clima" },
  { value: "comunidad", label: "Comunidad" },
];

const SORTS = [
  { value: "closing_soon", label: "Cierran pronto" },
  { value: "most_participants", label: "Más participantes" },
  { value: "biggest_pool", label: "Mayor pozo" },
  { value: "recent", label: "Recientes" },
];

function buildUrl(base: { q?: string; categoria?: string; orden?: string }, status: string) {
  const p = new URLSearchParams();
  if (base.q) p.set("q", base.q);
  if (status !== "all") p.set("estado", status);
  if (base.categoria && base.categoria !== "todas") p.set("categoria", base.categoria);
  if (base.orden && base.orden !== "closing_soon") p.set("orden", base.orden);
  const qStr = p.toString();
  return qStr ? `/competencias?${qStr}` : "/competencias";
}

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  await syncCompetitionStates();
  const sp = await searchParams;

  const q = sp.q ?? "";
  const estado = sp.estado ?? "all";
  const categoria = sp.categoria ?? "todas";
  const orden = sp.orden ?? "closing_soon";

  const comps = await listCompetitions({
    status: (estado as CompetitionStatus | "all") || "all",
    category: categoria,
    search: q,
    sort: (orden as "closing_soon" | "most_participants" | "biggest_pool" | "recent") || "closing_soon",
  });

  const hasActiveFilters = Boolean(q || (estado && estado !== "all") || (categoria && categoria !== "todas") || (orden && orden !== "closing_soon"));
  const openCount = comps.filter((c) => c.status === "open").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Competencias</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Abiertas primero
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Explora los desafíos disponibles, consulta las reglas completas y haz tus pronósticos oficiales.
          </p>
        </div>

        {hasActiveFilters && (
          <Link
            href="/competencias"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar todos los filtros
          </Link>
        )}
      </header>

      {/* Pestañas de estado rápido (Tabs estilo Pill) */}
      <div className="mb-5 flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-2xl border border-border/70 bg-surface-muted/40 p-1.5 backdrop-blur-xs">
        {STATUS_TABS.map((tab) => {
          const isActive = estado === tab.value;
          const href = buildUrl({ q, categoria, orden }, tab.value);
          return (
            <Link
              key={tab.value}
              href={href}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold min-h-[40px] transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-surface-elevated text-foreground shadow-md ring-1 ring-border font-bold"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${tab.dotClass}`} />
              {tab.label}
              {tab.value === "open" && (
                <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-500 font-bold">
                  {openCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Filtros secundarios: búsqueda, categoría y orden */}
      <form
        className="mb-8 rounded-2xl border border-border/80 bg-surface/70 p-4 sm:p-5 shadow-sm backdrop-blur-md"
        role="search"
        action="/competencias"
      >
        <input type="hidden" name="estado" value={estado} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Input
              name="q"
              placeholder="Buscar por título o palabra clave…"
              defaultValue={q}
              aria-label="Buscar competencias"
              className="text-base sm:text-sm h-11 sm:h-10"
            />
          </div>
          <div className="lg:col-span-3">
            <Select name="categoria" defaultValue={categoria} aria-label="Filtrar por categoría" className="text-base sm:text-sm h-11 sm:h-10">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div className="lg:col-span-3">
            <Select name="orden" defaultValue={orden} aria-label="Ordenar" className="text-base sm:text-sm h-11 sm:h-10">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>
          <div className="lg:col-span-1 flex items-stretch">
            <Button type="submit" variant="secondary" className="w-full text-xs font-semibold px-3 h-11 sm:h-10 gap-2" title="Aplicar filtros">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="lg:hidden">Aplicar filtros</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Estado de resultados */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Mostrando <strong>{comps.length}</strong> competencias
          {estado === "all" && " (abiertas ordenadas al inicio)"}
        </span>
        {comps.length > 0 && (
          <span className="flex items-center gap-1 text-emerald-500 font-medium">
            <Sparkles className="h-3 w-3" />
            {openCount} abiertas para participar
          </span>
        )}
      </div>

      {comps.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No encontramos competencias con estos filtros"
          description="Prueba con otros criterios de búsqueda o limpia los filtros para ver el catálogo completo."
          action={
            <Link href="/competencias">
              <Button variant="secondary">Restablecer filtros</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {comps.map((c) => (
            <CompetitionCard key={c.id} comp={c} />
          ))}
        </div>
      )}

      <div className="mt-12">
        <Card className="border-border/60 bg-surface-muted/40 p-4 text-center text-xs text-muted-foreground">
          Los Goopos son moneda virtual de demostración sin valor real. Siempre se exhiben el evento, las opciones,
          el plazo de cierre, la forma de determinar al ganador y la regla de desempate antes de confirmar tu participación.
        </Card>
      </div>
    </div>
  );
}
