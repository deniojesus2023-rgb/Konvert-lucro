import type Stripe from "stripe";
import { getDb } from "@/server/db/client";
import {
  findLatestSubscription,
  insertSubscriptionEvent,
  type SubscriptionStatus,
} from "@/server/repositories/subscription-repository";

function toDate(unixSeconds: number | null | undefined): Date | null {
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}

/**
 * Maps a Stripe subscription status to our own enum. Stripe has a couple
 * of extra transient statuses (`incomplete_expired`, `unpaid`) that don't
 * warrant their own row type here — they fold into the closest status we
 * do track rather than crashing on an unrecognized value.
 */
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "canceled";
    case "unpaid":
    case "paused":
      return "past_due";
    default:
      return "incomplete";
  }
}

/**
 * Applies one Stripe subscription webhook event, guarded against
 * out-of-order delivery: if a newer event for this establishment is
 * already recorded, this one is silently dropped instead of regressing
 * the status. `providerEventAt` is the event's own timestamp from
 * Stripe — never "now" — so the comparison reflects when Stripe says the
 * change happened, not when we happened to receive it.
 */
export async function recordSubscriptionEvent(
  subscription: Stripe.Subscription,
  eventCreatedAt: Date,
): Promise<void> {
  const establishmentId = subscription.metadata?.establishmentId;
  if (!establishmentId) {
    // Not one of ours (or checkout metadata was lost) — nothing to record.
    return;
  }

  const db = getDb();
  const latest = await findLatestSubscription(db, establishmentId);
  if (latest && latest.providerEventAt >= eventCreatedAt) {
    return;
  }

  const item = subscription.items.data[0];
  await insertSubscriptionEvent(db, {
    establishmentId,
    providerSubscriptionId: subscription.id,
    providerCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    plan: item?.price.id ?? "unknown",
    status: mapStatus(subscription.status),
    currentPeriodStart: toDate(item?.current_period_start),
    currentPeriodEnd: toDate(item?.current_period_end),
    providerEventAt: eventCreatedAt,
  });
}
