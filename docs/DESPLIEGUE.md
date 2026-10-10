# DESPLIEGUE — Goopo

## 1. Local

```bash
npm install
npm run dev
# http://localhost:3000 — la DB se crea y siembra sola en el primer arranque
```

Opcional: `cp .env.example .env.local` y define `AUTH_SECRET` (recomendado).

Verificación completa: `npm run verify` (lint + typecheck + tests + build).

## 2. Vercel — modo demo (cero configuración)

1. Sube el repo a GitHub.
2. Vercel → *Add New → Project → Import* → Framework: Next.js (detectado).
3. **Deploy** sin tocar nada.

Qué hace: al primer cold start, la función crea el esquema y siembra datos demo en `/tmp/goopo.db`. Cada vez que la instancia muere, los datos se regeneran al siguiente arranque. La UI muestra: *"Modo demo: los datos pueden reiniciarse periódicamente"*.

> Recomendado de todos modos: añadir `AUTH_SECRET` con un valor aleatorio largo (`openssl rand -hex 32`).

## 3. Vercel — persistencia real con Turso

```bash
# 1. Crear la base (https://turso.tech — free tier)
turso db create goopo
turso db show goopo --url          # ← TURSO_DATABASE_URL (libsql://…)
turso db tokens create goopo       # ← TURSO_AUTH_TOKEN

# 2. Migrar y sembrar UNA vez desde tu máquina
TURSO_DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… npm run db:migrate
TURSO_DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… npm run db:seed

# 3. Variables de entorno en Vercel → Redeploy
```

La selección del modo es automática: si existen `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`, se usa Turso; si existe `VERCEL=1` sin Turso, `/tmp`; si no, archivo local.

## 4. Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| Build falla con binarios nativos de libsql | registro de postinstall bloqueado o plataforma sin binario precompilado | El proyecto ya declara `serverExternalPackages: ["@libsql/client", "libsql"]` en `next.config.ts`; tras `rm -rf node_modules package-lock.json && npm install` vuelve a intentar `npm run build` |
| `/api/health` responde `mode: "tmp"` | se desplegó en Vercel sin credenciales Turso | es el modo demo esperado; añade Turso para persistencia |
| Login siempre falla con `Credenciales inválidas` | `AUTH_SECRET` cambió tras emitir la sesión | cerrar sesión y volver a entrar (se firma con la nueva secret) |
| "Modo demo…" persiste aunque configuré Turso | variables sin redeploy | guarda las variables y haz **Redeploy** |
| Los datos demo reaparecen | instancia efímera reiniciada | comportamiento del modo B; usa Turso |
| 500 al participar en Vercel | cold start + seed interrumpido | reintenta; el seed es idempotente y se reanuda |

## 5. Crons (opcional)

El cierre perezoso hace innecesario un cron para el funcionamiento. Si se desea sincronización programada:

```json
// vercel.json (ejemplo; no es obligatorio)
{
  "crons": [{ "path": "/api/health", "schedule": "0 * * * *" }]
}
```

Un `GET /api/health` programado warm-ea la instancia y fuerza el `ensureDb()` (migraciones + cierre perezoso).
