import {
  type AnyPgColumn,
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Money is stored as `bigint` (cents). Reads go through
 * `./money-codec.ts`, which refuses values outside the JS safe-integer
 * range instead of truncating them.
 *
 * The enums below mirror the domain vocabulary in
 * `src/domain/diagnostic/`. They're spelled out here (rather than imported)
 * because drizzle-kit reads this file statically to generate SQL; the unit
 * test `schema.test.ts` asserts they stay in sync with the domain.
 */

export const diagnosticStatusEnum = pgEnum("diagnostic_status", ["draft", "completed"]);

export const establishmentMemberRoleEnum = pgEnum("establishment_member_role", ["owner", "member"]);

export const responseKindEnum = pgEnum("response_kind", [
  "informed",
  "range",
  "estimated",
  "unknown",
  "zero_confirmed",
  "unanswered",
]);

export const estimateOriginEnum = pgEnum("estimate_origin", ["typed", "range"]);

export const profitStatusEnum = pgEnum("profit_status", ["available", "unavailable"]);

export const costCategoryKindEnum = pgEnum("cost_category_kind", ["variable", "recurring"]);

export const recurringCostFrequencyEnum = pgEnum("recurring_cost_frequency", ["monthly", "weekly"]);

export const goalPeriodTypeEnum = pgEnum("goal_period_type", ["month"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
]);

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  whatsapp: text("whatsapp").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  contactConsentAcceptedAt: timestamp("contact_consent_accepted_at", {
    withTimezone: true,
  }).notNull(),
  consentTextVersion: text("consent_text_version").notNull(),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
  marketingOptInAt: timestamp("marketing_opt_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Phase 2 (paid product) foundation — additive only, nothing above this
 * point changes shape or behavior. A user is a durable identity that can
 * exist without any establishment yet; an establishment is the business
 * the paid product tracks and owns the subscription; membership is a
 * separate join table so a second member can be invited later without a
 * schema change.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  /** Null while login is magic-link only; reserved for a future password option. */
  passwordHash: text("password_hash"),
  /** Optional bridge back to the diagnostic lead this account grew out of. */
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  /**
   * SHA-256 of the current app-session secret, mirroring
   * `diagnostics.draft_session_hash` — the secret itself only ever lives in
   * the `konvert_app_session` cookie. A new login overwrites this (single
   * active session per user for now; revisit if multi-device sessions are
   * needed later).
   */
  sessionHash: text("session_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One-time magic-link login tokens. Same shape as the diagnostic's
 * session-secret pattern: only the hash is stored, the raw token exists
 * solely in the emailed link, and it's single-use (`consumedAt`) and
 * short-lived (`expiresAt`).
 */
export const loginTokens = pgTable("login_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const establishments = pgTable("establishments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  deliveryType: text("delivery_type"),
  mainChannel: text("main_channel"),
  /** IANA name. Every "day" boundary in the tracking engine depends on this. */
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const establishmentMembers = pgTable(
  "establishment_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    establishmentId: uuid("establishment_id")
      .notNull()
      .references(() => establishments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: establishmentMemberRoleEnum("role").notNull().default("owner"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("establishment_members_unique").on(table.establishmentId, table.userId)],
);

export const diagnostics = pgTable(
  "diagnostics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /**
     * Set once a subscriber account is created from this diagnostic (or a
     * revision of it). Nullable and additive — the free diagnostic funnel
     * never sets this and behaves exactly as before.
     */
    establishmentId: uuid("establishment_id").references(() => establishments.id, {
      onDelete: "set null",
    }),
    /**
     * Points at the completed diagnostic this one is a revision of.
     * `onDelete: "restrict"` is deliberate: a diagnostic with a revision
     * must never be deletable out from under it — the lineage between a
     * result and the revision that superseded it is permanent history,
     * not a link to clean up.
     */
    sourceDiagnosticId: uuid("source_diagnostic_id").references(
      (): AnyPgColumn => diagnostics.id,
      { onDelete: "restrict" },
    ),
    /** SHA-256 of the edit secret. The secret itself only ever lives in the cookie. */
    draftSessionHash: text("draft_session_hash").notNull(),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    /** High-entropy public token; only set once the diagnostic is completed. */
    resultToken: text("result_token").unique(),
    resultTokenExpiresAt: timestamp("result_token_expires_at", { withTimezone: true }),
    resultTokenRevokedAt: timestamp("result_token_revoked_at", { withTimezone: true }),
    status: diagnosticStatusEnum("status").notNull().default("draft"),
    /** Optimistic-locking counter for the answers of THIS draft. */
    answersVersion: integer("answers_version").notNull().default(0),
    finalizeIdempotencyKey: text("finalize_idempotency_key").unique(),
    deliveryType: text("delivery_type"),
    mainChannel: text("main_channel"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("diagnostics_source_idx").on(table.sourceDiagnosticId),
    index("diagnostics_establishment_idx").on(table.establishmentId),
  ],
);

export const diagnosticAnswers = pgTable(
  "diagnostic_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diagnosticId: uuid("diagnostic_id")
      .notNull()
      .references(() => diagnostics.id, { onDelete: "cascade" }),
    fieldKey: text("field_key").notNull(),
    responseKind: responseKindEnum("response_kind").notNull(),
    /** Only set when responseKind is "estimated": how the value was produced. */
    estimateOrigin: estimateOriginEnum("estimate_origin"),
    valueCents: bigint("value_cents", { mode: "bigint" }),
    valueNumber: bigint("value_number", { mode: "bigint" }),
    rangeMinCents: bigint("range_min_cents", { mode: "bigint" }),
    /** Null with responseKind "range" means an OPEN range — no midpoint exists. */
    rangeMaxCents: bigint("range_max_cents", { mode: "bigint" }),
    valueText: text("value_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("diagnostic_answers_field_unique").on(table.diagnosticId, table.fieldKey)],
);

/**
 * One row per completed diagnostic, written once inside the finalize
 * transaction and never updated afterwards — a revision produces a new
 * diagnostic with its own result and its own token, leaving this one intact.
 */
export const diagnosticResults = pgTable("diagnostic_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  diagnosticId: uuid("diagnostic_id")
    .notNull()
    .unique()
    .references(() => diagnostics.id, { onDelete: "cascade" }),
  formulaVersion: text("formula_version").notNull(),
  /** Exactly the normalized DiagnosticInput handed to calculateProfit. */
  inputSnapshot: jsonb("input_snapshot").notNull(),
  /** The complete ProfitResult: statuses, reasons, blind spots, disclaimer. */
  outputSnapshot: jsonb("output_snapshot").notNull(),
  profitStatus: profitStatusEnum("profit_status").notNull(),
  profitCents: bigint("profit_cents", { mode: "bigint" }),
  marginBps: integer("margin_bps"),
  profitPerOrderCents: bigint("profit_per_order_cents", { mode: "bigint" }),
  takeHomePer100Cents: integer("take_home_per_100_cents"),
  breakEvenRevenueCents: bigint("break_even_revenue_cents", { mode: "bigint" }),
  breakEvenOrders: bigint("break_even_orders", { mode: "bigint" }),
  gapToGoalCents: bigint("gap_to_goal_cents", { mode: "bigint" }),
  hasEstimatedInputs: boolean("has_estimated_inputs").notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Phase 3 (daily tracking) — additive only. A sales channel is scoped to
 * one establishment (find-or-create by name, no management screen yet).
 * Cost categories with a null `establishmentId` are system defaults shared
 * by every establishment.
 */
export const salesChannels = pgTable(
  "sales_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    establishmentId: uuid("establishment_id")
      .notNull()
      .references(() => establishments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("sales_channels_establishment_name_unique").on(table.establishmentId, table.name)],
);

export const costCategories = pgTable(
  "cost_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null means a system default category, visible to every establishment. */
    establishmentId: uuid("establishment_id").references(() => establishments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: costCategoryKindEnum("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Only meaningful (and enforced) for establishment-owned categories —
    // Postgres treats NULL establishment_id as distinct per row, so system
    // defaults (seeded once, never user-created) aren't deduplicated by this.
    unique("cost_categories_establishment_name_kind_unique").on(table.establishmentId, table.name, table.kind),
  ],
);

/**
 * One row per (establishment, date, channel) — the single source of sales
 * for the MVP tracking loop. `entriesVersion` is the same optimistic-lock
 * pattern as `diagnostics.answersVersion`.
 */
export const dailyEntries = pgTable(
  "daily_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    establishmentId: uuid("establishment_id")
      .notNull()
      .references(() => establishments.id, { onDelete: "cascade" }),
    /** Calendar day in `establishments.timezone`, not UTC. */
    entryDate: date("entry_date").notNull(),
    salesChannelId: uuid("sales_channel_id").references(() => salesChannels.id, { onDelete: "set null" }),
    grossRevenueCents: bigint("gross_revenue_cents", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    ordersCount: integer("orders_count").notNull().default(0),
    discountsCents: bigint("discounts_cents", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    cancellationsCents: bigint("cancellations_cents", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    knownFeesCents: bigint("known_fees_cents", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    entriesVersion: integer("entries_version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("daily_entries_establishment_date_channel_unique").on(
      table.establishmentId,
      table.entryDate,
      table.salesChannelId,
    ),
    index("daily_entries_establishment_date_idx").on(table.establishmentId, table.entryDate),
  ],
);

export const variableCosts = pgTable(
  "variable_costs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    establishmentId: uuid("establishment_id")
      .notNull()
      .references(() => establishments.id, { onDelete: "cascade" }),
    costDate: date("cost_date").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => costCategories.id, { onDelete: "restrict" }),
    amountCents: bigint("amount_cents", { mode: "bigint" }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("variable_costs_establishment_date_idx").on(table.establishmentId, table.costDate)],
);

/**
 * Phase 4 (recurring costs, goals) — additive only. A recurring cost is
 * prorated on demand by the tracking engine (see
 * `domain/tracking/formulas/recurring-cost-proration.ts`); nothing here
 * stores a precomputed per-day or per-period share.
 */
export const recurringCosts = pgTable(
  "recurring_costs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    establishmentId: uuid("establishment_id")
      .notNull()
      .references(() => establishments.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => costCategories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    amountCents: bigint("amount_cents", { mode: "bigint" }).notNull(),
    frequency: recurringCostFrequencyEnum("frequency").notNull().default("monthly"),
    startDate: date("start_date").notNull(),
    /** Null means still active with no known end. */
    endDate: date("end_date"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("recurring_costs_establishment_idx").on(table.establishmentId)],
);

/** Only `updated_at` guards concurrent edits — a monthly goal is a single
 * owner's own target, not a shared resource worth full optimistic locking. */
export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    establishmentId: uuid("establishment_id")
      .notNull()
      .references(() => establishments.id, { onDelete: "cascade" }),
    periodType: goalPeriodTypeEnum("period_type").notNull().default("month"),
    /** First day of the target month. */
    periodStart: date("period_start").notNull(),
    profitGoalCents: bigint("profit_goal_cents", { mode: "bigint" }),
    revenueGoalCents: bigint("revenue_goal_cents", { mode: "bigint" }),
    marginGoalBps: integer("margin_goal_bps"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("goals_establishment_period_unique").on(table.establishmentId, table.periodType, table.periodStart)],
);

/**
 * Phase 5 (billing) — additive only. Append-only, same as
 * `diagnostic_results`: a status transition never `UPDATE`s an existing
 * row, it inserts a new one. `providerEventAt` (the event's own timestamp
 * from Stripe, not when we received it) is the monotonicity guard — a
 * webhook delivered out of order must never let an older event's status
 * look newer than one already recorded.
 */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    establishmentId: uuid("establishment_id")
      .notNull()
      .references(() => establishments.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("stripe"),
    providerSubscriptionId: text("provider_subscription_id"),
    providerCustomerId: text("provider_customer_id"),
    plan: text("plan").notNull(),
    status: subscriptionStatusEnum("status").notNull(),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    /** The Stripe event's own timestamp — see the guard in `record-subscription-event.ts`. */
    providerEventAt: timestamp("provider_event_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("subscriptions_establishment_idx").on(table.establishmentId, table.createdAt)],
);

/**
 * Stripe delivers webhooks at-least-once and out of order. This is the
 * same idempotency shape as `diagnostics.finalize_idempotency_key`: a
 * unique constraint the database enforces, so a redelivered event can
 * never be applied twice even under concurrent handlers.
 */
export const billingWebhookEvents = pgTable("billing_webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull().default("stripe"),
  providerEventId: text("provider_event_id").notNull().unique(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Funnel analytics. `metadata` must never carry a session secret, a full
 * result token, a name or a WhatsApp number — enforced by
 * `assertSafeFunnelMetadata` in the repository layer.
 */
export const funnelEvents = pgTable(
  "funnel_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    diagnosticId: uuid("diagnostic_id").references(() => diagnostics.id, {
      onDelete: "set null",
    }),
    eventName: text("event_name").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("funnel_events_diagnostic_idx").on(table.diagnosticId)],
);
