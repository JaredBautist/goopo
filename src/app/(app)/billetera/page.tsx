import Link from "next/link";
import { Card, Button, EmptyState } from "@/components/ui";
import { getCurrentUser } from "@/server/services/session-user";
import { listLedger } from "@/server/services/wallet.service";
import { formatGoopos } from "@/lib/constants";
import { RechargeWalletPanel } from "@/components/wallet/recharge-wallet-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Billetera" };

type SearchParams = Promise<{ pagina?: string }>;

const TYPE_LABEL: Record<string, { label: string; sign: 1 | -1 }> = {
  signup_bonus: { label: "🎁 Bonificación", sign: 1 },
  daily_bonus: { label: "☀️ Recarga demo", sign: 1 },
  payout: { label: "🏆 Premio", sign: 1 },
  refund: { label: "↩️ Reembolso", sign: 1 },
  admin_adjust: { label: "⚙️ Ajuste", sign: 1 },
  stake: { label: "🎯 Participación", sign: -1 },
};

export default async function WalletPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.pagina ?? "0") || 0);
  const pageSize = 20;

  const { rows, total } = await listLedger(user.id, page, pageSize);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Billetera</h1>
          <p className="mt-1 text-sm text-muted-foreground">Libro de movimientos (ledger) de tus Goopos.</p>
        </div>
        <Card className="px-5 py-3 text-center border-border/80 bg-surface/80 shadow-md">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo actual</p>
          <p className="font-display text-2xl font-bold text-accent-500">
            {formatGoopos(user.balance)}
          </p>
        </Card>
      </header>

      {/* Recarga de fondos para pruebas y juego */}
      <div className="mb-8">
        <RechargeWalletPanel currentBalance={user.balance} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Historial de movimientos</h2>
        <a href="/api/mis-datos?formato=csv">
          <Button variant="secondary" size="sm">⬇️ Exportar CSV</Button>
        </a>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="🪙"
          title="Todavía no hay movimientos"
          description="Al registrarte deberías haber recibido tu bonificación de bienvenida."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-105 sm:min-w-130 text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left text-[11px] sm:text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 sm:px-4 py-2.5 sm:py-3">Tipo</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">Monto</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">Saldo</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3">Detalle</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const meta = TYPE_LABEL[t.type] ?? { label: t.type, sign: 1 as const };
                const positive = t.amount > 0;
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface-muted/30 transition-colors">
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium whitespace-nowrap">{meta.label}</td>
                    <td className={`px-3 sm:px-4 py-2.5 sm:py-3 text-right font-semibold tabular-nums whitespace-nowrap ${positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {positive ? "+" : "−"}{formatGoopos(Math.abs(t.amount))}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">{formatGoopos(t.balanceAfter)}</td>
                    <td className="max-w-36 sm:max-w-52 truncate px-3 sm:px-4 py-2.5 sm:py-3 text-muted-foreground">
                      {t.competitionId ? (
                        <Link href={`/competencias`} className="hover:text-foreground">{t.note ?? "Competencia"}</Link>
                      ) : (
                        t.note ?? "—"
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString("es-CO", { timeZone: "America/Bogota", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">Página {page + 1} de {pages}</span>
              <div className="flex gap-2">
                {page > 0 && (
                  <Link href={`/billetera?pagina=${page - 1}`} className="rounded-lg bg-surface-muted px-3 py-1.5 hover:bg-surface">← Anterior</Link>
                )}
                {page < pages - 1 && (
                  <Link href={`/billetera?pagina=${page + 1}`} className="rounded-lg bg-surface-muted px-3 py-1.5 hover:bg-surface">Siguiente →</Link>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
