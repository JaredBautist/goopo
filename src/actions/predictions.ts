"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/server/services/session-user";
import { placePrediction } from "@/server/services/predictions.service";
import { syncCompetitionStates } from "@/server/services/competitions.service";

export type PredictState = { error?: string; ok?: boolean };

const schema = z.object({
  competitionId: z.string().min(1).max(64),
  optionId: z.string().min(1).max(64),
});

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return h.get("x-real-ip");
}

/** Verificación de origen (defensa CSRF adicional a las Server Actions). */
async function sameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("host");
  if (!origin || !host) return true; // acción interna
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function participateAction(
  _prev: PredictState,
  formData: FormData,
): Promise<PredictState> {
  if (!(await sameOrigin())) {
    return { error: "Origen de la petición no válido." };
  }

  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const parsed = schema.safeParse({
    competitionId: formData.get("competitionId"),
    optionId: formData.get("optionId"),
  });
  if (!parsed.success) return { error: "Datos de participación inválidos." };

  // Cierre perezoso SIEMPRE antes de validar participación
  await syncCompetitionStates();

  const result = await placePrediction({
    userId: user.id,
    competitionId: parsed.data.competitionId,
    optionId: parsed.data.optionId,
    ip: await clientIp(),
  });

  if (!result.ok) {
    return { error: result.reason };
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/competencias");
  revalidatePath("/mis-pronosticos");
  revalidatePath("/billetera");
  revalidatePath("/mi-cuenta");
  revalidatePath("/");

  return { ok: true };
}
