# 🎲 Goopo

**Plataforma académica de pronósticos entre participantes** con moneda virtual (`G` — *Goopos*).

> ⚠️ **Proyecto académico — sin dinero real.** Los Goopos son una moneda de demostración: no se compran, no se venden, no se canjean. No hay pasarelas de pago, ni retiros, ni apostar dinero real en ninguna parte del sistema.

Goopo permite organizar competencias donde los participantes eligen una opción sobre un resultado previamente definido, con **transparencia total**: el evento, las opciones, el momento de cierre, la forma de determinar al ganador y la regla de desempate se publican **antes** de participar y no cambian después.

---

## ✨ Características

- **Competencias** con estados (`borrador → abierta → cerrada → resuelta/cancelada`), categorías, cupo, pozo y cierre automático.
- **Reglas visibles antes de participar** (principio de transparencia del concepto original) con ejemplo numérico de la regla de empate.
- **Participar** con validación estricta en servidor: sesión activa, mayoría de edad, ventana de tiempo (hora del servidor, nunca la del cliente), opción válida, una participación única, cupo, saldo y límite diario.
- **Resolución con tres reglas de empate**: `reparto igual` (residuo al primero), `primer acierto se lleva todo`, `empate anula y reembolsa`. **Invariante garantizado y probado:** la suma de pagos + reembolsos es exactamente el pozo — no se crean ni destruyen Goopos.
- **Billetera** con libro de movimientos (ledger) inmutable, recarga diaria demo, exportación CSV y descarga de datos (JSON).
- **Juego responsable simulado**: límite diario (subirlo espera 24 h), autoexclusión 24 h / 7 días / 30 días irreversible.
- **Ranking** global y 30 días por neto, con % de acierto y desempates.
- **Panel de administración**: dashboard con métricas y gráfica, CRUD de competencias con opciones dinámicas (2–8 reordenables), cerrar/resolver (con **previsualización del reparto** y confirmación por palabra clave), cancelar con motivo, gestión de usuarios (suspender, ajuste de saldo con motivo) y **registro de auditoría** filtrable.
- **Notificaciones internas** (simuladas, sin email), banners de demo/académico, modo claro/oscuro, responsive y accesible (WCAG AA).

## 🧰 Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript estricto |
| UI | Tailwind CSS 4 + componentes propios + lucide-react |
| Validación | Zod (en servidor siempre) |
| Base de datos | SQLite vía libSQL (modo local, `/tmp` en Vercel o Turso) + Drizzle ORM |
| Auth | Sesiones propias con `jose` (JWT HS256, cookie `httpOnly`) + `bcryptjs` |
| Tests | Vitest (42 pruebas de dominio, incluido property-based del invariante del pozo) |
| Despliegue | Vercel (cero configuración) o local |

## 🚀 Cómo correr en local

```bash
npm install
npm run dev
# → http://localhost:3000 (crea y siembra data/goopo.db automáticamente)
```

Opcional: `cp .env.example .env.local` para configurar `AUTH_SECRET` (o córrelo tal cual: usa un secreto de demostración con un aviso).

### Cuentas de demostración

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@goopo.demo` | `Admin1234` |
| Participante | `ana@goopo.demo` | `Goopo1234` |
| Participante | `carlos@goopo.demo` | `Goopo1234` |

(+9 participantes más con `Goopo1234`). Aparecen en la pantalla de ingreso con acceso rápido.

## ☁️ Despliegue en Vercel (3 modos)

Sin **ninguna** variable de entorno (modo demo):

1. Sube el repo a GitHub.
2. En Vercel → *Add New → Project → Import*.
3. Deploy. Listo — funciona con SQLite efímero en `/tmp` (se avisa en la UI: *"Modo demo: los datos pueden reiniciarse periódicamente"*).

Con persistencia real (opcional, Turso):

```bash
turso db create goopo
turso db show goopo --url   # → TURSO_DATABASE_URL
turso db tokens create goopo # → TURSO_AUTH_TOKEN
```

Añade en Vercel (Settings → Environment Variables):
- `TURSO_DATABASE_URL` (ej. `libsql://goopo-<tu-org>.turso.io`)
- `TURSO_AUTH_TOKEN`
- `AUTH_SECRET` (recomendado, valor aleatorio largo)

Luego, una vez (migrar + sembrar):
```bash
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:migrate
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:seed
```

## 📜 Scripts

```bash
npm run dev          # desarrollo con auto-seed
npm run build        # build de producción
npm start            # servidor de producción local
npm test             # pruebas unitarias (Vitest)
npm run test:watch   # modo watch
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run verify       # lint + typecheck + test + build
npm run db:migrate   # aplicar migraciones
npm run db:seed      # sembrar datos demo (idempotente)
npm run db:reset     # borrar + migrar + sembrar
npm run db:studio    # Drizzle Studio
```

## 🏗️ Arquitectura

```
src/
├─ app/                    # Rutas App Router (público, auth, app, admin, api)
├─ actions/                # Server Actions (Zod + permisos siempre verificadas)
├─ components/
│  ├─ ui/                  # Primitivas (Button, Card, Badge, Input, Dialog, Toaster...)
│  ├─ layout/              # Navbar, Footer, AgeGate, ThemeToggle, DemoBanner
│  ├─ competitions/        # CompetitionCard, Countdown, ParticipatePanel, ShareButton
│  └─ admin/               # ResolvePanel (previsualización), CancelPanel
├─ server/
│  ├─ db/                  # client.ts (ensureDb único), schema.ts, migrate.ts, seed.ts
│  ├─ domain/              # PURO y testeable: payouts, competition-state, rules, responsible-play
│  ├─ services/            # auth, competitions, predictions, wallet, audit, notifications
│  └─ session.ts, rate-limit.ts
├─ lib/                    # constantes (Goopos, límites), utils, id
└─ types/
middleware.ts              # Protección de /mi-cuenta, /billetera, /notificaciones, /admin
tests/unit/                # 42 pruebas del dominio (payouts con property-based)
```

**Decisiones clave** (detalle en `docs/DECISIONES.md`):
- Lógica de negocio en `src/server/domain/` **pura** → 100 % testeable sin DB.
- **Cierre perezoso (lazy closing)**: en serverless no hay cron fiable fiable; `syncCompetitionStates()` se ejecuta al listar, al abrir un detalle y **antes de cualquier participación**.
- **Ledger inmutable** (solo INSERT): cada movimiento de saldo escribe el `balance_after`, auditable línea por línea; consistencia verificada en seed y tests.
- **Tres modos de DB** con `ensureDb()` singleton: nadie más crea clientes.

## 🧪 Cobertura de pruebas

- `payouts.ts`: 1 ganador, split igual con/sin residuo, earliest_wins (desempate por fecha+id), refund_all (1 y varios), nadie acertó, y **invariante `sum(payouts) === pool` con 300 casos aleatorios semillados**.
- `competition-state.ts`: transiciones válidas/inválidas, cierre exacto en `closes_at`.
- `rules.ts` + `responsible-play.ts`: menor de edad, sin saldo, cerrada, opción ajena, duplicada, cupo lleno, límite diario, autoexcluido, límites con periodo de reflexión.

## ⚠️ Limitaciones conocidas

- **SQLite efímero en Vercel sin Turso**: en cada cold start la DB se recrea con datos demo (así funciona el "Deploy y listo"). Para persistencia real usa Turso.
- **Rate limit en memoria**: por instancia de función; en producción usar un store compartido (Upstash, etc.).
- **Sin emails ni SMS**: las notificaciones son internas de la app.
- **Control de edad simulado**: se solicita fecha de nacimiento y se rechaza < 18, pero no hay verificación documental (así lo requiere un servicio real).
- **E2E Playwright**: la infraestructura está definida (`tests/e2e/`), los flujos E2E automatizados son opcionales según tiempo; los flujos críticos se verificaron manualmente + unit tests.

## 📚 Documentación

- [`docs/ESPECIFICACION.md`](docs/ESPECIFICACION.md) — requisitos funcionales (RF-xx) y no funcionales (RNF-xx).
- [`docs/MODELO_DATOS.md`](docs/MODELO_DATOS.md) — diagrama ER (Mermaid) y tablas.
- [`docs/DECISIONES.md`](docs/DECISIONES.md) — decisiones técnicas (ADR cortos).
- [`docs/GUIA_DEMO.md`](docs/GUIA_DEMO.md) — guion de presentación de 5–7 minutos.
- [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) — despliegue en Vercel y solución de problemas.

## 📄 Aviso legal / académico

Goopo es un **prototipo educativo**. No opera apuestas ni servicios de juego; no cumplimenta normativa de juegos de suerte y azar, no posee licencias, ni KYC, ni pasarela de pagos. Lo que hace falta para un servicio real se documenta en [`/acerca`](src/app/(public)/acerca/page.tsx) de la propia aplicación.
