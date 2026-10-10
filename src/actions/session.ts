"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/server/session";
import { logAudit } from "@/server/services/audit.service";
import { getCurrentUser } from "@/server/services/session-user";

export async function logout(): Promise<void> {
  const user = await getCurrentUser().catch(() => null);
  await clearSessionCookie();
  if (user) {
    await logAudit({
      actorId: user.id,
      action: "auth.logout",
      entityType: "user",
      entityId: user.id,
    });
  }
  redirect("/");
}
