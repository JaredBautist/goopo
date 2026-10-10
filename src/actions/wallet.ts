"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/services/session-user";
import { rechargeDemoWallet } from "@/server/services/wallet.service";
import { logAudit } from "@/server/services/audit.service";
import { notify } from "@/server/services/notifications.service";

export type WalletRechargeState = {
  error?: string;
  ok?: string;
  amount?: number;
  newBalance?: number;
};

const rechargeSchema = z.object({
  amount: z.coerce
    .number()
    .int("El monto debe ser un número entero.")
    .min(10, "El monto mínimo es 10 G.")
    .max(10000, "El monto máximo por recarga es 10.000 G."),
});

export async function rechargeDemoWalletAction(
  _prev: WalletRechargeState,
  formData: FormData,
): Promise<WalletRechargeState> {
  try {
    const user = await requireUser();
    const rawAmount = formData.get("amount");
    const parsed = rechargeSchema.safeParse({ amount: rawAmount });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Monto inválido." };
    }

    const result = await rechargeDemoWallet({
      userId: user.id,
      amount: parsed.data.amount,
    });

    await logAudit({
      actorId: user.id,
      action: "wallet.daily_bonus",
      entityType: "user",
      entityId: user.id,
      metadata: { amount: result.amount, newBalance: result.newBalance },
    });

    await notify({
      userId: user.id,
      title: "Recarga de Goopos exitosa",
      body: `Se acreditaron +${result.amount} Goopos de demostración en tu billetera.`,
      href: "/billetera",
    });

    revalidatePath("/billetera");
    revalidatePath("/mi-cuenta");
    revalidatePath("/competencias");
    revalidatePath("/");

    return {
      ok: `¡Recarga exitosa! Se añadieron +${result.amount} G a tu billetera.`,
      amount: result.amount,
      newBalance: result.newBalance,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al recargar fondos.";
    return { error: msg === "UNAUTHORIZED" ? "Debes iniciar sesión para recargar." : msg };
  }
}
