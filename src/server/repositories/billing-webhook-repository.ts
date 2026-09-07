import { billingWebhookEvents } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

/**
 * Claims a webhook event id for processing. Returns `true` the first time
 * (this call did the insert — go ahead and apply the event) and `false`
 * on any redelivery (the row already exists — treat as a no-op). The
 * unique constraint on `provider_event_id` is what actually makes this
 * safe under concurrent deliveries, not the order of operations here.
 */
export async function tryClaimWebhookEvent(db: Executor, providerEventId: string): Promise<boolean> {
  const [row] = await db
    .insert(billingWebhookEvents)
    .values({ provider: "stripe", providerEventId })
    .onConflictDoNothing({ target: billingWebhookEvents.providerEventId })
    .returning({ id: billingWebhookEvents.id });
  return row !== undefined;
}
