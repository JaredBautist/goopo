# MODELO DE DATOS — Goopo

SQLite (libSQL) con Drizzle ORM. IDs texto (`nanoid`/UUID), fechas ISO-8601 UTC en texto, dinero entero (Goopos sin decimales), `PRAGMA foreign_keys = ON`.

## Diagrama ER (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ COMPETITIONS : "crea (admin)"
    USERS ||--o{ PREDICTIONS : "participa"
    USERS ||--o{ WALLET_TRANSACTIONS : "movimientos"
    USERS ||--o{ NOTIFICATIONS : "recibe"
    COMPETITIONS ||--|{ OPTIONS : "tiene 2-8"
    COMPETITIONS ||--o{ PREDICTIONS : "recibe"
    COMPETITIONS ||--o{ WALLET_TRANSACTIONS : "referencia"
    COMPETITIONS ||--o{ AUDIT_LOGS : "referencia"
    OPTIONS ||--o{ PREDICTIONS : "elegida"
    OPTIONS ||--o| COMPETITIONS : "ganadora (winning_option_id)"
    PREDICTIONS ||--o{ WALLET_TRANSACTIONS : "referencia"

    USERS {
        text id PK
        text email UK "lowercase, UNIQUE"
        text username UK "3-20 [a-z0-9_]"
        text display_name
        text password_hash "bcrypt"
        text role "participant|admin"
        text birth_date "YYYY-MM-DD"
        text age_confirmed_at
        text status "active|self_excluded|suspended"
        text self_excluded_until
        integer balance "CHECK >= 0"
        integer daily_limit "nullable"
        text daily_limit_changed_at
        text created_at
        text updated_at
        text last_login_at
    }
    COMPETITIONS {
        text id PK
        text slug UK
        text title
        text description
        text category "deportes|esports|academico|entretenimiento|clima|comunidad|otro"
        text cover_emoji
        text rules_text "Markdown simple, visible antes de participar"
        integer entry_cost "CHECK > 0"
        integer max_participants "nullable"
        text opens_at
        text closes_at "CHECK > opens_at"
        text expected_result_at
        text status "draft|open|closed|resolved|cancelled"
        text tie_rule "split_equal|earliest_wins|refund_all"
        text winning_option_id "FK options, nullable"
        text resolution_note
        text resolved_at
        text cancelled_reason
        text created_by FK
        text created_at
        text updated_at
    }
    OPTIONS {
        text id PK
        text competition_id FK
        text label
        text description
        integer position
    }
    PREDICTIONS {
        text id PK
        text competition_id FK
        text user_id FK "UNIQUE(comp,user)"
        text option_id FK
        integer stake "copia del entry_cost"
        text status "active|won|lost|refunded"
        integer payout "default 0"
        text created_at
    }
    WALLET_TRANSACTIONS {
        text id PK
        text user_id FK
        text type "signup_bonus|stake|payout|refund|daily_bonus|admin_adjust"
        integer amount "con signo"
        integer balance_after "CHECK >= 0"
        text competition_id
        text prediction_id
        text note
        text created_at
    }
    AUDIT_LOGS {
        text id PK
        text actor_id "nullable"
        text action "auth.login, competition.resolve..."
        text entity_type
        text entity_id
        text metadata "JSON texto"
        text ip "anonimizada (2 octetos)"
        text created_at
    }
    NOTIFICATIONS {
        text id PK
        text user_id FK
        text title
        text body
        text href
        text read_at
        text created_at
    }
```

## Invariantes clave

1. **UNIQUE(`competition_id`,`user_id`) en `predictions`** → una sola participación por usuario por competencia (a nivel de índice único, además del check de negocio).
2. **Ledger cuadrado**: para cada usuario, `users.balance == SUM(wallet_transactions.amount)`. Verificado al sembrar (`assertSeedConsistency`) y en los tests de dominio.
3. **Pozo exacto**: al resolver, `SUM(payout + pagos) == SUM(stake)`. Lo calcula siempre el motor puro `computePayouts` que lanza error si se rompe el invariante.
4. **Immutabilidad**: competencias `resolved`/`cancelled` (y predicciones no `active`) no admiten cambios a nivel de servicio.
5. **Índices**: `competitions(status,closes_at)`, `competitions(category)`, `predictions(user_id,created_at)`, `predictions(competition_id)`, `wallet_transactions(user_id,created_at)`, `audit_logs(created_at)`, `notifications(user_id,read_at)`.

## Migraciones

El SQL DDL versionado vive en `src/server/db/migrate.ts` (idempotente, `CREATE TABLE IF NOT EXISTS`), ejecutado en runtime por `ensureDb()` y por CLI en `npm run db:migrate`. De este modo Vercel puede arrancar sin preconfiguración.
