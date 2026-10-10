import { ensureDb } from "@/server/db/client";
import { createId } from "@/lib/id";

export async function notify(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
}): Promise<void> {
  const client = await ensureDb();
  await client.execute({
    sql: `INSERT INTO notifications (id, user_id, title, body, href, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [createId(), input.userId, input.title, input.body, input.href ?? null, new Date().toISOString()],
  });
}

export async function notifyMany(
  users: { userId: string; title: string; body: string; href?: string }[],
): Promise<void> {
  for (const n of users) {
    await notify(n);
  }
}

export async function listNotifications(userId: string): Promise<
  { id: string; title: string; body: string; href: string | null; readAt: string | null; createdAt: string }[]
> {
  const client = await ensureDb();
  const r = await client.execute({
    sql: `SELECT id, title, body, href, read_at, created_at FROM notifications
          WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
    args: [userId],
  });
  return r.rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
    href: row.href ? String(row.href) : null,
    readAt: row.read_at ? String(row.read_at) : null,
    createdAt: String(row.created_at),
  }));
}

export async function countUnread(userId: string): Promise<number> {
  const client = await ensureDb();
  const r = await client.execute({
    sql: `SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL`,
    args: [userId],
  });
  return Number(r.rows[0]?.c ?? 0);
}

export async function markRead(userId: string, notificationId: string): Promise<void> {
  const client = await ensureDb();
  await client.execute({
    sql: `UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL`,
    args: [new Date().toISOString(), notificationId, userId],
  });
}

export async function markAllRead(userId: string): Promise<void> {
  const client = await ensureDb();
  await client.execute({
    sql: `UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL`,
    args: [new Date().toISOString(), userId],
  });
}
