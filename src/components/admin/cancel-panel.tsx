"use client";

import { useActionState, useState } from "react";
import { cancelCompetitionAction, type AdminState } from "@/actions/admin";
import { Button, Card, Input, Label, FieldError } from "@/components/ui";
import { Dialog } from "@/components/ui/dialog";
import { Ban } from "lucide-react";

export function CancelPanel({ competitionId }: { competitionId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminState, FormData>(cancelCompetitionAction, {});

  return (
    <Card className="border-red-200 p-5 dark:border-red-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display font-semibold text-red-700 dark:text-red-400">
            <Ban className="h-5 w-5" aria-hidden /> Cancelar competencia
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Reembolsa el 100% a todos los participantes. La competencia queda inmutable con su motivo visible.
          </p>
        </div>
        <Button variant="danger" onClick={() => setOpen(true)}>Cancelar…</Button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Cancelar competencia">
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={competitionId} />
          <div>
            <Label htmlFor="reason">Motivo (visible para los participantes)</Label>
            <Input id="reason" name="reason" required minLength={10} maxLength={300} placeholder="Ej. El evento se pospuso y no tiene nueva fecha." />
          </div>
          <div>
            <Label htmlFor="confirm">Escribe CANCELAR para confirmar (irreversible)</Label>
            <Input id="confirm" name="confirm" placeholder="CANCELAR" autoComplete="off" required />
          </div>
          <FieldError message={state.error} />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Volver</Button>
            <Button type="submit" variant="danger" className="flex-1" disabled={pending}>
              {pending ? "Procesando…" : "Confirmar cancelación"}
            </Button>
          </div>
          {state.ok && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">✅ {state.ok}</p>}
        </form>
      </Dialog>
    </Card>
  );
}
