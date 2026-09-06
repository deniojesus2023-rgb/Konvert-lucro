import {
  type AnyPgColumn,
  bigint,
  boolean,
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

export const diagnostics = pgTable(
  "diagnostics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
  (table) => [index("diagnostics_source_idx").on(table.sourceDiagnosticId)],
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
