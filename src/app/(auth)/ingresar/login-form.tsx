"use client";

import { useActionState, useState } from "react";
import { loginAction, type AuthFormState } from "@/actions/auth";
import { Button, Input, Label } from "@/components/ui";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    (prev, fd) => {
      return loginAction(prev, fd);
    },
    {},
  );

  const fillAndSubmit = (u: string, p: string) => {
    setIdentifier(u);
    setPassword(p);
    const fd = new FormData();
    fd.append("identifier", u);
    fd.append("password", p);
    formAction(fd);
  };

  return (
    <div>
      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="identifier">Correo o usuario</Label>
          <Input
            id="identifier"
            name="identifier"
            autoComplete="username"
            inputMode="email"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="ana@goopo.demo"
            className="text-base sm:text-sm h-11"
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-base sm:text-sm h-11"
          />
        </div>
        {state.error != null && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400 font-medium">
            {state.error}
          </p>
        )}
        <Button type="submit" className="w-full h-11 min-h-[44px] text-sm font-semibold shadow-md" disabled={pending}>
          {pending ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-primary-300 bg-primary-50/60 p-4 dark:border-primary-800 dark:bg-primary-900/30">
        <p className="font-semibold text-xs uppercase tracking-wider text-primary-800 dark:text-primary-200">
          🧪 Acceso rápido demo (1 clic)
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Toca una cuenta para ingresar de inmediato en móvil sin digitar credenciales:
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => fillAndSubmit("ana@goopo.demo", "Goopo1234")}
            className="flex items-center justify-between rounded-xl bg-surface p-2.5 text-xs border border-border/80 hover:border-primary-400 transition-all active:scale-98 min-h-[44px]"
          >
            <div className="text-left">
              <span className="font-bold text-foreground block">Ana Restrepo (participante)</span>
              <span className="text-[11px] text-muted-foreground">ana@goopo.demo</span>
            </div>
            <span className="text-xs font-semibold text-primary-500">Entrar →</span>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => fillAndSubmit("carlos@goopo.demo", "Goopo1234")}
            className="flex items-center justify-between rounded-xl bg-surface p-2.5 text-xs border border-border/80 hover:border-primary-400 transition-all active:scale-98 min-h-[44px]"
          >
            <div className="text-left">
              <span className="font-bold text-foreground block">Carlos Martínez (participante)</span>
              <span className="text-[11px] text-muted-foreground">carlos@goopo.demo</span>
            </div>
            <span className="text-xs font-semibold text-primary-500">Entrar →</span>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => fillAndSubmit("admin@goopo.demo", "Admin1234")}
            className="flex items-center justify-between rounded-xl bg-surface p-2.5 text-xs border border-border/80 hover:border-primary-400 transition-all active:scale-98 min-h-[44px]"
          >
            <div className="text-left">
              <span className="font-bold text-foreground block">Admin Goopo</span>
              <span className="text-[11px] text-muted-foreground">admin@goopo.demo</span>
            </div>
            <span className="text-xs font-semibold text-primary-500">Entrar →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function DemoAccounts() {
  return null; // Integrado directamente en LoginForm con botones interactivos de 1 clic
}
