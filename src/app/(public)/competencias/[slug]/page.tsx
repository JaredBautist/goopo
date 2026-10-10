import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, Badge } from "@/components/ui";
import { Countdown } from "@/components/competitions/countdown";
import { ParticipatePanel } from "@/components/competitions/participate-panel";
import {
  getCompetitionBySlug,
  listParticipants,
  syncCompetitionStates,
} from "@/server/services/competitions.service";
import { getCurrentUser } from "@/server/services/session-user";
import { formatGoopos } from "@/lib/constants";
import { Clock, Users, PartyPopper, Frown, Ban } from "lucide-react";
import { ShareButton } from "@/components/competitions/share-button";
import { getCompetitionThumbnail } from "@/lib/thumbnails";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comp = await getCompetitionBySlug(slug);
  if (!comp) return { title: "Competencia no encontrada" };
  return { title: comp.title, description: comp.description };
}

const TIE_RULE_TEXT: Record<string, string> = {
  split_equal:
    "Reparto igual: el pozo se divide en partes iguales entre todos los acertantes. El residuo se asigna a quien participó primero.",
  earliest_wins:
    "Primer acierto: si varios aciertan, quien hizo el primer pronóstico correcto se lleva todo el pozo.",
  refund_all:
    "Empate anula: si acierta más de una persona, todas las participaciones se reembolsan; si acierta solo una, se lleva el pozo.",
};

const TIE_RULE_EXAMPLE: Record<string, string> = {
  split_equal: "Ejemplo: pozo de 1.000 G y 3 acertantes → 333 G cada uno y el residuo (1 G) va al primero.",
  earliest_wins: "Ejemplo: pozo de 1.000 G y 3 acertantes → el primero en acertar recibe 1.000 G; los demás nada.",
  refund_all: "Ejemplo: pozo de 1.000 G y 2 acertantes → todos reciben de vuelta su entrada; nadie gana ni pierde.",
};

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await syncCompetitionStates();
  const comp = await getCompetitionBySlug(slug);
  if (!comp) notFound();

  const user = await getCurrentUser();
  const participants = await listParticipants(comp.id);

  // ¿ya participó?
  let myOptionId: string | null = null;
  if (user) {
    const { ensureDb } = await import("@/server/db/client");
    const db = await ensureDb();
    const r = await db.execute({
      sql: `SELECT option_id FROM predictions WHERE competition_id = ? AND user_id = ? LIMIT 1`,
      args: [comp.id, user.id],
    });
    if (r.rows[0]) myOptionId = String(r.rows[0].option_id);
  }

  // resultado personal (resueltas)
  let myOutcome: "won" | "lost" | "refunded" | null = null;
  let myPayout = 0;
  if (user && comp.status === "resolved" && myOptionId) {
    const { ensureDb } = await import("@/server/db/client");
    const db = await ensureDb();
    const r = await db.execute({
      sql: `SELECT status, payout FROM predictions WHERE competition_id = ? AND user_id = ?`,
      args: [comp.id, user.id],
    });
    const row = r.rows[0];
    if (row) {
      myOutcome = String(row.status) as "won" | "lost" | "refunded";
      myPayout = Number(row.payout);
    }
  }

  const winningOption = comp.options.find((o) => o.id === comp.winningOptionId);
  const participable = comp.status === "open";
  const totalPredictions = comp.options.reduce((s, o) => s + o.predictionCount, 0);

  let disabledReason: string | undefined;
  if (participable && !user) disabledReason = "Ingresa para participar.";
  if (participable && user && user.balance < comp.entryCost)
    disabledReason = `Saldo insuficiente: necesitas ${formatGoopos(comp.entryCost)} y tienes ${formatGoopos(user.balance)}. Puedes reclamar la recarga demo en tu cuenta.`;
  if (participable && user && user.status !== "active")
    disabledReason = "Tu cuenta no puede participar en este momento (autoexclusión o suspensión).";
  if (participable && user && comp.maxParticipants !== null && comp.participantsCount >= comp.maxParticipants)
    disabledReason = "Cupo máximo alcanzado.";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Portada fotográfica de alta resolución */}
      <div className="relative mb-6 min-h-[250px] sm:h-72 w-full overflow-hidden rounded-3xl border border-border/80 shadow-xl bg-surface-muted flex flex-col justify-end p-4 sm:p-6">
        <Image
          src={getCompetitionThumbnail(comp.slug, comp.category, comp.coverEmoji, comp.title)}
          alt={comp.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 896px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/competencias"
            className="inline-flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-md border border-white/10 hover:bg-black/80 transition-colors min-h-[36px]"
          >
            ← Volver a competencias
          </Link>
        </div>
        <div className="relative z-10 text-white space-y-2 mt-12 sm:mt-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 uppercase tracking-wide">
              {comp.category}
            </span>
            {comp.status === "open" && <Badge tone="success" className="backdrop-blur-md">Abierta</Badge>}
            {comp.status === "closed" && <Badge tone="warning" className="backdrop-blur-md">Cerrada · esperando resultado</Badge>}
            {comp.status === "resolved" && <Badge tone="info" className="backdrop-blur-md">Resuelta</Badge>}
            {comp.status === "cancelled" && <Badge tone="danger" className="backdrop-blur-md">Cancelada</Badge>}
          </div>
          <h1 className="font-display text-xl sm:text-3xl font-extrabold text-white drop-shadow-md leading-tight">
            {comp.title}
          </h1>
          <p className="text-sm text-white/80 max-w-2xl leading-relaxed">{comp.description}</p>
          {comp.status === "open" && (
            <p className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-300 pt-1">
              <Clock className="h-4 w-4" aria-hidden />
              Cierra en <Countdown closesAt={comp.closesAt} className="tabular-nums font-bold" />
            </p>
          )}
        </div>
      </div>

      {/* BANNERS de estado */}
      {comp.status === "resolved" && winningOption && (
        <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-900 dark:bg-sky-950/40">
          <p className="font-display text-lg font-semibold text-sky-900 dark:text-sky-200">
            🏆 Resultado: {winningOption.label}
          </p>
          {comp.resolutionNote && (
            <p className="mt-1 text-sm text-sky-900/80 dark:text-sky-200/70">{comp.resolutionNote}</p>
          )}
          {myOutcome && (
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
              {myOutcome === "won" ? (
                <><PartyPopper className="h-5 w-5 text-green-600" aria-hidden /> ¡Acertaste! +{formatGoopos(myPayout)}</>
              ) : myOutcome === "refunded" ? (
                <><Ban className="h-5 w-5 text-amber-600" aria-hidden /> Participación reembolsada (nadie acertó o empate anulado)</>
              ) : (
                <><Frown className="h-5 w-5 text-red-500" aria-hidden /> No acertaste esta vez</>
              )}
            </p>
          )}
        </div>
      )}
      {comp.status === "cancelled" && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
          <p className="font-display text-lg font-semibold text-red-900 dark:text-red-200">Competencia cancelada</p>
          <p className="mt-1 text-sm text-red-900/80 dark:text-red-200/70">Motivo: {comp.cancelledReason}</p>
          <p className="mt-1 text-sm text-red-900/80 dark:text-red-200/70">
            Todos los participantes recibieron el reembolso del 100%.
          </p>
        </div>
      )}

      {/* 1. Reglas — SIEMPRE antes del selector */}
      <Card className="mb-6">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Reglas y condiciones</h2>
        </div>
        <dl className="grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evento</dt>
            <dd className="text-sm">{comp.title}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Costo de entrada</dt>
            <dd className="text-sm font-semibold">{formatGoopos(comp.entryCost)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apertura</dt>
            <dd className="text-sm">{new Date(comp.opensAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cierre</dt>
            <dd className="text-sm">{new Date(comp.closesAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</dd>
          </div>
          {comp.expectedResultAt && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resultado estimado</dt>
              <dd className="text-sm">{new Date(comp.expectedResultAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</dd>
            </div>
          )}
          {comp.maxParticipants !== null && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cupo máximo</dt>
              <dd className="text-sm">{comp.maxParticipants} participantes</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cómo se determina el ganador</dt>
            <dd className="text-sm">
              Gana quien haya pronosticado la opción ganadora del resultado oficial del evento. {TIE_RULE_TEXT[comp.tieRule]}
            </dd>
          </div>
          <div className="sm:col-span-2 rounded-xl bg-surface-muted p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">⚙️ Regla de desempate</dt>
            <dd className="text-sm">
              <strong>
                {comp.tieRule === "split_equal" ? "Reparto igual" : comp.tieRule === "earliest_wins" ? "Primer acierto se lleva todo" : "Empate anula la ronda"}
              </strong>
              <br />
              <span className="text-muted-foreground">{TIE_RULE_EXAMPLE[comp.tieRule]}</span>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Opciones disponibles</dt>
            <dd>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm">
                {comp.options.map((o) => (
                  <li key={o.id} className={o.id === comp.winningOptionId ? "font-semibold text-green-700 dark:text-green-400" : ""}>
                    {o.label} {o.id === comp.winningOptionId ? "✔ (ganadora)" : ""}
                  </li>
                ))}
              </ol>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reglas completas</dt>
            <dd className="text-sm whitespace-pre-wrap text-muted-foreground">{comp.rulesText}</dd>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            ⚠️ Las participaciones no se pueden editar ni retirar una vez confirmadas. Cada persona participa una sola vez
            y bajo las mismas reglas.
          </div>
        </dl>
      </Card>

      {/* 2. Participar */}
      <Card className="mb-6">
        <div className="p-5">
          {comp.status === "closed" && (
            <div className="mb-4 rounded-xl bg-surface-muted p-4">
              <p className="font-semibold text-sm">Participaciones cerradas</p>
              {totalPredictions > 0 && (
                <div className="mt-3 space-y-2">
                  {comp.options.map((o) => {
                    const pct = totalPredictions > 0 ? Math.round((o.predictionCount / totalPredictions) * 100) : 0;
                    return (
                      <div key={o.id}>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{o.label}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-[11px] text-muted-foreground">
                    Distribución visible solo después del cierre, para no sesgar las decisiones.
                  </p>
                </div>
              )}
            </div>
          )}

          <ParticipatePanel
            competitionId={comp.id}
            options={comp.options}
            entryCost={comp.entryCost}
            myOptionId={myOptionId}
            disabled={!participable || (participable && !user) || Boolean(disabledReason)}
            disabledReason={disabledReason}
            showDistribution={false}
          />
        </div>
      </Card>

      {/* 3. Participantes y línea de tiempo */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="border-b border-border px-5 py-3">
            <h2 className="flex items-center gap-2 font-display font-semibold">
              <Users className="h-4 w-4" aria-hidden /> Participantes ({participants.length})
            </h2>
          </div>
          {participants.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Aún no hay participaciones.</p>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-auto p-5 text-sm">
              {participants.map((p) => (
                <li key={p.username} className="flex justify-between gap-2">
                  <span>{p.displayName}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-border px-5 py-2 text-xs text-muted-foreground">
            Las elecciones permanecen ocultas mientras la competencia esté abierta.
          </p>
        </Card>

        <Card>
          <div className="border-b border-border px-5 py-3">
            <h2 className="font-display font-semibold">Línea de tiempo</h2>
          </div>
          <ol className="space-y-3 p-5 text-sm">
            <li>✅ <strong>Creada</strong> — con reglas publicadas.</li>
            <li>🔓 <strong>Abierta</strong> — {new Date(comp.opensAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</li>
            <li>🔒 <strong>Cierre</strong> — {new Date(comp.closesAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</li>
            <li>
              {comp.status === "resolved" ? "🏁" : "⏳"}{" "}
              <strong>Resultado</strong>
              {comp.resolvedAt
                ? ` — resuelta el ${new Date(comp.resolvedAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}`
                : comp.expectedResultAt
                  ? ` — estimado el ${new Date(comp.expectedResultAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}`
                  : " — por definir"}
            </li>
          </ol>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <ShareButton />
      </div>
    </div>
  );
}
