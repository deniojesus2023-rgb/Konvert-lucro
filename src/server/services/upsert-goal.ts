import { getDb } from "@/server/db/client";
import { centsToDb } from "@/server/db/money-codec";
import { assertMembership } from "@/server/services/establishment-membership";
import { upsertGoal, type GoalRow } from "@/server/repositories/goal-repository";
import type { GoalPayload } from "@/lib/validation/tracking-schemas";

export interface GoalView {
  periodStart: string;
  profitGoalCents: number | null;
  revenueGoalCents: number | null;
  marginGoalBps: number | null;
}

function toView(row: GoalRow): GoalView {
  return {
    periodStart: row.periodStart,
    profitGoalCents: row.profitGoalCents === null ? null : Number(row.profitGoalCents),
    revenueGoalCents: row.revenueGoalCents === null ? null : Number(row.revenueGoalCents),
    marginGoalBps: row.marginGoalBps,
  };
}

/** Creates or replaces the establishment's target for one calendar month. */
export async function upsertMonthlyGoal(
  establishmentId: string,
  userId: string,
  payload: GoalPayload,
): Promise<GoalView> {
  const db = getDb();
  await assertMembership(db, { establishmentId, userId });

  const row = await upsertGoal(db, {
    establishmentId,
    periodStart: payload.periodStart,
    profitGoalCents: payload.profitGoalCents === null || payload.profitGoalCents === undefined ? null : centsToDb(payload.profitGoalCents),
    revenueGoalCents: payload.revenueGoalCents === null || payload.revenueGoalCents === undefined ? null : centsToDb(payload.revenueGoalCents),
    marginGoalBps: payload.marginGoalBps ?? null,
  });

  return toView(row);
}
