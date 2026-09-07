import { z } from "zod";
import { CONSENT_TEXT_VERSION } from "@/lib/config/consent";

/**
 * Environment is validated lazily, on first use at request time — never at
 * module import. `next build` must keep working on a machine with no
 * database and no `.env`, so nothing here may throw while the bundler is
 * merely importing a route module.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  APP_ORIGIN: z.string().url().optional(),
  // Defaults to the same constant the wizard's capture step sends, so an
  // unconfigured environment still can't drift between client and server.
  CONSENT_TEXT_VERSION: z.string().min(1).default(CONSENT_TEXT_VERSION),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Billing (Phase 5) — optional here so `next build` and every non-billing
  // route keep working with no Stripe account configured at all. Routes
  // that actually need Stripe call `getStripeEnv()` (in
  // `server/services/billing/stripe-client.ts`), which fails loudly and
  // only at the moment billing is actually used.
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_ID: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    APP_ORIGIN: process.env.APP_ORIGIN,
    CONSENT_TEXT_VERSION: process.env.CONSENT_TEXT_VERSION,
    NODE_ENV: process.env.NODE_ENV,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
  });

  if (!parsed.success) {
    // Only the field names are surfaced — never the values, which may carry
    // credentials.
    const fields = Object.keys(parsed.error.flatten().fieldErrors).join(", ");
    throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${fields}`);
  }

  cached = parsed.data;
  return cached;
}

/** Test helper: forces the next `getEnv()` to re-read `process.env`. */
export function resetEnvCache(): void {
  cached = null;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}
