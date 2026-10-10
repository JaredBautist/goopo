# ESPECIFICACIÓN — Goopo MVP

Resumen de requisitos derivados del documento original. Estado: ✅ implementado · 🔶 parcial (documentado)

## Requisitos funcionales

| ID | Requisito | Estado |
|---|---|---|
| RF-01 | Registro con email, usuario, nombre visible, contraseña con política, fecha de nacimiento y aceptación de términos | ✅ |
| RF-02 | Rechazo de registro a menores de 18 años al momento del registro | ✅ |
| RF-03 | Login con genéricos errores + rate limit 5/min por IP+identificador | ✅ |
| RF-04 | Sesión JWT en cookie httpOnly (7 días), cierre de sesión | ✅ |
| RF-05 | Billetera con saldo inicial 1.000 G y ledger de movimientos | ✅ |
| RF-06 | Recarga diaria demo +200 G (24 h de espera, solo si saldo < 200 G) | ✅ |
| RF-07 | Catálogo de competencias con búsqueda, filtros (estado, categoría) y 4 órdenes | ✅ |
| RF-08 | Detalle con reglas visibles ANTES de participar: evento, opciones, costo, apertura/cierre (zona Bogotá), resultado estimado, cómo se determina el ganador, regla de empate con ejemplo numérico, cupo, reglas completas | ✅ |
| RF-09 | Participar con 9 validaciones en servidor dentro de una transacción | ✅ |
| RF-10 | Cuenta regresiva en vivo basada en `closes_at` | ✅ |
| RF-11 | Cierre automático (lazy closing) al listar, al abrir detalle y antes de participar; comparación SIEMPRE con hora del servidor | ✅ |
| RF-12 | Bloqueo de edición tras participar; opciones/costo/cierre/regla de empate bloqueados si hay participaciones | ✅ |
| RF-13 | Distribución de elecciones (% por opción) visible SOLO tras el cierre | ✅ |
| RF-14 | Resolución solo por admin con previsualización del reparto y confirmación `RESOLVER` | ✅ |
| RF-15 | Empates: `split_equal` (residuo al primero), `earliest_wins`, `refund_all`; nadie acertó → reembolso total | ✅ |
| RF-16 | Invariante: pagos + reembolsos = pozo exacto (probado, incl. property-based) | ✅ |
| RF-17 | Cancelación admin con motivo + reembolso 100 % + notificación | ✅ |
| RF-18 | Mis pronósticos con tabs (activos/resueltos/todos) y resumen de aciertos/neto | ✅ |
| RF-19 | Billetera con ledger paginado, referencias y export CSV | ✅ |
| RF-20 | Mi cuenta: editar nombre, cambiar contraseña, límite diario, autoexclusión, descargar datos, eliminar cuenta (anonimiza) | ✅ |
| RF-21 | Ranking global/30 d por neto con desempates (aciertos, luego menos participaciones), % de acierto, fila propia resaltada | ✅ |
| RF-22 | Notificaciones internas con no-leídas en navbar y marcar leídas | ✅ |
| RF-23 | Admin: dashboard con métricas + gráfica de participaciones/día & "por resolver" | ✅ |
| RF-24 | Admin: CRUD competencias con opciones dinámicas 2–8 reordenables, slugs únicos, borrador/publicar | ✅ |
| RF-25 | Admin: cerrar manualmente, duplicar competencia | ✅ |
| RF-26 | Admin: usuarios con búsqueda, suspender/reactivar, ajuste de saldo con motivo (ledger + auditoría) | ✅ |
| RF-27 | Admin: auditoría filtrable por acción con IP anonimizada | ✅ |
| RF-28 | Límite diario: bajar aplica ya, subir espera 24 h | ✅ |
| RF-29 | Autoexclusión 24 h / 7 días / 30 días irreversible | ✅ |
| RF-30 | AgeGate modal inicial con persistencia local | ✅ |
| RF-31 | Páginas: reglas, juego responsable, acerca, ranking, 404/error con marca | ✅ |
| RF-32 | API `/api/health` (estado, modo de DB, versión) y `/api/competencias` JSON pública de lectura | ✅ |
| RF-33 | Notificaciones de eventos: participación registrada, cierre, premio, reembolso, cancelación | ✅ |

## Requisitos no funcionales

| ID | Requisito | Estado |
|---|---|---|
| RNF-01 | TypeScript estricto (`strict`, `noUncheckedIndexedAccess`) | ✅ |
| RNF-02 | Validación Zod de toda entrada en servidor; defensa en profundidad (Server Actions revalidan permisos) | ✅ |
| RNF-03 | Consultas parametrizadas (cero SQL concatenado) | ✅ |
| RNF-04 | Transacciones/batch en todo movimiento de saldo; `CHECK balance >= 0` | ✅ |
| RNF-05 | Cookies httpOnly + sameSite=lax + secure en producción; CSRF vía Server Actions + comprobación de Origin | ✅ |
| RNF-06 | Rate limiting en login/registro y participar (memoria, limitación documentada) | ✅ |
| RNF-07 | Headers de seguridad (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, nosniff) | ✅ |
| RNF-08 | IP solo anonimizada en auditoría; sin secretos en repo | ✅ |
| RNF-09 | Accessibilidad WCAG AA (aria-* en diálogos/radios, live region en toasts, foco visible, teclado completo) | ✅ |
| RNF-10 | Responsive mobile-first, navbar colapsable, tartget ≥ 44 px | ✅ |
| RNF-11 | Modo claro/oscuro con tokens CSS y `prefers-color-scheme` | ✅ |
| RNF-12 | Estados de carga/vacío/errores en vistas con datos; skeletons | ✅ |
| RNF-13 | SEO: metadata + OG, favicon, sitemap/robots básicos | 🔶 (metadata y OG listos; sitemap.ts pendiente) |
| RNF-14 | `npm run verify` (lint + typecheck + test + build) en verde | ✅ |
| RNF-15 | Deploy Vercel sin variables (modo demo `/tmp`) | ✅ |
| RNF-16 | Tests unitarios de la lógica crítica, invariante del pozo verificable | ✅ |
| RNF-17 | Logs de operaciones (auditoría) para acciones sensibles | ✅ |
| RNF-18 | Sin nada de dinero real: sin pasarelas, sin KYC, sin conversión a dinero | ✅ |
