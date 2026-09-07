import type { Cents } from "../../money/cents";
import { computeOrOverflow, subtractCents } from "../../money/arithmetic";
import type { Metric, PeriodResult } from "../types";

export interface PeriodComparison {
  readonly profitDeltaCents: Metric<Cents>;
  readonly marginDeltaBps: Metric<number>;
}

function diff<T extends number>(current: Metric<T>, previous: Metric<T>, subtract: (a: T, b: T) => T): Metric<T> {
  if (current.status === "unavailable") return current;
  if (previous.status === "unavailable") return { status: "unavailable", reason: "no_prior_period" };

  const result = computeOrOverflow(() => subtract(current.value, previous.value));
  return result.ok ? { status: "available", value: result.value } : { status: "unavailable", reason: "exceeds_safe_range" };
}

/**
 * A pure diff between the current period and the prior one — no
 * calendar logic here, the caller decides what "prior" means (previous
 * week, previous month, etc.) and hands in two already-computed
 * `PeriodResult`s.
 */
export function comparePeriods(current: PeriodResult, previous: PeriodResult): PeriodComparison {
  return {
    profitDeltaCents: diff(current.profit, previous.profit, subtractCents),
    marginDeltaBps: diff(current.marginBps, previous.marginBps, (a, b) => a - b),
  };
}
