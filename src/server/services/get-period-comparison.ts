import { comparePeriods, type PeriodComparison } from "@/domain/tracking/formulas/period-comparison";
import type { PeriodResult } from "@/domain/tracking/types";
import { getDb } from "@/server/db/client";
import { assertMembership } from "@/server/services/establishment-membership";
import { computePeriodResult } from "@/server/services/get-period-summary";

export interface PeriodComparisonResult {
  current: PeriodResult;
  previous: PeriodResult;
  comparison: PeriodComparison;
}

/** Computes two periods once (current + a caller-chosen "prior" range) and diffs them. */
export async function getPeriodComparison(
  establishmentId: string,
  userId: string,
  ranges: {
    current: { fromDate: string; toDate: string };
    previous: { fromDate: string; toDate: string };
  },
): Promise<PeriodComparisonResult> {
  const db = getDb();
  await assertMembership(db, { establishmentId, userId });

  const [current, previous] = await Promise.all([
    computePeriodResult(db, establishmentId, ranges.current),
    computePeriodResult(db, establishmentId, ranges.previous),
  ]);

  return { current, previous, comparison: comparePeriods(current, previous) };
}
