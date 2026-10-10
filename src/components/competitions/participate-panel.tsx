"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button, FieldError } from "@/components/ui";
import { useToast } from "@/components/ui/toaster";
import { participateAction, type PredictState } from "@/actions/predictions";
import { cn } from "@/lib/utils";
import { formatGoopos } from "@/lib/constants";
import { Lock, CircleAlert, CheckCircle2, ArrowRight } from "lucide-react";

export type OptionItem = { id: string; label: string; description: string | null; predictionCount?: number };

export function ParticipatePanel({
  competitionId,
  options,
  entryCost,
  myOptionId,
  disabled,
  disabledReason,
  showDistribution,
}: {
  competitionId: string;
  options: OptionItem[];
  entryCost: number;
  myOptionId?: string | null;
  disabled?: boolean;
  disabledReason?: string;
  showDistribution?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<string | null>(myOptionId ?? null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [state, formAction, pending] = useActionState<PredictState, FormData>(
    async (prev, fd) => {
      const r = await participateAction(prev, fd);
      if (r.ok) {
        setConfirmOpen(false);
        toast("🎉 ¡Pronóstico confirmado con éxito! Tu participación quedó registrada.");
        router.refresh();
      } else if (r.error) {
        toast(r.error, "error");
      }
      return r;
    },
    {},
  );

  const effectiveOptionId = myOptionId ?? (state.ok ? selected : null);
  const chosen = options.find((o) => o.id === selected);

  if (effectiveOptionId) {
    const mine = options.find((o) => o.id === effectiveOptionId);
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden />
            Pronóstico Registrado Oficialmente
          </p>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            <Lock className="h-3 w-3" /> Bloqueado
          </span>
        </div>
        <p className="mt-2 text-sm text-foreground/90">
          Tu pronóstico confirmado: <strong className="text-emerald-300">{mine?.label ?? "Opción seleccionada"}</strong>.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Por transparencia e integridad de la competencia, no es posible editarlo ni retirarlo.
        </p>
        <div className="mt-4 flex gap-2">
          <a
            href="/mis-pronosticos"
            className="inline-flex items-center gap-1.5 rounded-xl bg-surface px-3 py-1.5 text-xs font-semibold text-foreground border border-border/80 hover:bg-surface-muted transition-colors"
          >
            Ver mis pronósticos activos
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <fieldset
        disabled={disabled}
        className={cn("grid gap-2.5", disabled && "opacity-60")}
      >
        <legend className="mb-2 text-sm font-bold tracking-tight">Elige tu pronóstico:</legend>
        {options.map((o, i) => {
          const isChosen = selected === o.id;
          return (
            <label
              key={o.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200",
                isChosen
                  ? "border-accent-500 bg-accent-500/10 text-foreground ring-1 ring-accent-500 shadow-md"
                  : "border-border/80 bg-surface/80 hover:border-accent-500/40 hover:bg-surface-muted/60 text-foreground",
                disabled && "cursor-not-allowed hover:border-border hover:bg-surface/80",
              )}
            >
              <input
                type="radio"
                name="option"
                value={o.id}
                checked={isChosen}
                onChange={() => setSelected(o.id)}
                disabled={disabled}
                className="mt-1 h-4 w-4 accent-accent-500"
              />
              <span className="flex-1">
                <span className="block text-sm font-semibold tracking-tight">{o.label}</span>
                {o.description ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">{o.description}</span>
                ) : null}
              </span>
              {showDistribution && o.predictionCount !== undefined ? (
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">{o.predictionCount} votos</span>
              ) : null}
              <span className="sr-only">{`Opción ${i + 1}`}</span>
            </label>
          );
        })}
      </fieldset>

      {!disabled && (
        <>
          <Button
            className="mt-5 w-full font-bold shadow-lg"
            size="lg"
            variant="accent"
            disabled={!selected || disabled}
            onClick={() => setConfirmOpen(true)}
          >
            Confirmar pronóstico · {formatGoopos(entryCost)}
          </Button>

          <Dialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Confirmar participación definitiva"
          >
            <p className="text-sm text-foreground/90">
              Una vez confirmes, tu pronóstico <strong>no podrá cambiarse ni retirarse</strong>. Se descontará el costo de entrada de{" "}
              <strong className="text-accent-400">{formatGoopos(entryCost)}</strong> de tu saldo de Goopos.
            </p>
            {chosen ? (
              <div className="my-3 rounded-xl border border-accent-500/30 bg-accent-500/10 p-3 text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground block font-semibold">
                  Opción que has seleccionado:
                </span>
                <strong className="text-base text-foreground mt-0.5 block">{chosen.label}</strong>
              </div>
            ) : null}
            <form action={formAction} className="mt-4">
              <input type="hidden" name="competitionId" value={competitionId} />
              <input type="hidden" name="optionId" value={selected ?? ""} />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
                  Volver y revisar
                </Button>
                <Button type="submit" disabled={pending} variant="accent" className="flex-1 font-semibold">
                  {pending ? "Registrando pronóstico…" : "Confirmar participación"}
                </Button>
              </div>
              {state.error ? (
                <div className="mt-3">
                  <FieldError message={state.error} />
                </div>
              ) : null}
            </form>
          </Dialog>
        </>
      )}

      {disabled && disabledReason ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs sm:text-sm text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
          <span>{disabledReason}</span>
        </p>
      ) : null}
    </div>
  );
}
