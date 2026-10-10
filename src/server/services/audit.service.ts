import { ensureDb } from "@/server/db/client";
import { createId } from "@/lib/id";

export type AuditAction =
  | "auth.register"
  | "auth.login"
  | "auth.logout"
  | "competition.create"
  | "competition.update"
  | "competition.publish"
  | "competition.close"
  | "competition.resolve"
  | "competition.cancel"
  | "prediction.create"
  | "wallet.adjust"
  | "wallet.daily_bonus"
  | "user.self_exclude"
  | "user.limit_change"
  | "user.suspend"
  | "user.reactivate"
  | "user.delete"
  | "account.password_change";

/** Trunca y anonimiza la IP: solo se guardan los primeros 2 octetos (IPv4). */
export function anonymizeIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const clean = ip.trim();
  if (clean.includes(".")) {
    const parts = clean.split(".");
    if (parts.length >= 3) return `${parts[0]}.${parts[1]}.x.x`;
  }
  if (clean.includes(":")) {
    const parts = clean.split(":");
    if (parts.length >= 3) return `${parts[0]}:${parts[1]}::x`;
  }
  return "desconocida";
}

export async function logAudit(input: {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  const client = await ensureDb();
  await client.execute({
    sql: `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, ip, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      createId(),
      input.actorId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      anonymizeIp(input.ip),
      new Date().toISOString(),
    ],
  });
}
