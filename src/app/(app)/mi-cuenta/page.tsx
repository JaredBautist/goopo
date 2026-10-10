import { Card } from "@/components/ui";
import { getCurrentUser } from "@/server/services/session-user";
import { AccountForms } from "./account-forms";
import { DailyBonusForm } from "./daily-bonus-form";
import { formatGoopos } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi cuenta" };

export default async function MyAccountPage() {
  const user = await getCurrentUser();
  if (!user) return null; // mediado por middleware

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Mi cuenta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <strong>@{user.username}</strong> · {user.email} ·{" "}
          {user.role === "admin" ? "Administrador" : "Participante"}
        </p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo actual</p>
          <p className="mt-1 font-display text-2xl font-bold text-accent-600 dark:text-accent-400">
            {formatGoopos(user.balance)}
          </p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Límite diario</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {user.dailyLimit === null ? "Sin límite" : formatGoopos(user.dailyLimit)}
          </p>
        </Card>
        <Card className={`p-5 text-center ${user.status !== "active" ? "border-amber-300 dark:border-amber-800" : ""}`}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {user.status === "active"
              ? "✅ Activa"
              : user.status === "self_excluded"
                ? "⏸️ Autoexcluida"
                : "⛔ Suspendida"}
          </p>
        </Card>
      </div>

      <AccountForms />
      <DailyBonusForm />
    </div>
  );
}
