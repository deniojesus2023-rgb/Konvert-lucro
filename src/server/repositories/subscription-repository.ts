import { desc, eq } from "drizzle-orm";
import { subscriptions } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";

export interface SubscriptionRow {
  id: string;
  establishmentId: string;
  provider: string;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  plan: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  providerEventAt: Date;
  createdAt: Date;
}

/** Append-only: a status transition is always a new row, never an `UPDATE`. */
export async function insertSubscriptionEvent(
  db: Executor,
  input: {
    establishmentId: string;
    providerSubscriptionId: string | null;
    providerCustomerId: string | null;
    plan: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    providerEventAt: Date;
  },
): Promise<SubscriptionRow> {
  const [row] = await db
    .insert(subscriptions)
    .values({ provider: "stripe", ...input })
    .returning();
  return row as SubscriptionRow;
}

/** The most recent recorded transition for this establishment — its current status. */
export async function findLatestSubscription(db: Executor, establishmentId: string): Promise<SubscriptionRow | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.establishmentId, establishmentId))
    .orderBy(desc(subscriptions.providerEventAt), desc(subscriptions.createdAt))
    .limit(1);
  return (row as SubscriptionRow | undefined) ?? null;
}

/** Finds the establishment already linked to a given Stripe subscription, if any. */
export async function findEstablishmentByProviderSubscriptionId(
  db: Executor,
  providerSubscriptionId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ establishmentId: subscriptions.establishmentId })
    .from(subscriptions)
    .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId))
    .limit(1);
  return row?.establishmentId ?? null;
}
