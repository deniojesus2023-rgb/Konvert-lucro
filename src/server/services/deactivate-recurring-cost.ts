import { getDb } from "@/server/db/client";
import { assertMembership } from "@/server/services/establishment-membership";
import { deactivateRecurringCost } from "@/server/repositories/recurring-cost-repository";

/**
 * Turns a recurring cost off rather than deleting it — past periods that
 * already prorated its share stay correct, and it can be reactivated
 * later without losing its history (name, amount, start date).
 */
export async function deactivateRecurringCostForUser(
  establishmentId: string,
  userId: string,
  costId: string,
): Promise<void> {
  const db = getDb();
  await assertMembership(db, { establishmentId, userId });
  await deactivateRecurringCost(db, { id: costId, establishmentId });
}
