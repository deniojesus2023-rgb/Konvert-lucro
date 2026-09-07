import Stripe from "stripe";
import { getEnv } from "@/lib/env";

export interface StripeEnv {
  secretKey: string;
  webhookSecret: string;
  priceId: string;
}

/**
 * Fails loudly, and only when billing is actually used — `getEnv()` keeps
 * these three optional so every non-billing route and `next build` work
 * with no Stripe account configured at all.
 */
export function getStripeEnv(): StripeEnv {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_PRICE_ID) {
    throw new Error(
      "Stripe não está configurado — defina STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET e STRIPE_PRICE_ID",
    );
  }
  return { secretKey: env.STRIPE_SECRET_KEY, webhookSecret: env.STRIPE_WEBHOOK_SECRET, priceId: env.STRIPE_PRICE_ID };
}

let cachedClient: Stripe | null = null;

/** Lazy, cached client — same discipline as `getDb()`/`getEnv()`. */
export function getStripeClient(): Stripe {
  if (cachedClient) return cachedClient;
  cachedClient = new Stripe(getStripeEnv().secretKey);
  return cachedClient;
}
