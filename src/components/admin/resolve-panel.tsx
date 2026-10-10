"use client";

import { useActionState, useMemo, useState } from "react";
import { resolveCompetitionAction, type AdminState } from "@/actions/admin";
import { Button, Card, Input, Label, Select, FieldError } from "@/components/ui";
import { Dialog } from "@/components/ui/dialog";
import { formatGoopos } from "@/lib/constants";
import { Trophy } from "lucide-react";

export function ResolvePanel({
  competitionId,
  options,
  pool,
  participantCount,
  tieRule,
}: {
  competitionId: string;
  options: { id: string; label: string; votes: number }[];
  pool: number;
  participantCount: number;
  tieRule: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [state, action, pending] = useActionState<AdminState, FormData>(resolveCompetitionAction, {});

  const preview = useMemo(() => {
    const opt = options.find((o) => o.id === selected);
    if (!opt || opt.votes === 0 || pool === 0) return null;

    if (tieRule === "split_equal") {
      const base = Math.floor(pool / opt.votes);
      const remainder = pool - base * opt.votes;
      return {
        kind: "split" as const,
        winners: opt.votes,
        per: base,
        remainder,
        note: "El residuo se asigna al acertante con el primer pronóstico.",
      };
    }
    if (tieRule === "earliest_wins") {
      return {
        kind: "earliest" as const,
        winners: opt.votes,
        note: `El primer acertante cronológico se lleva todo el pozo; los otros ${Math.max(0, opt.votes - 1)} acertantes no reciben nada.`,
      };
    }
    // refund_all
    if (opt.votes > 1) {
      return {
        kind: "refund" as const,
        winners: opt.votes,
        note: `Empate con ${opt.votes} acertantes: se reembolsa a TODOS los participantes (${participantCount}) y el pozo no se reparte.`,
      };
    }
    return {
      kind: "single" as const,
      winners: 1,
      note: `Un único acertante se lleva ${formatGoopos(pool)}.`,
    };
  }, [selected, options, pool, participantCount, tieRule]);

  return (
    <Card className="border-amber-200 p-5 dark:border-amber-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <Trophy className="h-5 w-5 text-amber-500" aria-hidden /> Resolver competencia
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Defined el resultado oficial y el sistema reparte el pozo según la regla publicada.
            {pool > 0 ? ` Pozo: ${formatGoopos(pool)}.` : " No hay participaciones: la competencia simplemente se cerrará."}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}        disabled={pool === 0}>Resolver…</Button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Resolver competencia" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <Label htmlFor="winningOption">Opción ganadora (resultado oficial)</Label>
            <Select
              id="winningOption"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Elige…</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label} ({o.votes} pronósticos)
                </option>
              ))}
            </Select>
          </div>

          {preview && (
            <div className="rounded-xl bg-surface-muted p-4 text-sm">
              <p className="font-semibold">Previsualización del reparto</p>
              {preview.kind === "split" ? (
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>💰 Pozo total: <strong className="text-foreground">{formatGoopos(pool)}</strong></li>
                  <li>👥 Ganadores: <strong className="text-foreground">{preview.winners}</strong></li>
                  <li>🎯 Pago por ganador: <strong className="text-foreground">{formatGoopos(preview.per)}</strong></li>
                  {preview.remainder > 0 && (
                    <li>➕ Residuo <strong className="text-foreground">{formatGoopos(preview.remainder)}</strong> al primer acertante</li>
                  )}
                  <li className="text-xs">{preview.note}</li>
                </ul>
              ) : (
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>💰 Pozo total: <strong className="text-foreground">{formatGoopos(pool)}</strong></li>
                  <li>👥 {preview.winners} acertante(s)</li>
                  <li className="text-xs">{preview.note}</li>
                </ul>
              )}
              <p className="mt-2 border-t border-border pt-2 text-xs">
                Invariante garantizado: la suma de pagos y reembolsos es exactamente el pozo ({formatGoopos(pool)}).
                Los {participantCount - (preview.winners ?? 0)} participantes no acertantes{preview.kind === "refund" ? " también serán reembolsados" : " no reciben nada"}.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="resolutionNote">Nota de resolución (opcional)</Label>
            <Input id="resolutionNote" name="resolutionNote" placeholder="Ej. Resultado oficial del acta del jurado…" maxLength={300} />
          </div>

          <form action={action}>
            <input type="hidden" name="id" value={competitionId} />
            <input type="hidden" name="winningOptionId" value={selected} />
            <Label htmlFor="confirm">Escribe RESOLVER para confirmar (irreversible)</Label>
            <Input id="confirm" name="confirm" placeholder="RESOLVER" autoComplete="off" required />
            <FieldError message={state.error} />
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Volver</Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={pending || !selected}>
                {pending ? "Repartiendo…" : "Confirmar y repartir"}
              </Button>
            </div>
            {state.ok && <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">✅ {state.ok}</p>}
          </form>
        </div>
      </Dialog>
    </Card>
  );
}
