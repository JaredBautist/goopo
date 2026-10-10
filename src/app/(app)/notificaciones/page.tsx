import Link from "next/link";
import { Card, Button, EmptyState } from "@/components/ui";
import { getCurrentUser } from "@/server/services/session-user";
import { listNotifications } from "@/server/services/notifications.service";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notificaciones" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const items = await listNotifications(user.id);
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Notificaciones</h1>
          {unread > 0 && <p className="mt-1 text-sm text-muted-foreground">{unread} sin leer</p>}
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="secondary" size="sm">Marcar todas como leídas</Button>
          </form>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="Sin notificaciones por ahora"
          description="Aquí verás confirmaciones de participaciones, premios y avisos."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card
              key={n.id}
              className={`p-4 ${!n.readAt ? "border-primary-300 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/20" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}
                  </p>
                  {n.href && (
                    <Link href={n.href} className="mt-1 inline-block text-sm font-medium text-primary-700 hover:underline dark:text-primary-300">
                      Ver →
                    </Link>
                  )}
                </div>
                {!n.readAt && (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <Button type="submit" variant="ghost" size="sm">Marcar leída</Button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
