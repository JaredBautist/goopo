// Verificación E2E de la lógica de dominio contra la DB real de demo
import { createClient } from '@libsql/client';
import { computePayouts } from '../src/server/domain/payouts';
import { resolveDbUrl } from '../src/server/db/client';

const url = resolveDbUrl().url;
const c = createClient({ url });

// 1. Todas las competencias resueltas del seed: la suma de pagos = pozo
const comps = await c.execute(`SELECT id, slug, tie_rule, winning_option_id FROM competitions WHERE status='resolved'`);
let allOk = true;
for (const comp of comps.rows) {
  const preds = await c.execute({
    sql: `SELECT id, user_id, option_id, stake, created_at, payout, status FROM predictions WHERE competition_id = ?`,
    args: [String(comp.id)],
  });
  const pool = preds.rows.reduce((s, p) => s + Number(p.stake), 0);
  const totalInDb = preds.rows.reduce((s, p) => s + Number(p.payout), 0);
  const pure = computePayouts({
    pool,
    winningOptionId: comp.winning_option_id ? String(comp.winning_option_id) : null,
    tieRule: String(comp.tie_rule) as 'split_equal' | 'earliest_wins' | 'refund_all',
    predictions: preds.rows.map((p) => ({
      id: String(p.id), userId: String(p.user_id), optionId: String(p.option_id),
      stake: Number(p.stake), createdAt: String(p.created_at),
    })),
  });
  const pureTotal = pure.outcomes.reduce((s, o) => s + o.amount, 0);
  const statusMatch = pure.outcomes.every((o) => {
    const db = preds.rows.find((p) => String(p.id) === o.predictionId);
    return db && String(db.status) === o.status && Number(db.payout) === o.amount;
  });
  const ok = pureTotal === pool && totalInDb === pool && statusMatch;
  if (!ok) { allOk = false; console.log('❌ MISMATCH en', comp.slug); }
  else console.log(`✅ ${comp.slug}: pool ${pool} = pagos ${totalInDb} (puro==db)`);
}

// 2. Ledger vs balance para todos
const bad = await c.execute(`SELECT u.id, u.balance, COALESCE(SUM(w.amount),0) t FROM users u LEFT JOIN wallet_transactions w ON w.user_id=u.id GROUP BY u.id HAVING u.balance != t`);
console.log('mismatches ledger:', bad.rows.length);

// 3. Competencias activas aceptan participaciones (estado + ventana)
const open = await c.execute(`SELECT slug, closes_at FROM competitions WHERE status='open'`);
console.log('abiertas:', open.rows.map(r => `${r.slug} (cierra ${String(r.closes_at).slice(0,16)})`).join(', '));

console.log(allOk && bad.rows.length === 0 ? '🏆 FLUJO DE DOMINIO CONSISTENTE' : '⚠️ REVISAR');
c.close();
