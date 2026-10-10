# GUÍA DE DEMO — Goopo (5–7 minutos)

Guion paso a paso para presentar el proyecto en clase. Antes de empezar: `npm run dev` abierto en http://localhost:3000, pestañas listas. (Si la DB se quiere fresca: `npm run db:reset`.)

---

### 0. Introducción (30 s)

> "Goopo organiza competencias de pronósticos entre participantes con una moneda virtual, los Goopos. Es un prototipo académico **sin dinero real**. La idea central del concepto original está intacta: transparencia antes de participar y reglas iguales para todos."

**Mostrar:** landing. Señalar el banner "Prototipo académico" y el AgeGate (primera visita).

### 1. Transparencia (1 min)

**Mostrar:** sección "Cómo funciona" y "Transparencia ante todo" (evento, opciones, cierre, ganador, desempate, inmutabilidad).

> "Antes de participar, toda competencia define —y nunca cambia— qué se pronostica, cuándo cierra y cómo se reparte el pozo, incluida la regla de desempate."

### 2. Catálogo y reglas visibles (1 min)

**Mostrar:** `/competencias` → filtros, búsqueda, cuenta regresiva. Entrar a **"¿Quién ganará el clásico ficticio del domingo?"**.

**Señalar el orden de la página:** primero el panel de *Reglas y condiciones* completo (con ejemplo numérico del desempate) y solo después el selector de opciones.

> "Las reglas se ven antes de participar. Es un principio de producto, no un detalle."

### 3. Participar (1 min)

**Acción:** botón "Cuentas de prueba" en /ingresar → **ana@goopo.demo**. Volver a la competencia, elegir una opción, confirmar en el diálogo (*)"No podrás cambiarlo; pagarás 100 G"*).

**Mostrar:** saldo actualizado en la navbar, movimiento nuevo en `/billetera` (libro de movimientos), pronóstico en `/mis-pronosticos`.

**Demo de protección:** intentar entrar de nuevo → "Ya participaste" (bloqueado).

### 4. Cierre automático (45 s)

**Mostrar:** en `/competencias` hay abiertas con cuenta regresiva; varias cerradas. Como admin, cerrar una manualmente: **admin@goopo.demo → Admin → Competencias → Cerrar ahora**.

> "El cierre es perezoso y válido por hora del servidor: aunque no haya cron, es imposible participar después del cierre."

### 5. Resolución y reparto (1.5 min) — el plato fuerte

**Acción:** Admin → competencia cerrada → **Resolver…**. Elegir la opción ganadora.

**Mostrar la previsualización:** pozo, nº de ganadores, pago por cada uno, residuo al primero (reparto igual) o "el primer acertante se lleva todo". Confirmar escribiendo `RESOLVER`.

**Mostrar después:**
- Banner de resultado en la competencia pública.
- Notificación y saldo actualizado de ana (si ganó, +G; si no, 'no acertaste').
- **Invariante:** "la suma de premios y reembolsos es exactamente el pozo. No se crean ni destruyen Goopos. Está probado en la suite de tests."

### 6. Empate y caso sin ganadores (45 s)

**Mostrar:** en el seed ya resueltas: *"lorica-clasica-cafe"* (3 ganadores, reparto con residuo), *"quien-abre-el-concierto"* (earliest_wins), *"goles-capital-derby"* (empate anulado → todos reembolsados) y una donde **nadie acertó** (reembolso 100 %).

### 7. Ranking y juego responsable (45 s)

**Mostrar:** `/ranking` (neto, % de acierto, tu fila resaltada). Luego `/mi-cuenta`: límite diario (bajar es inmediato, subir espera 24 h), autoexclusión de 30 días (irreversible), descarga de datos y eliminar cuenta (anonimiza).

**Mostrar el banner permanente:** "Proyecto académico — sin dinero real."

### 8. Auditoría (30 s)

**Mostrar:** Admin → Auditoría: acciones de auth, participación, resolución, ajustes… con IP anonimizada.

> "Cada operación sensible deja rastro para que la plataforma sea demostrablemente justa."

### Cierre (30 s)

> "Goopo demuestra el concepto original de forma completa: simple, ordenado, transparente y responsable. Con stack moderno (Next.js + SQLite/libSQL), lógica de negocio pura y testeada, y despliegue un clic en Vercel."

---

**Tips durante la demo**
- Si algo tarda: la primera petición en Vercel hace cold start + seed automático (modo demo).
- El admin puede duplicar una competencia para crear datos al vuelo.
- `/api/health` en JSON muestra el modo de almacenamiento (local / tmp / turso).
