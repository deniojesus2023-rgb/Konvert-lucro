import { type Cents } from "../../money/cents";
import { computeOrOverflow, subtractCents } from "../../money/arithmetic";
import type { Metric } from "../types";

/**
 * Goal minus profit — negative means the goal was already exceeded. Same
 * sign convention as the diagnostic engine's `gapToGoal`, so the same
 * "faltam para a meta" / "superou a meta em" copy logic on the frontend
 * works unchanged for either engine.
 */
export function goalDistance(profit: Metric<Cents>, goalCents: Cents | null): Metric<Cents> {
  if (profit.status === "unavailable") return profit;
  if (goalCents === null) return { status: "unavailable", reason: "no_goal" };

  const result = computeOrOverflow(() => subtractCents(goalCents, profit.value));
  return result.ok ? { status: "available", value: result.value } : { status: "unavailable", reason: "exceeds_safe_range" };
}
