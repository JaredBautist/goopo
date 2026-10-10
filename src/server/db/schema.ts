import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["participant", "admin"] })
      .notNull()
      .default("participant"),
    birthDate: text("birth_date").notNull(),
    ageConfirmedAt: text("age_confirmed_at"),
    status: text("status", {
      enum: ["active", "self_excluded", "suspended"],
    })
      .notNull()
      .default("active"),
    selfExcludedUntil: text("self_excluded_until"),
    balance: integer("balance").notNull().default(0),
    dailyLimit: integer("daily_limit"),
    dailyLimitChangedAt: text("daily_limit_changed_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
    lastLoginAt: text("last_login_at"),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(t.email),
    uniqueIndex("users_username_uq").on(t.username),
    check("users_balance_nonneg", sql`${t.balance} >= 0`),
  ],
);

export const competitions = sqliteTable(
  "competitions",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category", {
      enum: [
        "deportes",
        "esports",
        "academico",
        "entretenimiento",
        "clima",
        "comunidad",
        "otro",
      ],
    })
      .notNull()
      .default("otro"),
    coverEmoji: text("cover_emoji").notNull().default("🎲"),
    rulesText: text("rules_text").notNull(),
    entryCost: integer("entry_cost").notNull(),
    maxParticipants: integer("max_participants"),
    opensAt: text("opens_at").notNull(),
    closesAt: text("closes_at").notNull(),
    expectedResultAt: text("expected_result_at"),
    status: text("status", {
      enum: ["draft", "open", "closed", "resolved", "cancelled"],
    })
      .notNull()
      .default("draft"),
    tieRule: text("tie_rule", {
      enum: ["split_equal", "earliest_wins", "refund_all"],
    })
      .notNull()
      .default("split_equal"),
    winningOptionId: text("winning_option_id"),
    resolutionNote: text("resolution_note"),
    resolvedAt: text("resolved_at"),
    cancelledReason: text("cancelled_reason"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (t) => [
    uniqueIndex("competitions_slug_uq").on(t.slug),
    index("competitions_status_closes_idx").on(t.status, t.closesAt),
    index("competitions_category_idx").on(t.category),
    check("competitions_entry_cost_pos", sql`${t.entryCost} > 0`),
    check(
      "competitions_dates_order",
      sql`${t.closesAt} > ${t.opensAt}`,
    ),
  ],
);

export const options = sqliteTable(
  "options",
  {
    id: text("id").primaryKey(),
    competitionId: text("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    description: text("description"),
    position: integer("position").notNull(),
  },
  (t) => [index("options_competition_idx").on(t.competitionId, t.position)],
);

export const predictions = sqliteTable(
  "predictions",
  {
    id: text("id").primaryKey(),
    competitionId: text("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    optionId: text("option_id")
      .notNull()
      .references(() => options.id),
    stake: integer("stake").notNull(),
    status: text("status", {
      enum: ["active", "won", "lost", "refunded"],
    })
      .notNull()
      .default("active"),
    payout: integer("payout").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (t) => [
    uniqueIndex("predictions_comp_user_uq").on(t.competitionId, t.userId),
    index("predictions_user_created_idx").on(t.userId, t.createdAt),
    index("predictions_competition_idx").on(t.competitionId),
    check("predictions_stake_pos", sql`${t.stake} > 0`),
  ],
);

export const walletTransactions = sqliteTable(
  "wallet_transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type", {
      enum: [
        "signup_bonus",
        "stake",
        "payout",
        "refund",
        "daily_bonus",
        "admin_adjust",
      ],
    }).notNull(),
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    competitionId: text("competition_id"),
    predictionId: text("prediction_id"),
    note: text("note"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (t) => [
    index("wallet_user_created_idx").on(t.userId, t.createdAt),
    check("wallet_balance_nonneg", sql`${t.balanceAfter} >= 0`),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: text("metadata"),
    ip: text("ip"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (t) => [index("audit_created_idx").on(t.createdAt), index("audit_action_idx").on(t.action)],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    readAt: text("read_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (t) => [index("notifications_user_read_idx").on(t.userId, t.readAt)],
);

export type User = typeof users.$inferSelect;
export type Competition = typeof competitions.$inferSelect;
export type Option = typeof options.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
