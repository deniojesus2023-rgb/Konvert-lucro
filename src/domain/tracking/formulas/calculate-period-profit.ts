import { ZERO_CENTS, toDerivedCents, type Cents } from "../../money/cents";
import { addCents, computeOrOverflow, mulDivRound, subtractCents } from "../../money/arithmetic";
import { TRACKING_FORMULA_VERSION } from "../constants";
import type { Metric, PeriodInput, PeriodResult } from "../types";

function overflowSafeMetric<T>(compute: () => T): Metric<T> {
  const result = computeOrOverflow(compute);
  return result.ok ? { status: "available", value: result.value } : { status: "unavailable", reason: "exceeds_safe_range" };
}

/**
 * Generalizes `domain/diagnostic/calculate-profit.ts`'s math for an
 * aggregated ledger period instead of a one-time survey: no response
 * states, no blind spots — every field in `PeriodInput` is either a real
 * sum of rows that exist or zero. Rounding and BigInt-overflow guards are
 * the same primitives (`addCents`, `subtractCents`, `mulDivRound`,
 * `computeOrOverflow`) as the frozen diagnostic engine.
 */
export function calculatePeriodProfit(input: PeriodInput): PeriodResult {
  const netRevenueCents = subtractCents(
    input.grossRevenueCents,
    addCents(input.discountsCents, input.cancellationsCents),
  );
  const totalCostsCents = addCents(input.variableCostsCents, input.knownFeesCents, input.recurringCostsCents);

  const profit: Metric<Cents> = overflowSafeMetric(() => subtractCents(netRevenueCents, totalCostsCents));

  let marginBps: Metric<number>;
  let takeHomePer100Cents: Metric<number>;
  if (profit.status === "unavailable") {
    marginBps = profit;
    takeHomePer100Cents = profit;
  } else if (netRevenueCents <= ZERO_CENTS) {
    marginBps = { status: "unavailable", reason: "non_positive_revenue" };
    takeHomePer100Cents = { status: "unavailable", reason: "non_positive_revenue" };
  } else {
    const ratio = overflowSafeMetric(() => mulDivRound(profit.value, 10_000, netRevenueCents));
    marginBps = ratio;
    takeHomePer100Cents = ratio;
  }

  let profitPerOrder: Metric<Cents>;
  if (profit.status === "unavailable") {
    profitPerOrder = profit;
  } else if (input.ordersCount === 0) {
    profitPerOrder = { status: "unavailable", reason: "zero_orders" };
  } else {
    profitPerOrder = overflowSafeMetric(() =>
      toDerivedCents(mulDivRound(profit.value, 1, input.ordersCount)),
    );
  }

  return {
    formulaVersion: TRACKING_FORMULA_VERSION,
    netRevenueCents,
    totalCostsCents,
    profit,
    marginBps,
    profitPerOrder,
    takeHomePer100Cents,
  };
}
