import type Stripe from "stripe";
import { getDb } from "@/server/db/client";
import { tryClaimWebhookEvent } from "@/server/repositories/billing-webhook-repository";
import { recordSubscriptionEvent } from "./record-subscription-event";

const SUBSCRIPTION_EVENT_TYPES = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

/**
 * Applies one verified Stripe webhook event exactly once. The idempotency
 * claim (`tryClaimWebhookEvent`) happens before any interpretation of the
 * payload — a redelivery of an event type we don't even handle still gets
 * claimed and short-circuited, so retries never do repeated work.
 */
export async function processBillingWebhook(event: Stripe.Event): Promise<void> {
  const db = getDb();
  const claimed = await tryClaimWebhookEvent(db, event.id);
  if (!claimed) return;

  if (!SUBSCRIPTION_EVENT_TYPES.has(event.type)) return;

  const subscription = event.data.object as Stripe.Subscription;
  await recordSubscriptionEvent(subscription, new Date(event.created * 1000));
}
