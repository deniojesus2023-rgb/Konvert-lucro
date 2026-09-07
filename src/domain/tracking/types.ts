import type { Cents } from "../money/cents";

/**
 * A local `Metric<T>` — deliberately not imported from `domain/diagnostic`.
 * A daily entry either exists or doesn't (no "unknown"/"estimated" response
 * states here), so the reasons a metric can be unavailable are different
 * from the survey engine's and shouldn't be coupled to Phase 1A's frozen
 * vocabulary.
 */
export type TrackingUnavailableReason =
  | "exceeds_safe_range"
  | "zero_orders"
  | "non_positive_revenue"
  | "no_goal"
  | "no_prior_period";

export interface TrackingUnavailableMetric {
  readonly status: "unavailable";
  readonly reason: TrackingUnavailableReason;
}

export interface TrackingAvailableMetric<T> {
  readonly status: "available";
  readonly value: T;
}

export type Metric<T> = TrackingAvailableMetric<T> | TrackingUnavailableMetric;

/**
 * Everything the period-profit formula needs, already aggregated from raw
 * `daily_entries` + `variable_costs` rows (see `period-aggregate.ts`).
 */
export interface PeriodInput {
  readonly grossRevenueCents: Cents;
  readonly ordersCount: number;
  readonly discountsCents: Cents;
  readonly cancellationsCents: Cents;
  readonly knownFeesCents: Cents;
  readonly variableCostsCents: Cents;
  /** Sum of every recurring cost's prorated share of this period — see `recurring-cost-proration.ts`. */
  readonly recurringCostsCents: Cents;
}

export interface PeriodResult {
  readonly formulaVersion: string;
  readonly netRevenueCents: Cents;
  readonly totalCostsCents: Cents;
  readonly profit: Metric<Cents>;
  readonly marginBps: Metric<number>;
  readonly profitPerOrder: Metric<Cents>;
  /** How much stays in the business per R$100 sold, in cents. */
  readonly takeHomePer100Cents: Metric<number>;
}
