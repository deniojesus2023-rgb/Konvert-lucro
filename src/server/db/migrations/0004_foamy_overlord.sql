CREATE TYPE "public"."cost_category_kind" AS ENUM('variable', 'recurring');--> statement-breakpoint
CREATE TABLE "cost_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid,
	"name" text NOT NULL,
	"kind" "cost_category_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"sales_channel_id" uuid,
	"gross_revenue_cents" bigint DEFAULT 0 NOT NULL,
	"orders_count" integer DEFAULT 0 NOT NULL,
	"discounts_cents" bigint DEFAULT 0 NOT NULL,
	"cancellations_cents" bigint DEFAULT 0 NOT NULL,
	"known_fees_cents" bigint DEFAULT 0 NOT NULL,
	"entries_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_entries_establishment_date_channel_unique" UNIQUE("establishment_id","entry_date","sales_channel_id")
);
--> statement-breakpoint
CREATE TABLE "sales_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_channels_establishment_name_unique" UNIQUE("establishment_id","name")
);
--> statement-breakpoint
CREATE TABLE "variable_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"cost_date" date NOT NULL,
	"category_id" uuid NOT NULL,
	"amount_cents" bigint NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cost_categories" ADD CONSTRAINT "cost_categories_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_sales_channel_id_sales_channels_id_fk" FOREIGN KEY ("sales_channel_id") REFERENCES "public"."sales_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variable_costs" ADD CONSTRAINT "variable_costs_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variable_costs" ADD CONSTRAINT "variable_costs_category_id_cost_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."cost_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_entries_establishment_date_idx" ON "daily_entries" USING btree ("establishment_id","entry_date");--> statement-breakpoint
CREATE INDEX "variable_costs_establishment_date_idx" ON "variable_costs" USING btree ("establishment_id","cost_date");