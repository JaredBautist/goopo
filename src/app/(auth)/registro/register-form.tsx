"use client";

import { useActionState, useState } from "react";
import { registerAction, type AuthFormState } from "@/actions/auth";
import { Button, Input, Label } from "@/components/ui";
import { FieldError } from "@/components/ui";

function strength(pw: string): { label: string; color: string; pct: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-zA-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  const levels = [
    { label: "Muy débil", color: "bg-red-500", pct: 20 },
    { label: "Débil", color: "bg-orange-500", pct: 40 },
    { label: "Aceptable", color: "bg-yellow-500", pct: 60 },
    { label: "Fuerte", color: "bg-green-500", pct: 80 },
    { label: "Muy fuerte", color: "bg-green-600", pct: 100 },
  ];
  return levels[Math.min(score, 4)] ?? levels[0]!;
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(registerAction, {});
  const [pw, setPw] = useState("");
  const st = strength(pw);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="displayName">Nombre visible</Label>
        <Input id="displayName" name="displayName" required maxLength={60} placeholder="Ej. Ana Restrepo" />
        <FieldError message={state.fieldErrors?.displayName} />
      </div>
      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" />
        <FieldError message={state.fieldErrors?.email} />
      </div>
      <div>
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input id="username" name="username" required minLength={3} maxLength={20} placeholder="minúsculas, números, _" />
        <FieldError message={state.fieldErrors?.username} />
        <p className="mt-1 text-xs text-muted-foreground">3–20 caracteres; solo minúsculas, números y guion bajo.</p>
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        {pw && (
          <div className="mt-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className={`h-full ${st.color} transition-all`} style={{ width: `${st.pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Fortaleza: {st.label}</p>
          </div>
        )}
        <FieldError message={state.fieldErrors?.password} />
        <p className="mt-1 text-xs text-muted-foreground">Mínimo 8 caracteres, con al menos una letra y un número.</p>
      </div>
      <div>
        <Label htmlFor="birthDate">Fecha de nacimiento</Label>
        <Input id="birthDate" name="birthDate" type="date" required max="9999-12-31" />
        <FieldError message={state.fieldErrors?.birthDate} />
        <p className="mt-1 text-xs text-muted-foreground">
          Debes ser mayor de 18 años para registrarte. En un servicio real se exigiría verificación documental.
        </p>
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 accent-primary-600" />
          <span>
            Acepto las{" "}
            <span className="font-medium text-primary-700 dark:text-primary-300">reglas de la plataforma</span> y entiendo
            que Goopo opera con moneda virtual sin dinero real.
          </span>
        </label>
        <FieldError message={state.fieldErrors?.terms} />
      </div>
      {state.error != null && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
