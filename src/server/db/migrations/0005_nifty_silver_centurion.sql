CREATE TYPE "public"."goal_period_type" AS ENUM('month');--> statement-breakpoint
CREATE TYPE "public"."recurring_cost_frequency" AS ENUM('monthly', 'weekly');--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"period_type" "goal_period_type" DEFAULT 'month' NOT NULL,
	"period_start" date NOT NULL,
	"profit_goal_cents" bigint,
	"revenue_goal_cents" bigint,
	"margin_goal_bps" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goals_establishment_period_unique" UNIQUE("establishment_id","period_type","period_start")
);
--> statement-breakpoint
CREATE TABLE "recurring_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"amount_cents" bigint NOT NULL,
	"frequency" "recurring_cost_frequency" DEFAULT 'monthly' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_costs" ADD CONSTRAINT "recurring_costs_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_costs" ADD CONSTRAINT "recurring_costs_category_id_cost_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."cost_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_costs_establishment_idx" ON "recurring_costs" USING btree ("establishment_id");