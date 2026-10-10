"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";
import { useToast } from "@/components/ui/toaster";
import { rechargeDemoWalletAction } from "@/actions/wallet";
import { formatGoopos } from "@/lib/constants";
import { Coins, Sparkles, PlusCircle, Loader2, ShieldCheck } from "lucide-react";

const PRESET_AMOUNTS = [200, 500, 1000];

export function RechargeWalletPanel({ currentBalance }: { currentBalance: number }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickRecharge = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount("");
    setErrorMsg(null);
    executeRecharge(amount);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(customAmount);
    if (!val || isNaN(val) || val < 10) {
      setErrorMsg("El monto mínimo de recarga es 10 G.");
      return;
    }
    if (val > 10000) {
      setErrorMsg("El monto máximo de recarga es 10.000 G.");
      return;
    }
    setErrorMsg(null);
    executeRecharge(val);
  };

  const executeRecharge = (amountToRecharge: number) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("amount", String(amountToRecharge));
      const res = await rechargeDemoWalletAction({}, fd);

      if (res.error) {
        setErrorMsg(res.error);
        toast(res.error, "error");
      } else if (res.ok) {
        toast(`🎉 ¡Recarga completada! +${formatGoopos(amountToRecharge)} acreditados a tu saldo.`);
        setCustomAmount("");
        router.refresh();
      }
    });
  };

  return (
    <Card className="relative overflow-hidden border border-border/80 bg-surface/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
      {/* Glow decorativo sutil en esquina */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-500/10 blur-3xl" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15 text-accent-500 ring-1 ring-accent-500/25">
              <Coins className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">
                Cargar Goopos a tu Billetera
              </h2>
              <p className="text-xs text-muted-foreground">
                Moneda virtual de prueba · Recargas instantáneas ilimitadas para explorar
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-surface-muted/60 px-3.5 py-2 text-xs text-muted-foreground border border-border/60">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden />
          <span>Saldo disponible: <strong className="text-foreground font-semibold">{formatGoopos(currentBalance)}</strong></span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-12">
        {/* Botones de recarga rápida */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recarga Rápida en 1 Clic
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = selectedPreset === amt && !customAmount;
              return (
                <button
                  key={amt}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleQuickRecharge(amt)}
                  className={`group relative flex flex-col items-center justify-center rounded-xl p-2.5 sm:p-3.5 text-center transition-all duration-150 active:scale-95 min-h-[60px] border ${
                    isSelected
                      ? "border-accent-500 bg-accent-500/15 text-foreground ring-1 ring-accent-500/50 shadow-md"
                      : "border-border/80 bg-surface-muted/40 hover:border-accent-500/40 hover:bg-surface-muted/80 text-foreground"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="font-display text-base sm:text-lg font-bold tracking-tight">
                    +{formatGoopos(amt)}
                  </span>
                  <span className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground group-hover:text-accent-400">
                    {amt === 200 ? "Básica" : amt === 500 ? "Popular" : "Pro"}
                  </span>
                  {isSelected && isPending && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface/80 backdrop-blur-xs">
                      <Loader2 className="h-5 w-5 animate-spin text-accent-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recarga personalizada */}
        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-surface-muted/30 p-3.5 sm:p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Otro Monto Personalizado
          </p>
          <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min="10"
              max="10000"
              step="50"
              placeholder="Ej. 750"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedPreset(null);
                setErrorMsg(null);
              }}
              disabled={isPending}
              className="text-base sm:text-sm h-11 font-medium"
              aria-label="Monto personalizado de Goopos"
            />
            <Button
              type="submit"
              variant="accent"
              size="sm"
              disabled={isPending || !customAmount}
              className="shrink-0 font-semibold gap-1.5 h-11 px-5 justify-center"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Cargar
                </>
              )}
            </Button>
          </form>
          {errorMsg && (
            <p className="mt-2 text-xs text-rose-500 font-medium">
              {errorMsg}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-accent-400 shrink-0" aria-hidden />
        Los fondos acreditados se reflejan inmediatamente en tu saldo y en la tabla de movimientos (ledger) abajo.
      </p>
    </Card>
  );
}
