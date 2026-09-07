import { goalDistance } from "@/domain/tracking/formulas/goal-distance";
import type { Metric, PeriodResult } from "@/domain/tracking/types";
import type { Cents } from "@/domain/money/cents";
import { centsFromDb } from "@/server/db/money-codec";
import { getDb } from "@/server/db/client";
import { assertMembership } from "@/server/services/establishment-membership";
import { findGoal } from "@/server/repositories/goal-repository";
import { computePeriodResult } from "@/server/services/get-period-summary";

export interface GoalProgress {
  summary: PeriodResult;
  profitGoalCents: number | null;
  gapToGoal: Metric<Cents>;
}

/**
 * The month's `PeriodResult` plus how far it is from the profit goal for
 * that same month, if one is set — same sign convention as the
 * diagnostic engine's `gapToGoal` (negative means the goal was exceeded).
 */
export async function getGoalProgress(
  establishmentId: string,
  userId: string,
  monthStart: string,
): Promise<GoalProgress> {
  const db = getDb();
  await assertMembership(db, { establishmentId, userId });

  const today = new Date().toISOString().slice(0, 10);
  const monthEnd = new Date(Date.UTC(Number(monthStart.slice(0, 4)), Number(monthStart.slice(5, 7)), 0))
    .toISOString()
    .slice(0, 10);
  const toDate = monthEnd < today ? monthEnd : today;

  const [summary, goal] = await Promise.all([
    computePeriodResult(db, establishmentId, { fromDate: monthStart, toDate }),
    findGoal(db, { establishmentId, periodStart: monthStart }),
  ]);

  const profitGoalCents = goal?.profitGoalCents === null || goal?.profitGoalCents === undefined ? null : centsFromDb(goal.profitGoalCents);

  return {
    summary,
    profitGoalCents: profitGoalCents === null ? null : Number(profitGoalCents),
    gapToGoal: goalDistance(summary.profit, profitGoalCents),
  };
}
