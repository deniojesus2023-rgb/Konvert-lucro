import { ZERO_CENTS, toDerivedCents } from "@/domain/money/cents";
import { addCents } from "@/domain/money/arithmetic";
import { aggregatePeriod } from "@/domain/tracking/formulas/period-aggregate";
import { calculatePeriodProfit } from "@/domain/tracking/formulas/calculate-period-profit";
import { prorateRecurringCost } from "@/domain/tracking/formulas/recurring-cost-proration";
import type { PeriodResult } from "@/domain/tracking/types";
import { centsFromDb } from "@/server/db/money-codec";
import { getDb, type Database } from "@/server/db/client";
import { assertMembership } from "@/server/services/establishment-membership";
import { listDailyEntriesInRange } from "@/server/repositories/daily-entry-repository";
import { listVariableCostsInRange } from "@/server/repositories/variable-cost-repository";
import { listActiveRecurringCostsOverlapping } from "@/server/repositories/recurring-cost-repository";

/**
 * Aggregates every `daily_entries` + `variable_costs` row in
 * `[fromDate, toDate]` (inclusive, ISO dates), prorates every recurring
 * cost active in that range, and runs the tracking engine on the total —
 * the same shape of call as the diagnostic engine, but fed from a ledger
 * instead of a survey. Assumes the caller already holds a membership
 * check for this establishment (see `getPeriodSummary` for the
 * authorizing entry point).
 */
export async function computePeriodResult(
  db: Database,
  establishmentId: string,
  range: { fromDate: string; toDate: string },
): Promise<PeriodResult> {
  const [entries, variableCosts, recurringCosts] = await Promise.all([
    listDailyEntriesInRange(db, { establishmentId, fromDate: range.fromDate, toDate: range.toDate }),
    listVariableCostsInRange(db, { establishmentId, fromDate: range.fromDate, toDate: range.toDate }),
    listActiveRecurringCostsOverlapping(db, { establishmentId, fromDate: range.fromDate, toDate: range.toDate }),
  ]);

  const partialInput = aggregatePeriod(
    entries.map((entry) => ({
      grossRevenueCents: centsFromDb(entry.grossRevenueCents) ?? ZERO_CENTS,
      ordersCount: entry.ordersCount,
      discountsCents: centsFromDb(entry.discountsCents) ?? ZERO_CENTS,
      cancellationsCents: centsFromDb(entry.cancellationsCents) ?? ZERO_CENTS,
      knownFeesCents: centsFromDb(entry.knownFeesCents) ?? ZERO_CENTS,
    })),
    variableCosts.map((cost) => ({
      amountCents: centsFromDb(cost.amountCents) ?? ZERO_CENTS,
    })),
  );

  const recurringCostsCents = recurringCosts.reduce(
    (total, cost) =>
      addCents(
        total,
        prorateRecurringCost(
          {
            amountCents: centsFromDb(cost.amountCents) ?? ZERO_CENTS,
            frequency: cost.frequency,
            startDate: cost.startDate,
            endDate: cost.endDate,
          },
          { from: range.fromDate, to: range.toDate },
        ),
      ),
    toDerivedCents(0),
  );

  return calculatePeriodProfit({ ...partialInput, recurringCostsCents });
}

export async function getPeriodSummary(
  establishmentId: string,
  userId: string,
  range: { fromDate: string; toDate: string },
): Promise<PeriodResult> {
  const db = getDb();
  await assertMembership(db, { establishmentId, userId });
  return computePeriodResult(db, establishmentId, range);
}
