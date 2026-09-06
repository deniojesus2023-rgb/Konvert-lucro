CREATE TYPE "public"."diagnostic_status" AS ENUM('draft', 'completed');--> statement-breakpoint
CREATE TYPE "public"."estimate_origin" AS ENUM('typed', 'range');--> statement-breakpoint
CREATE TYPE "public"."profit_status" AS ENUM('available', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."response_kind" AS ENUM('informed', 'range', 'estimated', 'unknown', 'zero_confirmed', 'unanswered');--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"contact_consent_accepted_at" timestamp with time zone NOT NULL,
	"consent_text_version" text NOT NULL,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"marketing_opt_in_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnostic_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagnostic_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"response_kind" "response_kind" NOT NULL,
	"estimate_origin" "estimate_origin",
	"value_cents" bigint,
	"value_number" bigint,
	"range_min_cents" bigint,
	"range_max_cents" bigint,
	"value_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diagnostic_answers_field_unique" UNIQUE("diagnostic_id","field_key")
);
--> statement-breakpoint
CREATE TABLE "diagnostic_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagnostic_id" uuid NOT NULL,
	"formula_version" text NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"output_snapshot" jsonb NOT NULL,
	"profit_status" "profit_status" NOT NULL,
	"profit_cents" bigint,
	"margin_bps" integer,
	"profit_per_order_cents" bigint,
	"take_home_per_100_cents" integer,
	"break_even_revenue_cents" bigint,
	"break_even_orders" bigint,
	"gap_to_goal_cents" bigint,
	"has_estimated_inputs" boolean NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diagnostic_results_diagnostic_id_unique" UNIQUE("diagnostic_id")
);
--> statement-breakpoint
CREATE TABLE "diagnostics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_diagnostic_id" uuid,
	"draft_session_hash" text NOT NULL,
	"lead_id" uuid,
	"result_token" text,
	"result_token_expires_at" timestamp with time zone,
	"result_token_revoked_at" timestamp with time zone,
	"status" "diagnostic_status" DEFAULT 'draft' NOT NULL,
	"answers_version" integer DEFAULT 0 NOT NULL,
	"finalize_idempotency_key" text,
	"delivery_type" text,
	"main_channel" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "diagnostics_result_token_unique" UNIQUE("result_token"),
	CONSTRAINT "diagnostics_finalize_idempotency_key_unique" UNIQUE("finalize_idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "funnel_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"lead_id" uuid,
	"diagnostic_id" uuid,
	"event_name" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"whatsapp" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_answers" ADD CONSTRAINT "diagnostic_answers_diagnostic_id_diagnostics_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_results" ADD CONSTRAINT "diagnostic_results_diagnostic_id_diagnostics_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_diagnostic_id_diagnostics_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diagnostics_source_idx" ON "diagnostics" USING btree ("source_diagnostic_id");--> statement-breakpoint
CREATE INDEX "funnel_events_diagnostic_idx" ON "funnel_events" USING btree ("diagnostic_id");