import { ZERO_CENTS, type Cents } from "../../money/cents";
import { addCents } from "../../money/arithmetic";
import type { PeriodInput } from "../types";

export interface DailyEntryAggregateRow {
  readonly grossRevenueCents: Cents;
  readonly ordersCount: number;
  readonly discountsCents: Cents;
  readonly cancellationsCents: Cents;
  readonly knownFeesCents: Cents;
}

export interface VariableCostAggregateRow {
  readonly amountCents: Cents;
}

/**
 * Sums raw `daily_entries` + `variable_costs` rows for a period into
 * everything the profit formula needs except `recurringCostsCents` —
 * recurring costs come from a different source (prorated on demand by
 * `recurring-cost-proration.ts`) and are folded in by the caller. Every
 * sum here goes through `addCents` (BigInt-safe) — never a plain `+=` on
 * `number`.
 */
export function aggregatePeriod(
  entries: readonly DailyEntryAggregateRow[],
  variableCosts: readonly VariableCostAggregateRow[],
): Omit<PeriodInput, "recurringCostsCents"> {
  let grossRevenueCents: Cents = ZERO_CENTS;
  let discountsCents: Cents = ZERO_CENTS;
  let cancellationsCents: Cents = ZERO_CENTS;
  let knownFeesCents: Cents = ZERO_CENTS;
  let ordersCount = 0;

  for (const entry of entries) {
    grossRevenueCents = addCents(grossRevenueCents, entry.grossRevenueCents);
    discountsCents = addCents(discountsCents, entry.discountsCents);
    cancellationsCents = addCents(cancellationsCents, entry.cancellationsCents);
    knownFeesCents = addCents(knownFeesCents, entry.knownFeesCents);
    ordersCount += entry.ordersCount;
  }

  let variableCostsCents: Cents = ZERO_CENTS;
  for (const cost of variableCosts) {
    variableCostsCents = addCents(variableCostsCents, cost.amountCents);
  }

  return {
    grossRevenueCents,
    ordersCount,
    discountsCents,
    cancellationsCents,
    knownFeesCents,
    variableCostsCents,
  };
}
