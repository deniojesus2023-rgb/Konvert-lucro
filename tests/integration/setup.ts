import { existsSync } from "node:fs";
import { beforeEach, afterAll } from "vitest";
import { closeDb, setDbForTesting } from "@/server/db/client";
import { resetEnvCache } from "@/lib/env";
import { resetRateLimit } from "@/server/security/rate-limit";
import { sql } from "drizzle-orm";

for (const file of [".env.test.local", ".env.local", ".env"]) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
    break;
  }
}

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error("TEST_DATABASE_URL ausente — veja tests/integration/global-setup.ts");
}

// The route handlers read DATABASE_URL through getEnv(); point it at the
// test database and give the client module the same connection.
process.env.DATABASE_URL = url;
process.env.APP_ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:3000";
process.env.CONSENT_TEXT_VERSION = process.env.CONSENT_TEXT_VERSION ?? "test.v1";
// Dummy but well-formed Stripe config: enough to exercise the webhook's
// local signature verification and every guard that runs before a real
// network call to Stripe would happen. No test in this suite triggers an
// actual Stripe API call (checkout/portal creation) — this sandbox has no
// network access to Stripe and no real account, so those two remain
// verified only up to their pre-Stripe authorization guards.
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_test_dummy_secret";
process.env.STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "price_test_dummy";
resetEnvCache();

const db = setDbForTesting(url);

beforeEach(async () => {
  // A single statement so the truncation is atomic and FK-order-proof.
  await db.execute(
    sql`TRUNCATE TABLE funnel_events, diagnostic_results, diagnostic_answers, diagnostics, consents, leads, billing_webhook_events, subscriptions, goals, recurring_costs, variable_costs, daily_entries, cost_categories, sales_channels, establishment_members, login_tokens, establishments, users RESTART IDENTITY CASCADE`,
  );
  resetRateLimit();
});

afterAll(async () => {
  await closeDb();
});

export { db };
