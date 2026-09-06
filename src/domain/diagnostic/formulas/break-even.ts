import { toDerivedCents, type Cents } from "../../money/cents";
import { mulDivCeil, mulDivRound, subtractCents } from "../../money/arithmetic";
import type { Metric } from "../types";

export interface BreakEvenInputs {
  readonly revenueCents: Cents;
  readonly variableCostsCents: Cents;
  readonly fixedCostsCents: Cents;
  /** `null` when orders are unresolved. */
  readonly ordersValue: number | null;
}

export interface BreakEvenResult {
  readonly revenue: Metric<Cents>;
  readonly orders: Metric<number>;
}

/**
 * Pure break-even math. Assumes the caller has already confirmed that
 * revenue, the required cost groups and taxes are all resolved (and, if
 * taxes are non-zero, classified as fixed or variable) — this function
 * only decides between a positive-contribution-margin result and the
 * `non_positive_contribution_margin` / `zero_orders` cases.
 *
 * Both break-even figures assume the sales mix and the cost structure of
 * the period stay constant going forward — a simplifying hypothesis, not
 * a prediction.
 */
export function computeBreakEven(inputs: BreakEvenInputs): BreakEvenResult {
  const contributionCents = subtractCents(
    inputs.revenueCents,
    inputs.variableCostsCents,
  );

  if (contributionCents <= 0) {
    return {
      revenue: { status: "unavailable", reason: "non_positive_contribution_margin" },
      orders: { status: "unavailable", reason: "non_positive_contribution_margin" },
    };
  }

  const breakEvenRevenueCents = toDerivedCents(
    mulDivRound(inputs.fixedCostsCents, inputs.revenueCents, contributionCents),
  );

  const revenue: Metric<Cents> = { status: "confirmed", value: breakEvenRevenueCents };

  if (inputs.ordersValue === null) {
    return { revenue, orders: { status: "unavailable", reason: "missing_orders" } };
  }

  if (inputs.ordersValue === 0) {
    return { revenue, orders: { status: "unavailable", reason: "zero_orders" } };
  }

  const breakEvenOrders = mulDivCeil(
    inputs.fixedCostsCents,
    inputs.ordersValue,
    contributionCents,
  );

  return { revenue, orders: { status: "confirmed", value: breakEvenOrders } };
}
