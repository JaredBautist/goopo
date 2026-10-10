"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { registerUser, authenticate } from "@/server/services/auth.service";
import { createSessionToken, setSessionCookie, clearSessionCookie, SESSION_COOKIE } from "@/server/session";
import { logAudit } from "@/server/services/audit.service";
import { rateLimit } from "@/server/rate-limit";
import { headers } from "next/headers";

export type AuthFormState = { error?: string; fieldErrors?: Record<string, string> };

const registerSchema = z.object({
  email: z.string().email("Correo inválido").max(120),
  username: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y guion bajo"),
  displayName: z.string().min(1, "Requerido").max(60),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[a-zA-Z]/, "Debe incluir al menos una letra")
    .regex(/\d/, "Debe incluir al menos un número"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  terms: z.literal(true, { error: "Debes aceptar los términos" }),
});

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return h.get("x-real-ip");
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await clientIp();
  if (!rateLimit(`register:${ip ?? "na"}`, 5).ok) {
    return { error: "Demasiados intentos. Espera un minuto." };
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
    birthDate: formData.get("birthDate"),
    terms: formData.get("terms") === "on" ? true : false,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Revisa los campos marcados.", fieldErrors };
  }

  const result = await registerUser(parsed.data);
  if (!result.ok) {
    if (result.error === "underage") {
      return { error: "Debes ser mayor de 18 años para registrarte. Registro rechazado." };
    }
    if (result.error === "duplicate_email") return { error: "Ese correo ya está registrado.", fieldErrors: { email: "Ya existe una cuenta con este correo." } };
    if (result.error === "duplicate_username") return { error: "Ese nombre de usuario ya está en uso.", fieldErrors: { username: "No disponible. Prueba otro." } };
    return { error: "La contraseña no cumple la política de seguridad.", fieldErrors: { password: "Mínimo 8 caracteres, con letras y números." } };
  }

  await logAudit({
    action: "auth.register",
    entityType: "user",
    entityId: result.userId,
    ip,
  });

  const token = await createSessionToken({
    userId: result.userId,
    role: "participant",
    username: parsed.data.username,
  });
  await setSessionCookie(token);
  redirect("/mi-cuenta");
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await clientIp();
  const identifier = String(formData.get("identifier") ?? "");
  if (!rateLimit(`login:${ip ?? "na"}:${identifier.toLowerCase()}`, 5).ok) {
    return { error: "Demasiados intentos. Espera un minuto." };
  }

  const parsed = z
    .object({
      identifier: z.string().min(1, "Requerido").max(120),
      password: z.string().min(1, "Requerido").max(200),
    })
    .safeParse({ identifier, password: formData.get("password") });
  if (!parsed.success) return { error: "Credenciales inválidas." };

  const result = await authenticate(parsed.data.identifier, parsed.data.password);
  if (!result.ok) {
    return { error: "Credenciales inválidas." };
  }

  await logAudit({
    actorId: result.userId,
    action: "auth.login",
    entityType: "user",
    entityId: result.userId,
    ip,
  });

  const token = await createSessionToken({
    userId: result.userId,
    role: result.role,
    username: result.username,
  });
  await setSessionCookie(token);
  redirect("/competencias");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}

/** Utilidad para el middleware: la cookie no se puede leer con jose en Edge sin esto */
export async function hasSessionCookie(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return Boolean(store.get(SESSION_COOKIE)?.value);
}
