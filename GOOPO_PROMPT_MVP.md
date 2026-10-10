# PROMPT MAESTRO — GOOPO MVP (Plataforma académica de pronósticos entre participantes)

> **Cómo usar este documento:** pégalo completo como primer mensaje en tu agente de código (Claude Code, Cursor, Antigravity, Codex, Kiro, etc.) dentro de una carpeta vacía. Está escrito como una especificación (estilo Spec-Driven Development): contexto, requisitos, reglas de negocio, modelo de datos, pantallas, criterios de aceptación y plan por fases. El agente debe ejecutar todo de principio a fin sin pedir confirmaciones intermedias, salvo ante un bloqueo real.

---

## 0. ROL Y OBJETIVO

Actúa como un **Senior Full-Stack Engineer** con criterio de producto y diseño. Tu tarea es construir **de principio a fin** una aplicación web llamada **Goopo**, un **MVP completo, funcional, pulido y desplegable**, listo para:

1. Ejecutarse en local con `npm install && npm run dev` (sin configurar nada más).
2. Subirse a **Vercel** conectando el repositorio de GitHub (sin variables obligatorias).

No entregues esqueletos, TODOs ni pantallas vacías. Todo flujo descrito aquí debe funcionar de verdad con datos reales en la base de datos (sembrados con datos de demostración). Si algo es ambiguo, toma la decisión más sensata, documéntala en `docs/DECISIONES.md` y continúa.

---

## 1. CONTEXTO DEL PROYECTO (extraído del documento fuente)

**Goopo** es una página web propuesta para **organizar competencias entre participantes en las que se realizan pronósticos (apuestas) sobre un resultado previamente definido**. La idea central es un espacio digital **sencillo, ordenado y fácil de usar** donde los participantes puedan:

- Conocer las reglas de cada competencia.
- Elegir una opción.
- Observar el resultado final.

**Principios del concepto original:**

- Gana el participante cuyo pronóstico resulte acertado; la **suerte** tiene un papel importante (nadie controla el resultado; tener suerte no garantiza ganar siempre; las apuestas implican riesgo).
- **Transparencia:** antes de comenzar deben estar definidos el **evento**, las **opciones disponibles**, el **momento de cierre** de las participaciones y la **forma de determinar al ganador**.
- Todos participan bajo las **mismas reglas**.
- Si hay varias personas con la misma elección correcta, las reglas **previamente publicadas** deben indicar **cómo se resuelve el empate**.
- El sistema debe **validar los datos**, **impedir cambios después del cierre** de una actividad y **mostrar los resultados de forma clara**.
- Diseño **claro y responsable**: cada actividad muestra sus condiciones antes de participar; proteger la información de usuarios; contraseñas seguras; control de acceso; **registros (logs) de operaciones**.
- Una plataforma real requeriría reglas, límites, **controles de edad** y cumplimiento legal. Aquí se implementa como **prototipo educativo sin dinero real**.

**Flujo funcional del documento:**
1. Se publica una competencia con sus reglas.
2. Los participantes revisan opciones y eligen antes del tiempo límite.
3. Al llegar el cierre, el sistema deja de aceptar nuevas elecciones.
4. Cuando se conoce el resultado real, Goopo lo compara con las elecciones registradas y determina quién acertó.
5. Empates se resuelven según la regla publicada.

**Pantallas mencionadas en el documento:** pantalla de inicio (nombre Goopo, breve descripción, botón para entrar a la actividad) y sección de competencias disponibles (nombre del evento, opciones, reglas).

**Tecnologías mencionadas:** HTML/CSS/JS, base de datos para usuarios, elecciones y resultados, seguridad y validación. (Aquí las implementamos con un stack moderno equivalente, ver §4.)

---

## 2. ALCANCE

### 2.1 Dentro del alcance (OBLIGATORIO)

- **Dinero 100 % ficticio:** el sistema usa **"Goopos"**, una moneda virtual sin valor real. Nunca integrar pasarelas de pago, nunca pedir datos bancarios ni de tarjeta, nunca permitir convertir Goopos a dinero.
- Registro, inicio y cierre de sesión.
- Billetera virtual con saldo inicial y **libro de movimientos (ledger)**.
- Catálogo de competencias con estados, filtros y búsqueda.
- Detalle de competencia con reglas visibles **antes** de participar.
- Participar (hacer un pronóstico) con validaciones estrictas y **cierre automático**.
- Resolución de competencias por un organizador (admin) con reparto automático de premios y manejo de empates.
- Cancelación con reembolso.
- Historial personal, ranking (leaderboard), páginas informativas (reglas, juego responsable, acerca de).
- Panel de administración para crear/editar/cerrar/resolver/cancelar competencias y ver el registro de auditoría.
- Controles "de edad" **simulados** (confirmación de mayoría de edad con fecha de nacimiento) y herramientas de **juego responsable** (límites de participación, autoexclusión simulada).
- Datos de demostración (seed) ricos y realistas.
- Pruebas automatizadas de la lógica crítica.
- Documentación y despliegue.

### 2.2 Fuera del alcance (NO hacer)

- Dinero real, pagos, retiros, KYC real, verificación de identidad real.
- Notificaciones por email/SMS reales (puedes simular notificaciones dentro de la app).
- Aplicación móvil nativa.
- Microservicios, colas, Redis, Docker obligatorio.

---

## 3. PRINCIPIOS DE INGENIERÍA

- **TypeScript estricto** (`"strict": true`, sin `any` injustificados).
- **Separación de capas:** UI → acciones/handlers → servicios de dominio → repositorios/DB. La lógica de negocio (cierre, reparto, empates) vive en `src/server/domain/` y es **pura y testeable**.
- **Validación en servidor siempre** (Zod). Nunca confiar en el cliente.
- **Atomicidad:** toda operación que mueva saldo (participar, resolver, cancelar) se ejecuta en una **transacción**.
- **Idempotencia y consistencia:** no se puede participar dos veces en la misma competencia, no se puede resolver dos veces, no se puede participar tras el cierre.
- **Accesibilidad (WCAG AA)**, **responsive mobile-first**, **modo oscuro y claro**.
- Commits pequeños y con mensajes convencionales (`feat:`, `fix:`, `chore:`, `test:`, `docs:`) si hay repositorio git inicializado.

---

## 4. STACK TECNOLÓGICO (FIJO)

| Capa | Tecnología |
|---|---|
| Framework | **Next.js (App Router)** última versión estable, **TypeScript** |
| UI | **Tailwind CSS** + componentes propios (puedes usar **shadcn/ui** y **lucide-react**) |
| Formularios/validación | **Zod** (+ `react-hook-form` opcional) |
| Base de datos | **SQLite vía libSQL** (`@libsql/client`) + **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`) |
| Auth | Sesiones propias con **`jose`** (JWT firmado en cookie `httpOnly`, `sameSite=lax`, `secure` en producción) |
| Hash de contraseñas | **`bcryptjs`** (JS puro, compatible con serverless) |
| Gráficas (opcional) | `recharts` para estadísticas del admin y del perfil |
| Fechas | `date-fns` (locale `es`), zona horaria base `America/Bogota` para mostrar |
| Tests | **Vitest** (unitarios de dominio) + **Playwright** (1–3 flujos E2E críticos, opcional si el tiempo lo permite) |
| Calidad | ESLint, Prettier, `tsc --noEmit` en `npm run typecheck` |
| Despliegue | **Vercel** (sin configuración obligatoria) y **local** |

> Idioma de la interfaz: **español (Colombia)**. Código, nombres de variables y commits en inglés o español consistente (preferible: código en inglés, textos de UI en español).

---

## 5. ESTRATEGIA DE PERSISTENCIA (CRÍTICO PARA VERCEL)

Vercel usa funciones **serverless con sistema de archivos de solo lectura** (salvo `/tmp`, que es efímero). Por eso, implementa una **capa de base de datos con tres modos**, seleccionados automáticamente por variables de entorno, **sin que el usuario tenga que configurar nada** en el modo por defecto:

### Modo A — Local (por defecto en desarrollo)
- Archivo SQLite en `./data/goopo.db` (`file:./data/goopo.db`).
- Persistente entre reinicios.
- Se crea y se siembra automáticamente en el primer arranque si no existe.

### Modo B — Vercel sin configuración (demo efímera, por defecto en producción)
- Detectar entorno con `process.env.VERCEL`.
- Si **no** hay `TURSO_DATABASE_URL`, usar `file:/tmp/goopo.db`.
- En cada **cold start**, si el archivo no existe: crear esquema (migraciones) + **ejecutar seed automáticamente** (de forma idempotente y protegida contra concurrencia con una promesa singleton `ensureDb()`).
- Mostrar en el footer y en el panel admin un aviso discreto: **"Modo demo: los datos pueden reiniciarse periódicamente"**.
- Esto permite "subir a Vercel, conectar y listo".

### Modo C — Vercel con persistencia real (opcional)
- Si existen `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, usar **Turso (libSQL remoto, compatible con SQLite)**.
- Mismo esquema, mismas migraciones, mismo código.
- Documentar en el README cómo crear la base en Turso (3–4 comandos) y qué variables añadir en Vercel.

### Requisitos de implementación
- Archivo `src/server/db/client.ts` que exporta `getDb()` y `ensureDb()`; **ningún otro archivo** crea clientes de base de datos.
- Migraciones SQL versionadas en `drizzle/` y también una función `runMigrations()` ejecutable en runtime (para el modo B).
- Script `npm run db:seed` (reinicia y siembra), `npm run db:reset`, `npm run db:migrate`, `npm run db:studio`.
- Seed **idempotente**: si ya hay datos, no duplica.
- Todas las rutas/acciones que toquen DB deben llamar internamente a `ensureDb()`.
- Forzar `export const runtime = "nodejs"` en rutas que usen la DB.
- Si el binario nativo de libSQL diera problemas en el build de Vercel, documenta la solución en `docs/DECISIONES.md` y aplica `serverExternalPackages` en `next.config` si corresponde.

---

## 6. ARQUITECTURA Y ESTRUCTURA DE CARPETAS

```
goopo/
├─ README.md
├─ .env.example
├─ package.json
├─ next.config.ts
├─ drizzle.config.ts
├─ vitest.config.ts
├─ docs/
│  ├─ DECISIONES.md
│  ├─ ESPECIFICACION.md        # resumen de este prompt convertido en spec
│  ├─ MODELO_DATOS.md          # diagrama ER en Mermaid
│  ├─ GUIA_DEMO.md             # guion para presentar el proyecto (5–7 min)
│  └─ DESPLIEGUE.md
├─ data/                        # .gitignore → goopo.db
├─ drizzle/                     # migraciones SQL
├─ public/
│  └─ (logo svg, og-image, favicon)
├─ src/
│  ├─ app/
│  │  ├─ (public)/
│  │  │  ├─ page.tsx                       # Inicio / landing
│  │  │  ├─ competencias/page.tsx          # Catálogo
│  │  │  ├─ competencias/[slug]/page.tsx   # Detalle + participar
│  │  │  ├─ ranking/page.tsx
│  │  │  ├─ reglas/page.tsx
│  │  │  ├─ juego-responsable/page.tsx
│  │  │  └─ acerca/page.tsx
│  │  ├─ (auth)/
│  │  │  ├─ ingresar/page.tsx
│  │  │  └─ registro/page.tsx
│  │  ├─ (app)/                            # requiere sesión
│  │  │  ├─ mi-cuenta/page.tsx             # resumen, saldo, límites
│  │  │  ├─ mis-pronosticos/page.tsx
│  │  │  ├─ billetera/page.tsx             # ledger
│  │  │  └─ notificaciones/page.tsx
│  │  ├─ admin/                            # requiere rol admin
│  │  │  ├─ page.tsx                       # dashboard
│  │  │  ├─ competencias/page.tsx
│  │  │  ├─ competencias/nueva/page.tsx
│  │  │  ├─ competencias/[id]/page.tsx     # editar, cerrar, resolver, cancelar
│  │  │  ├─ usuarios/page.tsx
│  │  │  └─ auditoria/page.tsx
│  │  ├─ api/
│  │  │  ├─ health/route.ts
│  │  │  └─ competencias/route.ts          # GET JSON público (solo lectura)
│  │  ├─ layout.tsx
│  │  ├─ not-found.tsx
│  │  ├─ error.tsx
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ ui/            # Button, Card, Badge, Input, Dialog, Tabs, Toast, Skeleton...
│  │  ├─ layout/        # Navbar, Footer, ThemeToggle, AgeGate, DemoBanner
│  │  ├─ competitions/  # CompetitionCard, OptionPicker, Countdown, RulesPanel, ResultBanner
│  │  └─ admin/         # CompetitionForm, ResolveDialog, StatsCards, AuditTable
│  ├─ server/
│  │  ├─ db/
│  │  │  ├─ client.ts
│  │  │  ├─ schema.ts
│  │  │  ├─ migrate.ts
│  │  │  └─ seed.ts
│  │  ├─ domain/
│  │  │  ├─ competition-state.ts   # transiciones y cierre perezoso
│  │  │  ├─ payouts.ts             # cálculo de premios y empates (PURO)
│  │  │  ├─ rules.ts               # validaciones de negocio
│  │  │  └─ responsible-play.ts    # límites y autoexclusión
│  │  ├─ services/
│  │  │  ├─ auth.service.ts
│  │  │  ├─ competitions.service.ts
│  │  │  ├─ predictions.service.ts
│  │  │  ├─ wallet.service.ts
│  │  │  ├─ audit.service.ts
│  │  │  └─ notifications.service.ts
│  │  ├─ session.ts                # crear/leer/borrar sesión
│  │  └─ rate-limit.ts             # limitador en memoria
│  ├─ actions/                     # Server Actions (usan services + Zod)
│  ├─ lib/                         # utils, formato de Goopos, fechas, slugify, constantes
│  └─ types/
├─ tests/
│  ├─ unit/ (payouts, state, rules, wallet)
│  └─ e2e/ (opcional)
└─ middleware.ts                   # protección de rutas /mi-cuenta, /admin, etc.
```

---

## 7. MODELO DE DATOS (SQLite)

Implementa con Drizzle. Usa **IDs de texto** (`nanoid` o `crypto.randomUUID()`), fechas en **texto ISO-8601 UTC**, valores monetarios en **enteros** (Goopos, sin decimales). Activa `PRAGMA foreign_keys = ON`.

### 7.1 Tablas

**`users`**
- `id` (PK), `email` (UNIQUE, lowercase), `username` (UNIQUE, 3–20 chars `[a-z0-9_]`), `display_name`, `password_hash`, `role` (`'participant' | 'admin'`), `birth_date` (YYYY-MM-DD), `age_confirmed_at`, `status` (`'active' | 'self_excluded' | 'suspended'`), `self_excluded_until` (nullable), `balance` (INTEGER ≥ 0, saldo en caché), `daily_limit` (INTEGER, nullable — máximo de Goopos a apostar por día), `created_at`, `updated_at`, `last_login_at`.

**`competitions`**
- `id` (PK), `slug` (UNIQUE), `title`, `description`, `category` (`'deportes' | 'esports' | 'academico' | 'entretenimiento' | 'clima' | 'comunidad' | 'otro'`), `cover_emoji` o `cover_color`, `rules_text` (texto largo en Markdown simple), `entry_cost` (INTEGER > 0), `max_participants` (INTEGER nullable), `opens_at`, `closes_at`, `expected_result_at` (nullable), `status` (`'draft' | 'open' | 'closed' | 'resolved' | 'cancelled'`), `tie_rule` (`'split_equal' | 'earliest_wins' | 'refund_all'`), `winning_option_id` (nullable FK), `resolution_note` (nullable), `resolved_at`, `cancelled_reason`, `created_by` (FK users), `created_at`, `updated_at`.

**`options`**
- `id` (PK), `competition_id` (FK, ON DELETE CASCADE), `label`, `description` (nullable), `position` (INTEGER). Mínimo 2 opciones por competencia, máximo 8.

**`predictions`**
- `id` (PK), `competition_id` (FK), `user_id` (FK), `option_id` (FK), `stake` (INTEGER, copia del `entry_cost` al momento de participar), `status` (`'active' | 'won' | 'lost' | 'refunded'`), `payout` (INTEGER default 0), `created_at`.
- **UNIQUE(`competition_id`, `user_id`)** → una sola participación por persona por competencia.

**`wallet_transactions`** (ledger inmutable, solo inserciones)
- `id` (PK), `user_id` (FK), `type` (`'signup_bonus' | 'stake' | 'payout' | 'refund' | 'daily_bonus' | 'admin_adjust'`), `amount` (INTEGER con signo: negativo al apostar, positivo al cobrar), `balance_after` (INTEGER), `competition_id` (nullable), `prediction_id` (nullable), `note`, `created_at`.

**`audit_logs`**
- `id` (PK), `actor_id` (nullable FK), `action` (ej. `auth.login`, `auth.register`, `competition.create`, `competition.close`, `competition.resolve`, `competition.cancel`, `prediction.create`, `wallet.adjust`, `user.self_exclude`), `entity_type`, `entity_id`, `metadata` (JSON texto), `ip` (nullable, truncada/anonimizada), `created_at`.

**`notifications`**
- `id` (PK), `user_id` (FK), `title`, `body`, `href` (nullable), `read_at` (nullable), `created_at`. (Simuladas: "Tu competencia X se cerró", "Ganaste N Goopos", etc.)

### 7.2 Índices
- `competitions(status, closes_at)`, `competitions(category)`, `predictions(user_id, created_at)`, `predictions(competition_id)`, `wallet_transactions(user_id, created_at)`, `audit_logs(created_at)`, `notifications(user_id, read_at)`.

### 7.3 Restricciones (CHECK)
- `balance >= 0`, `entry_cost > 0`, `closes_at > opens_at`, `stake > 0`.

Genera además `docs/MODELO_DATOS.md` con un diagrama **Mermaid `erDiagram`**.

---

## 8. REGLAS DE NEGOCIO (ESPECIFICACIÓN FORMAL)

### 8.1 Moneda
- Se llama **Goopos** (símbolo `G`). Formato: `1.250 G`. Sin decimales.
- Saldo inicial al registrarse: **1.000 G** (`signup_bonus`).
- "Recarga diaria demo": botón en `/mi-cuenta` que otorga **+200 G** una vez cada 24 h **solo si el saldo es < 200 G** (para que nunca se quede sin poder probar). Registra `daily_bonus`.

### 8.2 Estados de una competencia y transiciones

```
draft ──publicar──▶ open ──(closes_at alcanzado o cierre manual)──▶ closed ──resolver──▶ resolved
  │                   │                                              │
  └───────────────────┴──────────────cancelar────────────────────────┴──▶ cancelled
```

- **`draft`:** solo visible para admins. Se puede editar todo.
- **`open`:** visible para todos. Solo se pueden editar `description` y `rules_text` aclaratorios **si aún no hay participaciones**; con participaciones, **las opciones, costo, cierre y regla de empate quedan bloqueados** (principio de transparencia).
- **`closed`:** no admite participaciones. Esperando resultado.
- **`resolved`:** tiene opción ganadora y pagos ejecutados. **Inmutable.**
- **`cancelled`:** reembolsa a todos. **Inmutable.**

### 8.3 Cierre automático ("lazy closing")
En serverless no hay cron fiable. Implementa **cierre perezoso**: una función `syncCompetitionStates(now)` que pasa a `closed` toda competencia `open` con `closes_at <= now`. Debe invocarse:
- Al listar competencias, al abrir un detalle y **antes de validar cualquier participación**.
- En el dashboard admin.
- Opcionalmente un endpoint `GET /api/cron/close` protegido con `CRON_SECRET` (opcional) y configurado en `vercel.json` como cron diario (no es obligatorio para que todo funcione).

**La validación de participación SIEMPRE compara con la hora del servidor**, nunca con la del cliente.

### 8.4 Participar (hacer un pronóstico)
Una participación es válida solo si **todas** se cumplen (dentro de **una transacción**):
1. Usuario autenticado, `status = 'active'` y no autoexcluido.
2. Mayoría de edad confirmada (≥ 18 años según `birth_date`).
3. Competencia en estado `open`, con `opens_at <= ahora < closes_at`.
4. La opción pertenece a esa competencia.
5. El usuario **no** tiene ya una participación en esa competencia.
6. Si hay `max_participants`, no se ha alcanzado el cupo.
7. `balance >= entry_cost`.
8. No se supera el `daily_limit` del usuario (suma de `stake` de hoy + `entry_cost` ≤ límite).
9. Rate limit: máx. 10 participaciones por minuto por usuario.

Efectos: descuenta `entry_cost`, inserta `predictions` (`active`), inserta `wallet_transactions` (`stake`, monto negativo), actualiza `users.balance`, registra `audit_logs` y crea una notificación de confirmación.

**Las participaciones NO se pueden editar ni retirar** una vez creadas (regla pública, mostrada antes de confirmar). Muestra un diálogo de confirmación: *"Una vez confirmado no podrás cambiarlo. Pagarás X G."*

### 8.5 Resolver una competencia (solo admin)
Condiciones: estado `closed` (o `open` pasado `closes_at`, sincronizado primero). El admin elige la **opción ganadora** y puede añadir una nota. Dentro de **una transacción**:

1. Calcula `pool = suma(stake de todas las predictions activas)`.
2. Determina `winners` = predictions con `option_id = winning_option_id`.
3. **Si no hay ganadores** → se **reembolsa a todos** (`refund`, estado `refunded`). Notifica "Nadie acertó; se devolvió tu participación".
4. **Si hay ganadores**, aplica `tie_rule`:
   - **`split_equal`** (por defecto): `payout = floor(pool / nWinners)` para cada ganador. El **residuo** (`pool - payout*nWinners`) se asigna al ganador **que participó primero**.
   - **`earliest_wins`**: el **primer ganador** (por `created_at`, desempate por `id`) se lleva **todo el pool**.
   - **`refund_all`**: si hay más de un ganador, **se reembolsa a todos** (empate anulado); si hay un solo ganador, se lleva el pool.
5. Marca predictions como `won`/`lost`/`refunded`, registra `payout` y asienta `wallet_transactions` (`payout` o `refund`) con `balance_after` correcto.
6. Pasa la competencia a `resolved`, guarda `winning_option_id`, `resolved_at`, `resolution_note`.
7. Genera notificaciones a todos los participantes y entrada en `audit_logs`.

**Invariante verificable (test):** la suma de los pagos + reembolsos **es exactamente igual** al pool. No se crean ni destruyen Goopos.

### 8.6 Cancelar
- Solo admin, estados `draft/open/closed`. Requiere motivo (`cancelled_reason`).
- Reembolsa el 100 % a cada participante (`refund`), notifica y audita.

### 8.7 Ranking
- **Ranking global** por: Goopos ganados netos (payouts − stakes) en competencias resueltas, con desempate por aciertos y luego por menor número de participaciones. Filtros: *Todo el tiempo / Últimos 30 días*.
- Mostrar: posición, usuario, aciertos, participaciones, **% de acierto**, neto.
- Resaltar al usuario actual.

### 8.8 Juego responsable (simulado pero funcional)
- **Límite diario** configurable en `/mi-cuenta` (mínimo 50 G; vacío = sin límite). Bajar el límite aplica de inmediato; **subirlo** aplica tras 24 h (guardar `pending_daily_limit` y `pending_limit_effective_at`, o documentar una versión simplificada).
- **Autoexclusión:** 24 horas, 7 días o 30 días. Durante ese tiempo no puede participar (sí puede ver y consultar). No se puede revertir antes de tiempo.
- Banner permanente y visible: **"Prototipo académico. Los Goopos no tienen valor real. Participa con responsabilidad."**
- Página `/juego-responsable` con consejos, señales de alerta y recursos (texto informativo genérico, sin inventar números de teléfono; indicar que en un servicio real se enlazaría a entidades de ayuda locales).

### 8.9 Control de edad (simulado)
- En el registro se pide **fecha de nacimiento**; si < 18 años, **se rechaza el registro** con un mensaje claro.
- Un **AgeGate** modal en la primera visita ("Confirmo que soy mayor de 18 años y entiendo que Goopo es un prototipo educativo sin dinero real"), guardado en `localStorage`/cookie.
- Nota visible: en un servicio real se exigiría verificación documental y cumplimiento de la normativa de juegos de suerte y azar aplicable.

---

## 9. AUTENTICACIÓN Y AUTORIZACIÓN

- Registro: `email`, `username`, `display_name`, `password`, `birth_date`, aceptación de términos (checkbox obligatorio).
- **Política de contraseñas:** mínimo 8 caracteres, al menos 1 letra y 1 número. Medidor de fortaleza en UI.
- Hash con `bcryptjs` (cost 10–12).
- Sesión: JWT firmado con `AUTH_SECRET` (HS256), cookie `goopo_session` `httpOnly`, `sameSite=lax`, `secure` en producción, duración 7 días, renovación deslizante.
- **Si `AUTH_SECRET` no existe** (caso "subir a Vercel y listo"): usar un secreto de demostración embebido y mostrar un `console.warn` y una nota en `/api/health`. Documentar en el README que para algo serio debe definirse `AUTH_SECRET`.
- `middleware.ts` protege `/mi-cuenta`, `/mis-pronosticos`, `/billetera`, `/notificaciones` (sesión) y `/admin` (rol `admin`). Además **cada Server Action y servicio vuelve a verificar permisos** (defensa en profundidad).
- Mensajes de error de login **genéricos** ("Credenciales inválidas") para no filtrar si el usuario existe.
- Rate limit en login/registro: 5 intentos/minuto por IP+identificador (en memoria, documentando la limitación en serverless).
- Protección **CSRF**: usar Server Actions (que incluyen verificación de origen) y comprobar cabecera `Origin` en endpoints mutadores.

**Cuentas de demostración (seed):**
- Admin: `admin@goopo.demo` / `Admin1234`
- Participante: `ana@goopo.demo` / `Goopo1234`
- Participante: `carlos@goopo.demo` / `Goopo1234`
- (+ 10 usuarios más con contraseña `Goopo1234`)
Muestra estas credenciales en la pantalla de ingreso como **"Cuentas de prueba"** con botón "Rellenar" (solo si `NEXT_PUBLIC_DEMO_MODE !== "false"`, por defecto activo).

---

## 10. PANTALLAS Y COMPORTAMIENTO DETALLADO

### 10.1 Inicio `/` (landing)
- Hero con nombre **Goopo**, tagline (ej. *"Pronostica, compite y descubre si la suerte está de tu lado."*), breve descripción y botón primario **"Entrar a las competencias"** (→ `/competencias`) y secundario **"Cómo funciona"** (scroll).
- Sección **"Cómo funciona"** en 4 pasos con iconos: 1) Elige una competencia, 2) Revisa las reglas, 3) Haz tu pronóstico antes del cierre, 4) Conoce el resultado.
- Sección **"Competencias destacadas"** (3–6 tarjetas abiertas, ordenadas por cierre próximo).
- Sección **principios de transparencia** (evento, opciones, cierre, forma de determinar ganador, regla de empate) y **aviso de juego responsable**.
- Contadores animados: competencias activas, participantes, Goopos repartidos (calculados desde la DB).
- Footer con enlaces a reglas, juego responsable, acerca, y aviso "Proyecto académico — sin dinero real".

### 10.2 Catálogo `/competencias`
- Búsqueda por texto, filtros por **estado** (Abiertas / Cerradas / Resueltas), **categoría**, y orden (*Cierran pronto*, *Más participantes*, *Mayor pozo*, *Recientes*).
- Tarjeta: emoji/portada, título, categoría, badge de estado, **cuenta regresiva** al cierre, costo de entrada, nº de participantes, pozo acumulado.
- Paginación o "cargar más". Estado vacío amigable. Skeletons de carga.

### 10.3 Detalle `/competencias/[slug]`
Estructura en este orden (principio: **las reglas se ven antes de participar**):
1. Encabezado: título, categoría, estado, cuenta regresiva en vivo (cliente) basada en `closes_at`.
2. **Panel "Reglas y condiciones"** siempre visible: evento, opciones, costo de entrada, apertura y cierre (con zona horaria), fecha estimada del resultado, **cómo se determina el ganador**, **regla de empate** (explicada en lenguaje simple con un ejemplo numérico), cupo máximo, reglas completas en Markdown.
3. **Selector de opciones** (tarjetas radio accesibles, con teclado). Botón **"Confirmar pronóstico"** → diálogo de confirmación → acción.
4. Estados de la UI según el caso:
   - Sin sesión → CTA "Ingresa para participar".
   - Ya participó → muestra su elección (bloqueada) y el candado "Pronóstico registrado".
   - Cerrada → "Participaciones cerradas", mostrar distribución de elecciones (% por opción) **solo después del cierre** para evitar sesgo.
   - Resuelta → **banner de resultado**: opción ganadora, nº de ganadores, pago por ganador, nota; si el usuario participó, "¡Acertaste! +X G" o "No acertaste esta vez".
   - Cancelada → motivo y reembolso.
   - Saldo insuficiente / límite diario / autoexcluido → mensaje claro y deshabilitar botón.
5. **Participantes** (solo nombres visibles, sin mostrar su elección mientras esté abierta) y **línea de tiempo** de la competencia (creada → abierta → cerrada → resuelta).
6. Compartir enlace (copiar al portapapeles).

### 10.4 `/mis-pronosticos`
Tabs: **Activos / Resueltos / Todos**. Tabla/tarjetas con competencia, elección, costo, resultado, premio, fecha. Resumen: total participaciones, aciertos, % acierto, neto en Goopos. Gráfica simple de evolución del saldo (opcional).

### 10.5 `/billetera`
Saldo actual, **libro de movimientos** paginado con tipo, monto con color, saldo posterior, referencia a competencia, fecha. Exportar CSV de movimientos propios. Botón de recarga diaria demo.

### 10.6 `/mi-cuenta`
Datos del perfil (editar nombre visible), **cambio de contraseña**, **límite diario**, **autoexclusión**, preferencia de tema, botón de cerrar sesión, **descargar mis datos (JSON)** y **eliminar cuenta** (con confirmación; anonimiza participaciones).

### 10.7 `/notificaciones`
Lista con marcar como leída / marcar todas; contador en la campana del navbar.

### 10.8 `/ranking`, `/reglas`, `/juego-responsable`, `/acerca`
- **Reglas:** reglas generales de la plataforma en lenguaje claro (cómo se cierra, cómo se resuelve, empates, moneda virtual, cancelaciones, conducta).
- **Acerca:** explica el proyecto académico, el stack, y qué haría falta para convertirlo en un servicio real (licencias, verificación de edad real, KYC, cumplimiento normativo, pasarela de pagos, auditoría independiente, juego responsable avanzado) **sin implementarlo**.

### 10.9 Panel Admin `/admin`
- **Dashboard:** tarjetas con competencias por estado, usuarios, Goopos en circulación, participaciones hoy; gráfica de participaciones por día (7/30 días); lista de "Competencias por resolver" (cerradas sin resultado) destacada.
- **Competencias:** tabla con filtros, acciones rápidas (publicar, cerrar ahora, resolver, cancelar, duplicar).
- **Formulario crear/editar:** título (slug autogenerado y editable), categoría, descripción, reglas (textarea con vista previa Markdown), costo de entrada, cupo, apertura, cierre, fecha estimada de resultado, regla de empate, **opciones dinámicas (2–8, reordenables)**. Validación Zod con errores por campo. Guardar como borrador o publicar.
- **Resolver:** diálogo que muestra **previsualización del reparto** (pozo, nº ganadores, pago por ganador, residuo) *antes* de confirmar; requiere escribir `RESOLVER` para confirmar.
- **Usuarios:** lista, buscar, ver saldo/estado, suspender/reactivar, ajuste manual de saldo con motivo (queda en ledger y auditoría).
- **Auditoría:** tabla filtrable (acción, actor, fecha) con paginación.

### 10.10 Páginas de sistema
- `not-found` y `error` con diseño de marca. `/api/health` devuelve `{status, db, mode: "local|tmp|turso", version, time}`.

---

## 11. DISEÑO UI/UX

- **Identidad:** marca "Goopo" con logotipo SVG propio simple (p. ej. un dado/moneda estilizada con la "G"). Paleta moderna y alegre pero sobria: color primario vibrante (violeta/índigo o esmeralda), acento cálido (ámbar) para premios, grises neutros, rojo/verde semánticos para estados. Define tokens en CSS variables (modo claro/oscuro).
- Tipografía: `Inter` (cuerpo) + una display para títulos (ej. `Sora` o `Plus Jakarta Sans`) vía `next/font`.
- Componentes con bordes redondeados, sombras suaves, microinteracciones (hover, focus ring visible), animaciones sutiles (`framer-motion` opcional) y respeto de `prefers-reduced-motion`.
- **Mobile-first**: navbar colapsable, tarjetas apiladas, botones táctiles ≥ 44 px.
- **Accesibilidad:** contraste AA, `aria-*` correctos en diálogos/tabs/radios, navegación por teclado completa, textos alternativos, `lang="es"`, mensajes de error asociados a campos, anuncios `aria-live` para toasts.
- Estados de carga (skeletons), vacíos (ilustración + CTA) y errores (mensaje + reintentar) en **todas** las vistas con datos.
- Toasts para confirmaciones.
- SEO básico: `metadata`, Open Graph, `robots.txt`, `sitemap.ts`, favicon.

---

## 12. SEGURIDAD (CHECKLIST OBLIGATORIO)

- [ ] Validación Zod de **toda** entrada (formularios, query params, JSON).
- [ ] Consultas parametrizadas (Drizzle) — cero SQL concatenado.
- [ ] Hash `bcryptjs`; nunca registrar contraseñas ni tokens en logs.
- [ ] Cookies `httpOnly`, `sameSite`, `secure` en producción.
- [ ] Autorización en servidor por rol en cada acción sensible.
- [ ] Transacciones en todo movimiento de saldo; `CHECK balance >= 0`.
- [ ] Rate limiting en login, registro y participar.
- [ ] Sanitización de Markdown (`rehype-sanitize` o renderizador seguro) en reglas/descripciones.
- [ ] Cabeceras de seguridad en `next.config` (`X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, CSP razonable).
- [ ] IP almacenada solo truncada/anonimizada en auditoría.
- [ ] Sin secretos en el repo; `.env.example` documentado.
- [ ] Errores al cliente sin stack traces.

---

## 13. DATOS DE DEMOSTRACIÓN (SEED)

Crea un seed **determinista y realista** (puedes usar una semilla fija y fechas relativas a "ahora" para que siempre haya contenido vigente):

- **12 usuarios** (1 admin + 11 participantes con nombres colombianos plausibles), saldos variados, algunos con historial.
- **16–20 competencias** repartidas así:
  - **6 abiertas** con cierres entre 30 minutos y 10 días (para ver cuentas regresivas distintas), diferentes categorías.
  - **3 cerradas** esperando resultado (para que el admin las resuelva en la demo).
  - **6 resueltas** que cubran **todos los casos de reparto**: un solo ganador, varios ganadores con `split_equal` (con residuo), `earliest_wins`, `refund_all` con empate, y **una sin ganadores** (reembolso).
  - **1 cancelada** con motivo.
  - **1–2 borradores** (solo admin).
- Ejemplos de títulos (adáptalos y amplíalos, con contenido inocuo y apto para todo público): "¿Qué equipo ganará el clásico del domingo?", "¿Lloverá en Cúcuta el sábado?", "¿Cuántos goles se marcarán en la final universitaria?", "¿Quién ganará el torneo de FIFA de la facultad?", "¿Qué película liderará la taquilla este fin de semana?", "¿Qué proyecto ganará la feria de innovación?".
  - **Evita** eventos que involucren personas reales de forma sensible, tragedias, política electoral o contenido inapropiado. Todo debe ser ficticio o neutral.
- Participaciones coherentes con los estados (ledger consistente: cada saldo = saldo inicial + suma del ledger).
- Notificaciones y registros de auditoría de muestra.
- **Test de consistencia del seed:** para cada usuario, `balance == suma(wallet_transactions.amount)`.

---

## 14. PRUEBAS AUTOMATIZADAS

### 14.1 Unitarias (Vitest) — **obligatorias**
`payouts.ts` (puro):
- 1 ganador → se lleva el pool.
- N ganadores `split_equal` con y sin residuo (residuo al primero).
- `earliest_wins` con timestamps iguales (desempate por id).
- `refund_all` con 1 y con varios ganadores.
- 0 ganadores → reembolso total.
- **Invariante:** `sum(payouts) === pool` en todos los casos (usa property-based simple con datos aleatorios con semilla).

`competition-state.ts`:
- Transiciones válidas e inválidas; cierre perezoso exacto en `closes_at`.

`rules.ts` / servicios (con DB SQLite en memoria o archivo temporal):
- Rechaza: usuario menor, sin saldo, competencia cerrada, opción de otra competencia, participación duplicada, cupo lleno, límite diario superado, usuario autoexcluido.
- Dos participaciones **concurrentes** del mismo usuario → solo una se inserta.
- Resolver dos veces → la segunda falla.
- Cancelar reembolsa exactamente.
- Ledger y `balance` siempre coinciden.

### 14.2 E2E (Playwright) — recomendado
1. Registro → participar → ver en "mis pronósticos".
2. Admin crea competencia → participante participa → admin cierra y resuelve → participante ve resultado y saldo.
3. Intento de participar tras el cierre → bloqueado.

### 14.3 Scripts
`npm test`, `npm run test:watch`, `npm run test:e2e`, `npm run typecheck`, `npm run lint`, y `npm run verify` que ejecuta lint + typecheck + test + build.

---

## 15. DESPLIEGUE

### 15.1 Local
```bash
npm install
npm run dev        # crea y siembra data/goopo.db automáticamente
# http://localhost:3000
```
Opcional: `cp .env.example .env.local`.

### 15.2 Vercel (cero configuración)
1. Subir el repo a GitHub.
2. En Vercel: **Add New → Project → Import** del repositorio.
3. Framework detectado: Next.js. **Deploy.** (Funciona sin variables de entorno en modo demo con SQLite en `/tmp`.)
4. Recomendado (1 minuto): añadir `AUTH_SECRET` (valor aleatorio largo).

### 15.3 Vercel con persistencia (opcional, Turso)
Documentar paso a paso: crear base en Turso, obtener URL y token, añadir `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` y `AUTH_SECRET` en Vercel, redeploy, ejecutar migración y seed una vez (`npm run db:migrate && npm run db:seed` apuntando a Turso).

### 15.4 `.env.example`
```
# Opcionales — el proyecto funciona sin ninguna
AUTH_SECRET=cambia-esto-por-un-valor-aleatorio-largo
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
NEXT_PUBLIC_DEMO_MODE=true
CRON_SECRET=
```

### 15.5 Requisitos del build
- `npm run build` debe pasar **sin errores ni warnings críticos** de tipos/lint.
- Nada en build-time debe requerir la base de datos (usar rutas dinámicas donde corresponda, `export const dynamic = "force-dynamic"` en páginas con datos vivos).
- Incluir `vercel.json` mínimo (con cron opcional comentado en README, no obligatorio).

---

## 16. DOCUMENTACIÓN A ENTREGAR

- **README.md** completo y atractivo: descripción, capturas (placeholders), características, stack, arquitectura, cómo correr en local, cómo desplegar en Vercel (3 modos de persistencia), cuentas demo, scripts, estructura de carpetas, limitaciones conocidas (SQLite efímero en Vercel sin Turso, rate limit en memoria), aviso legal/académico.
- **docs/ESPECIFICACION.md:** requisitos funcionales (RF-xx) y no funcionales (RNF-xx) con su estado.
- **docs/MODELO_DATOS.md:** ER en Mermaid y descripción de tablas.
- **docs/DECISIONES.md:** registro de decisiones (ADR corto): por qué libSQL, por qué lazy closing, por qué ledger inmutable, por qué bcryptjs.
- **docs/GUIA_DEMO.md:** guion de presentación de 5–7 minutos paso a paso con las cuentas demo (qué mostrar, en qué orden, qué decir) incluyendo: landing → catálogo → reglas visibles → participar → cierre → resolución como admin con previsualización de reparto → empate → ranking → juego responsable → auditoría.
- **docs/DESPLIEGUE.md:** guía detallada con solución de problemas (binarios nativos, `/tmp`, variables).

---

## 17. PLAN DE EJECUCIÓN POR FASES (SIGUE ESTE ORDEN)

Después de **cada fase**, ejecuta `npm run typecheck` y `npm test` (cuando aplique) y corrige antes de avanzar.

**Fase 0 — Andamiaje:** crear proyecto Next.js + TS + Tailwind + ESLint/Prettier, instalar dependencias, estructura de carpetas, configuración de alias, `.gitignore`, `.env.example`.
*Criterio:* `npm run dev` levanta una página base.

**Fase 1 — Base de datos:** `schema.ts`, migraciones, `client.ts` con los 3 modos, `ensureDb()`, `seed.ts` idempotente, scripts `db:*`, `/api/health`.
*Criterio:* arranque en frío crea y siembra la DB sola; `/api/health` responde OK.

**Fase 2 — Dominio puro + tests:** `payouts.ts`, `competition-state.ts`, `rules.ts`, `responsible-play.ts` con pruebas unitarias completas.
*Criterio:* tests de dominio en verde, invariante del pool verificado.

**Fase 3 — Servicios y auth:** servicios, sesiones JWT, registro/login/logout, middleware, rate limit, auditoría, ledger transaccional.
*Criterio:* registro con control de edad, login, rutas protegidas funcionando.

**Fase 4 — UI base y diseño:** tokens, componentes `ui/`, layout, navbar, footer, tema claro/oscuro, AgeGate, DemoBanner, landing.
*Criterio:* landing completa y responsive.

**Fase 5 — Competencias (público):** catálogo con filtros, detalle con reglas, cuenta regresiva, participar con confirmación, estados de UI.
*Criterio:* un usuario puede participar y ver su saldo y ledger actualizados; tras el cierre no puede.

**Fase 6 — Área del usuario:** mis pronósticos, billetera (+CSV), mi cuenta (límites, autoexclusión, contraseña, exportar/eliminar), notificaciones, ranking.
*Criterio:* todos los flujos del usuario funcionan con datos reales.

**Fase 7 — Admin:** dashboard, CRUD de competencias con opciones dinámicas, cerrar/resolver (con previsualización)/cancelar, usuarios, auditoría.
*Criterio:* ciclo completo crear → participar → cerrar → resolver con pagos correctos.

**Fase 8 — Calidad:** pruebas de servicios y E2E, revisión de accesibilidad, cabeceras de seguridad, SEO, estados vacíos/errores, rendimiento (imágenes, fuentes, `Suspense`).
*Criterio:* `npm run verify` pasa completo.

**Fase 9 — Documentación y despliegue:** README, docs, `vercel.json`, validar build de producción local (`npm run build && npm start`) simulando `VERCEL=1` para el modo `/tmp`.
*Criterio:* el proyecto se despliega en Vercel sin configurar nada más y es totalmente usable.

---

## 18. CRITERIOS DE ACEPTACIÓN GLOBALES (DEFINITION OF DONE)

- [ ] `npm install && npm run dev` funciona de inmediato con datos de demostración.
- [ ] `npm run build` pasa; despliegue en Vercel funciona sin variables de entorno.
- [ ] Todas las pantallas de §10 existen, son responsive y accesibles.
- [ ] Se muestran **evento, opciones, cierre, forma de determinar ganador y regla de empate** **antes** de participar.
- [ ] Es imposible participar tras el cierre, participar dos veces o con saldo insuficiente (validado en servidor y cubierto por tests).
- [ ] La resolución reparte **exactamente** el pozo (invariante probado) para los tres tipos de empate y para el caso sin ganadores.
- [ ] Cancelación reembolsa correctamente.
- [ ] El ledger siempre cuadra con los saldos.
- [ ] Control de edad, límites y autoexclusión funcionan.
- [ ] Panel admin completo y protegido por rol.
- [ ] Auditoría registra las acciones sensibles.
- [ ] Avisos claros en toda la app: **prototipo académico, sin dinero real**.
- [ ] Documentación completa, incluida la guía de demostración.
- [ ] `npm run verify` en verde.

---

## 19. REGLAS DE COMPORTAMIENTO PARA TI (EL AGENTE)

1. **No pidas confirmación** para decisiones menores; decide, documenta y avanza.
2. **No dejes TODOs, mocks rotos ni código muerto.** Si algo queda fuera, regístralo en el README como limitación conocida.
3. **No inventes dependencias que no existan.** Verifica versiones compatibles con la versión de Next.js instalada y adapta la sintaxis a la versión real (por ejemplo, `params` asíncronos en rutas dinámicas si aplica, `cookies()`/`headers()` asíncronos).
4. **Ejecuta y verifica** (typecheck, tests, build) tú mismo; corrige errores hasta que todo pase.
5. **Mantén el alcance:** nada de dinero real ni pasarelas de pago, bajo ninguna circunstancia.
6. **Contenido de la demo apto para todo público**; ningún evento ofensivo, sensible ni con personas reales identificables.
7. Al terminar, entrega un **resumen final**: qué se construyó, cómo ejecutarlo, cuentas demo, decisiones tomadas, limitaciones conocidas y los pasos exactos para desplegar en Vercel.

---

## 20. MENSAJE FINAL AL AGENTE

Construye **Goopo** ahora, siguiendo este documento fase por fase, hasta cumplir **todos** los criterios de aceptación de la sección 18. El resultado debe sentirse como un producto terminado y cuidado: sencillo, ordenado, transparente y responsable, tal como plantea la idea original, listo para mostrarse en una presentación académica.

**Comienza por la Fase 0.**
