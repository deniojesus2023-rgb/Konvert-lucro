import { toDerivedCents, type Cents } from "../../money/cents";
import { computeOrOverflow, mulDivCeil, subtractCents } from "../../money/arithmetic";
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
 *
 * Revenue and orders are computed independently: a pathologically thin
 * contribution margin can push the break-even *revenue* past
 * `Number.MAX_SAFE_INTEGER` while the break-even *order count* stays well
 * within range (or vice versa). One overflowing must never take the other
 * down with it.
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

  return {
    revenue: computeBreakEvenRevenue(
      inputs.fixedCostsCents,
      inputs.revenueCents,
      contributionCents,
    ),
    orders: computeBreakEvenOrders(
      inputs.fixedCostsCents,
      inputs.ordersValue,
      contributionCents,
    ),
  };
}

function computeBreakEvenRevenue(
  fixedCostsCents: Cents,
  revenueCents: Cents,
  contributionCents: Cents,
): Metric<Cents> {
  // Rounds UP to the next cent: undershooting the break-even point (e.g.
  // rounding 333,33 down to 333) would tell the owner they're already
  // safe one cent before they actually are.
  const result = computeOrOverflow(() =>
    toDerivedCents(mulDivCeil(fixedCostsCents, revenueCents, contributionCents)),
  );
  if (!result.ok) {
    return { status: "unavailable", reason: "exceeds_safe_range" };
  }
  return { status: "available", value: result.value };
}

function computeBreakEvenOrders(
  fixedCostsCents: Cents,
  ordersValue: number | null,
  contributionCents: Cents,
): Metric<number> {
  if (ordersValue === null) {
    return { status: "unavailable", reason: "missing_orders" };
  }
  if (ordersValue === 0) {
    return { status: "unavailable", reason: "zero_orders" };
  }

  const result = computeOrOverflow(() =>
    mulDivCeil(fixedCostsCents, ordersValue, contributionCents),
  );
  if (!result.ok) {
    return { status: "unavailable", reason: "exceeds_safe_range" };
  }
  return { status: "available", value: result.value };
}
