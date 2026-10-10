# DECISIONES — Goopo (ARCs cortos)

Registro de decisiones técnicas del MVP.

## ADR-001 — SQLite vía libSQL como base de datos

**Contexto:** el MVP debe desplegarse en Vercel sin configuración (funciones serverless, FS de solo lectura) y correr también en local sin pasos extra.

**Decisión:** SQLite con `@libsql/client` en tres modos: archivo local (`./data/goopo.db`), efímero en `/tmp` bajo `VERCEL=1`, y Turso remoto si hay credenciales.

**Motivos:** cero instalación, schema compartido en los tres modos,志愿团体 gratuita tier generoso en Turso, y un solo `ensureDb()` singleton que aísla la complejidad.

**Consecuencias:** sin persistencia real en Vercel sin Turso (se avisa en UI: "Modo demo"). Para producción seria: Turso o Postgres.

## ADR-002 — Cierre perezoso (lazy closing) en lugar de cron

**Contexto:** Vercel serverless no garantiza crons fiables en el plan gratuito; el cierre es crítico para la transparencia.

**Decisión:** `syncCompetitionStates(now)` pasa a `closed` toda competencia `open` con `closes_at <= now` (comparación por timestamp parseado, hora del **servidor** sin excepciones). Se invoca al listar competencias, al abrir un detalle, en el dashboard admin y **antes de cualquier validación de participación**.

**Motivos:** determinista, idempotente, sin dependencia de cron; imposible participar tras el cierre aunque no exista el cron.

**Consecuencia:** la competencia podría permanecer "abierta" en la lista hasta la próxima petición, pero la validación de participación siempre嗓子 sincroniza primero.

## ADR-003 — Ledger inmutable (solo INSERT)

**Contexto:** transparencia y auditoría del saldo de cada usuario.

**Decisión:** `wallet_transactions` es un libro solo de inserciones; cada fila guarda `amount` con signo y `balance_after`. El saldo (`users.balance`) se actualiza en el mismo batch.

**Motivos:** trazabilidad completa (cómo llegó el usuario a su saldo), verificación de consistencia trivial (`balance == SUM(amount)`), reproducible para soporte/auditoría.

## ADR-004 — Lógica de reparto como dominio puro

**Contexto:** las reglas de empate y el invariante del pozo son el corazón del producto y el principal riesgo.

**Decisión:** `src/server/domain/payouts.ts` es una función pura sin acceso a DB; el seed y el servicio de resolución usan **el mismo motor**.

**Motivos:** 100 % testeable (42 pruebas, incl. 300 casos aleatorios semillados del invariante), misma lógica en datos demo que en producción, sin divergencias.

## ADR-005 — bcryptjs (JS puro) para hashes

**Contexto:** bcrypt nativo requiere binarios compilados, delicados en builds serverless.

**Decisión:** `bcryptjs` (JS puro) con cost 10.

**Motivos:** compatibilidad total con Vercel/Edge builds; para un MVP académico el coste 10 es razonable. En producción real, `argon2` vía runtime externo o bcrypt nativo con `serverExternalPackages`.

## ADR-006 — Sesión propia con jose (JWT HS256 en cookie httpOnly)

**Contexto:** evitar un proveedor de auth externo para mantener el MVP autocontenido y desplegable "sin variables".

**Decisión:** JWT firmado HS256, cookie `goopo_session` httpOnly + sameSite=lax + secure en prod, 7 días. Si falta `AUTH_SECRET` se usa un secreto de demostración con `console.warn` y nota en `/api/health`.

**Consecuencia:** middleware Edge re-verifica el token (defensa en profundidad) y cada Server Action revalida rol/estado desde la DB.

## ADR-007 — Validación con Zod 4 en el servidor siempre

**Decisión:** toda Server Action parsea `FormData` con Zod; los errores se devuelven por campo. Nunca se confía en el cliente.

## ADR-008 — Moneda "Goopos" entera sin decimales

**Decisión:** enteros en toda la DB (sin floats); formateo `1.250 G` con `Intl.NumberFormat('es-CO')`. Esto eliminó aritmética de punto flotante del dominio.

## ADR-009 — Notificaciones simuladas in-app

**Decisión:** tabla `notifications` + campana en navbar. Sin email/SMS (fuera de alcance según la spec).

## ADR-010 — Limitaciones del rate limiter en memoria

**Contexto:** serverless multiplica instancias; un Map en memoria no se comparte.

**Decisión:** rate limiter en memoria con ventana de 60 s para login/registro (5/min) y participar (10/min).

**Motivos:** sufficiente para el MVP y demo; documentado para producción→ Upstash Redis o similar.
