import Link from "next/link";
import Image from "next/image";
import { Button, Card } from "@/components/ui";
import { CompetitionCard } from "@/components/competitions/competition-card";
import { listCompetitions, syncCompetitionStates } from "@/server/services/competitions.service";
import { ensureDb } from "@/server/db/client";
import { formatGoopos } from "@/lib/constants";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Scale,
  Lock,
  Clock,
  Flame,
  Trophy,
  Users,
  Coins,
  CheckCircle2,
  Eye,
  ScrollText,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await syncCompetitionStates();
  const comps = await listCompetitions({ status: "open", sort: "closing_soon", limit: 3 });
  const client = await ensureDb();
  const stats = await client.execute(`SELECT
    (SELECT COUNT(*) FROM competitions WHERE status = 'open') AS open_count,
    (SELECT COUNT(DISTINCT user_id) FROM predictions) AS players,
    (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE type = 'payout') AS paid_out`);

  const openCount = Number(stats.rows[0]?.open_count ?? 0);
  const players = Number(stats.rows[0]?.players ?? 0);
  const paidOut = Number(stats.rows[0]?.paid_out ?? 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12 space-y-20 md:space-y-28">
      {/* Hero Section: Asymmetric Split Screen */}
      <section className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8 pt-4 md:pt-10">
        <div className="flex flex-col items-start lg:col-span-7 space-y-6">
          {/* Status Chip */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3.5 py-1.5 text-xs font-semibold text-primary-700 dark:border-primary-400/30 dark:bg-primary-900/30 dark:text-primary-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-400" />
            </span>
            Pronósticos en vivo · Moneda virtual sin dinero real
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
            Pronostica, compite y descubre{" "}
            <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent dark:from-primary-400 dark:via-primary-300 dark:to-accent-400">
              si la suerte está de tu lado
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Goopo organiza competencias de pronósticos con reglas 100% claras, pozos acumulados transparentes y un reparto matemático exacto sin comisiones ocultas.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
            <Link href="/competencias" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary-600/25 dark:shadow-primary-900/40">
                Entrar a las competencias
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Link href="#como-funciona" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                ¿Cómo funciona?
              </Button>
            </Link>
          </div>

          {/* Trust points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 pt-4 border-t border-border/60 w-full text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />
              <span>Reglas antes de participar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />
              <span>Cierre automático exacto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-accent-500 shrink-0" />
              <span>1.000 G de saldo inicial</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Card Preview */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-md">
            {/* Ambient Backlight Glow */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary-600 to-accent-500 opacity-20 blur-xl dark:opacity-30" />

            <Card className="relative overflow-hidden p-0 bg-surface/90 dark:bg-surface/85 backdrop-blur-xl border border-border/80 shadow-2xl">
              {/* Cover Banner con fotografía de alta resolución */}
              <div className="relative h-44 w-full overflow-hidden bg-surface-muted">
                <Image
                  src="/images/events/clasico.jpg"
                  alt="Clásico del fin de semana"
                  fill
                  sizes="400px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/15">
                    <Flame className="h-3.5 w-3.5 text-accent-400" />
                    Destacada en Vivo
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md border border-white/15">
                    <Clock className="h-3.5 w-3.5" />
                    Cierra en 42m
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <p className="text-[11px] uppercase tracking-wider text-white/80 font-semibold">Torneo Interuniversitario</p>
                  <h3 className="font-display text-lg font-bold leading-tight text-white drop-shadow-sm">
                    ¿Quién ganará el clásico del fin de semana?
                  </h3>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-xl bg-surface-muted/60 p-3.5 flex items-center justify-between border border-border/50">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Pozo acumulado</p>
                    <p className="font-display text-lg font-bold text-accent-600 dark:text-accent-400 flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      3.800 G
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-xs text-muted-foreground">Entrada</p>
                    <p className="font-semibold text-sm">100 G</p>
                  </div>
                </div>

                {/* Options choices preview */}
                <div className="space-y-2 pt-1">
                  {[
                    { name: "Equipo Águilas", pct: 54, count: "21 pronósticos", lead: true },
                    { name: "Empate", pct: 18, count: "7 pronósticos", lead: false },
                    { name: "Equipo Halcones", pct: 28, count: "11 pronósticos", lead: false },
                  ].map((opt) => (
                    <div
                      key={opt.name}
                      className={`group relative overflow-hidden rounded-xl border p-3 text-sm transition-colors ${
                        opt.lead
                          ? "border-primary-500/40 bg-primary-50/50 dark:bg-primary-950/30"
                          : "border-border/60 bg-surface/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{opt.name}</span>
                        <span className="text-xs text-muted-foreground">{opt.count}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            opt.lead ? "bg-primary-600 dark:bg-primary-400" : "bg-muted-foreground/30"
                          }`}
                          style={{ width: `${opt.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Scale className="h-3 w-3" />
                    Reparto igualitario
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Inmutable tras el cierre
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Metrics Counter Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {[
          {
            label: "Competencias Abiertas",
            value: String(openCount),
            desc: "Disponibles para participar ahora",
            icon: Flame,
            color: "text-primary-600 dark:text-primary-400",
            bg: "bg-primary-50 dark:bg-primary-950/50",
          },
          {
            label: "Participantes Registrados",
            value: String(players),
            desc: "Pronosticando en comunidad",
            icon: Users,
            color: "text-accent-600 dark:text-accent-400",
            bg: "bg-amber-50 dark:bg-amber-950/50",
          },
          {
            label: "Goopos Repartidos",
            value: formatGoopos(paidOut),
            desc: "Sin crear ni destruir saldo",
            icon: Trophy,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/50",
          },
        ].map((m) => (
          <Card
            key={m.label}
            className="p-6 flex items-start justify-between bg-surface/85 backdrop-blur-md border border-border/70 hover:border-border transition-all duration-300 hover:shadow-md"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">{m.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
            </div>
            <div className={`p-3 rounded-xl ${m.bg} ${m.color}`}>
              <m.icon className="h-6 w-6" aria-hidden />
            </div>
          </Card>
        ))}
      </section>

      {/* Cómo Funciona */}
      <section id="como-funciona" className="scroll-mt-24 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Reglas Claras
          </span>
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">¿Cómo funciona Goopo?</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Cuatro etapas sencillas diseñadas para garantizar total transparencia y juego justo de principio a fin.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Sparkles,
              step: "01",
              title: "Elige la competencia",
              desc: "Explora eventos de deportes, comunidad y conocimiento con costos de entrada claros.",
            },
            {
              icon: ScrollText,
              step: "02",
              title: "Revisa las condiciones",
              desc: "El evento, opciones, momento de cierre y fórmula de desempate se leen antes de participar.",
            },
            {
              icon: Clock,
              step: "03",
              title: "Haz tu pronóstico",
              desc: "Selecciona tu opción antes del cierre. Una vez confirmada, queda blindada e inmutable.",
            },
            {
              icon: Trophy,
              step: "04",
              title: "Recibe el resultado",
              desc: "El pozo completo se transfiere automáticamente a los acertantes según la regla oficial.",
            },
          ].map((s) => (
            <Card
              key={s.step}
              className="p-6 relative overflow-hidden group hover:border-primary-500/40 transition-all duration-300 bg-surface/85 backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 group-hover:scale-105 transition-transform">
                  <s.icon className="h-5 w-5" aria-hidden />
                </div>
                <span className="font-display text-2xl font-black text-muted-foreground/30">{s.step}</span>
              </div>
              <h3 className="mt-4 font-display font-bold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Competencias Destacadas */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              En Catálogo
            </span>
            <h2 className="mt-1 font-display text-3xl font-extrabold md:text-4xl">Competencias destacadas</h2>
            <p className="mt-1 text-sm text-muted-foreground">Eventos abiertos próximos a cerrar sus participaciones.</p>
          </div>
          <Link
            href="/competencias"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200 transition-colors"
          >
            Explorar todas las competencias
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {comps.length === 0 ? (
          <Card className="p-12 text-center space-y-3 bg-surface/80">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="font-display font-semibold text-lg">No hay competencias abiertas en este momento</p>
            <p className="text-sm text-muted-foreground">Vuelve pronto para nuevos eventos y pronósticos.</p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {comps.map((c) => (
              <CompetitionCard key={c.id} comp={c} />
            ))}
          </div>
        )}
      </section>

      {/* Pilares de Transparencia (Bento Grid) */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Compromiso Inquebrantable
          </span>
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">Transparencia ante todo</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Cada competencia fija sus condiciones antes del inicio y nadie puede alterarlas con posterioridad.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Eye,
              title: "El Evento",
              desc: "Definición objetiva y verificable de la competencia sin ambigüedades.",
            },
            {
              icon: Sparkles,
              title: "Las Opciones",
              desc: "Todas las alternativas disponibles se exhiben completas antes de participar.",
            },
            {
              icon: Clock,
              title: "Cierre Preciso",
              desc: "Fecha y hora límite fijas. El servidor rechaza cualquier intento posterior.",
            },
            {
              icon: Trophy,
              title: "Forma de Ganar",
              desc: "Criterios inequívocos de resolución contrastados con datos reales.",
            },
            {
              icon: Scale,
              title: "Regla de Desempate",
              desc: "Fórmula matemática prepublicada (reparto equitativo, rapidez o reembolso).",
            },
            {
              icon: Lock,
              title: "Inmutabilidad Total",
              desc: "Tras cerrarse o registrar participantes, los términos quedan sellados.",
            },
          ].map((item) => (
            <Card
              key={item.title}
              className="p-5 flex items-start gap-4 bg-surface/85 backdrop-blur-md border border-border/70 hover:border-primary-500/30 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 shrink-0">
                <item.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-semibold text-base">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative overflow-hidden rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-900/60 via-surface to-surface p-8 sm:p-12 text-center space-y-6 shadow-2xl">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl text-foreground">
            ¿Listo para poner a prueba tu intuición?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Crea tu cuenta en segundos, recibe 1.000 Goopos de bienvenida y compite por los primeros lugares del ranking.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link href="/registro">
            <Button size="lg" className="shadow-lg shadow-primary-600/30">
              Crear cuenta gratis
            </Button>
          </Link>
          <Link href="/competencias">
            <Button size="lg" variant="secondary">
              Ver competencias abiertas
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
