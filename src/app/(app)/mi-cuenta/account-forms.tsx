"use client";

import { useActionState, useState } from "react";
import {
  updateDisplayNameAction,
  changePasswordAction,
  setDailyLimitAction,
  selfExcludeAction,
  deleteAccountAction,
  type AccountState,
} from "@/actions/account";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { FieldError } from "@/components/ui";
import { useToast } from "@/components/ui/toaster";
import { useEffect } from "react";

function useEffectToast(state: AccountState) {
  const toast = useToast();
  useEffect(() => {
    if (state.ok) toast(state.ok);
  }, [state, toast]);
}

export function AccountForms() {
  return (
    <div className="space-y-4">
      <NameForm />
      <PasswordForm />
      <LimitForm />
      <SelfExcludeForm />
      <DangerZone />
    </div>
  );
}

function NameForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateDisplayNameAction, {});
  useEffectToast(state);
  return (
    <Card className="p-5">
      <h2 className="font-display font-semibold">Nombre visible</h2>
      <form action={action} className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <Label htmlFor="displayName">Nombre</Label>
          <Input id="displayName" name="displayName" required maxLength={60} placeholder="Tu nombre" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </form>
      <FieldError message={state.error} />
    </Card>
  );
}

function PasswordForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePasswordAction, {});
  useEffectToast(state);
  return (
    <Card className="p-5">
      <h2 className="font-display font-semibold">Cambiar contraseña</h2>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="current">Contraseña actual</Label>
          <Input id="current" name="current" type="password" required autoComplete="current-password" />
        </div>
        <div>
          <Label htmlFor="next">Nueva contraseña</Label>
          <Input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" />
          <p className="mt-1 text-xs text-muted-foreground">Mínimo 8 caracteres, con letras y números.</p>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Actualizando…" : "Actualizar contraseña"}
          </Button>
        </div>
      </form>
      <FieldError message={state.error} />
    </Card>
  );
}

function LimitForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(setDailyLimitAction, {});
  useEffectToast(state);
  return (
    <Card className="p-5">
      <h2 className="font-display font-semibold">🛡️ Límite diario de apuestas</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Máximo de Goopos a apostar por día. Bajarlo aplica de inmediato; subirlo espera 24 h (periodo de reflexión).
      </p>
      <form action={action} className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-44 flex-1">
          <Label htmlFor="limit">Límite (vacío = sin límite)</Label>
          <Input id="limit" name="limit" type="number" min={50} step={10} placeholder="ej. 500" />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Guardando…" : "Guardar límite"}
        </Button>
      </form>
      <FieldError message={state.error} />
    </Card>
  );
}

function SelfExcludeForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(selfExcludeAction, {});
  useEffectToast(state);
  return (
    <Card className="p-5">
      <h2 className="font-display font-semibold">🧘 Autoexclusión voluntaria</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Bloquea tu ability para participar durante el periodo elegido. No puede revertirse antes de tiempo.
      </p>
      <form action={action} className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-44 flex-1">
          <Label htmlFor="period">Periodo</Label>
          <Select id="period" name="period" defaultValue="24h">
            <option value="24h">24 horas</option>
            <option value="7d">7 días</option>
            <option value="30d">30 días</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Activando…" : "Activar autoexclusión"}
        </Button>
      </form>
      <FieldError message={state.error} />
    </Card>
  );
}

function DangerZone() {
  const [state, action, pending] = useActionState<AccountState, FormData>(deleteAccountAction, {});
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-red-200 p-5 dark:border-red-900">
      <h2 className="font-display font-semibold text-red-700 dark:text-red-400">Zona de datos</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        <form action="/api/mis-datos">
          <Button type="submit" variant="secondary" formTarget="_blank">
            Descargar mis datos (JSON)
          </Button>
        </form>
        <form action="/api/mis-datos?formato=csv">
          <Button type="submit" variant="secondary" formTarget="_blank">
            Descargar movimientos (CSV)
          </Button>
        </form>
        <Button type="button" variant="danger" onClick={() => setOpen(true)}>
          Eliminar cuenta
        </Button>
      </div>

      {open && (
        <form action={action} className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm">
            Tu perfil será <strong>anonimizado</strong> (las participaciones y el ledger conservan integridad pero sin
            datos personales). Esta acción no se puede deshacer.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="confirm">Escribe ELIMINAR para confirmar</Label>
              <Input id="confirm" name="confirm" required />
            </div>
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
          <FieldError message={state.error} />
        </form>
      )}
    </Card>
  );
}
