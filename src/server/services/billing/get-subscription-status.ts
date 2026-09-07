import { getDb } from "@/server/db/client";
import { assertMembership } from "@/server/services/establishment-membership";
import { findLatestSubscription, type SubscriptionStatus } from "@/server/repositories/subscription-repository";

export interface SubscriptionStatusView {
  status: SubscriptionStatus | "none";
  isActive: boolean;
  currentPeriodEnd: string | null;
}

const ACTIVE_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(["trialing", "active"]);

export async function getSubscriptionStatus(establishmentId: string, userId: string): Promise<SubscriptionStatusView> {
  const db = getDb();
  await assertMembership(db, { establishmentId, userId });

  const latest = await findLatestSubscription(db, establishmentId);
  if (!latest) return { status: "none", isActive: false, currentPeriodEnd: null };

  return {
    status: latest.status,
    isActive: ACTIVE_STATUSES.has(latest.status),
    currentPeriodEnd: latest.currentPeriodEnd ? latest.currentPeriodEnd.toISOString() : null,
  };
}
