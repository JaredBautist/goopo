"use client";

import { useActionState, useState } from "react";
import { adjustBalanceAction, type AdminState } from "@/actions/admin";
import { Button, Input } from "@/components/ui";
import { Dialog } from "@/components/ui/dialog";

export function AdjustBalanceForm({ userId, username }: { userId: string; username: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminState, FormData>(adjustBalanceAction, {});

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Ajustar saldo
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Ajustar saldo · @${username}`}>
        <form action={action} className="space-y-3">
          <input type="hidden" name="userId" value={userId} />
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor={`amount-${userId}`}>
              Monto con signo (+500 / −200)
            </label>
            <Input id={`amount-${userId}`} name="amount" type="number" step={10} required placeholder="+250 o −100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor={`reason-${userId}`}>
              Motivo (queda en auditoría)
            </label>
            <Input id={`reason-${userId}`} name="reason" required minLength={5} placeholder="Ej. Compensación por incidencia" />
          </div>
          {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
          {state.ok && <p className="text-sm text-green-700 dark:text-green-400">✅ {state.ok}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cerrar</Button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? "Aplicando…" : "Aplicar ajuste"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
