/**
 * Rate limiter en memoria (ventana fija de 60 s).
 * Limitación conocida: en serverless cada instancia tiene su propia memoria.
 */

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

export function isRateLimited(key: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }
  bucket.count++;
  if (bucket.count > maxPerMinute) return true;
  return false;
}

export function rateLimit(key: string, maxPerMinute: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true, remaining: maxPerMinute - 1 };
  }
  bucket.count++;
  return { ok: bucket.count <= maxPerMinute, remaining: Math.max(0, maxPerMinute - bucket.count) };
}

/** Limpieza periódica para no acumular claves muertas. */
export function pruneRateLimiter(): void {
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (now - b.windowStart >= WINDOW_MS) buckets.delete(k);
  }
}
