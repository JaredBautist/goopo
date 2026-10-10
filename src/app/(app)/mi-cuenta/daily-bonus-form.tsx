"use client";

import { useActionState, useEffect } from "react";
import { claimDailyBonusAction, type AccountState } from "@/actions/account";
import { Button, Card } from "@/components/ui";
import { useToast } from "@/components/ui/toaster";
import { Coins } from "lucide-react";

export function DailyBonusForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(
    claimDailyBonusAction as unknown as (prev: AccountState, fd: FormData) => Promise<AccountState>,
    {},
  );
  const toast = useToast();
  useEffect(() => {
    if (state.ok) toast(state.ok);
    if (state.error) toast(state.error, "error");
  }, [state, toast]);

  return (
    <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
      <div className="flex items-center gap-3">
        <Coins className="h-6 w-6 text-accent-500" aria-hidden />
        <div>
          <p className="font-display font-semibold">Recarga diaria demo</p>
          <p className="text-xs text-muted-foreground">
            +200 G una vez cada 24 h, solo si tu saldo es menor a 200 G.
          </p>
        </div>
      </div>
      <form action={action} className="contents">
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Procesando…" : "Reclamar +200 G"}
        </Button>
      </form>
    </Card>
  );
}
