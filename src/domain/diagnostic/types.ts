import type { Cents } from "../money/cents";
import type { ResponseState } from "./response-state";
import type { CostGroupKey, TaxClassification } from "./constants";

export interface DiagnosticInput {
  readonly revenue: ResponseState<Cents>;
  readonly costs: Readonly<Record<CostGroupKey, ResponseState<Cents>>>;
  readonly taxes: {
    readonly classification: TaxClassification;
    readonly state: ResponseState<Cents>;
  };
  readonly orders: ResponseState<number>;
  readonly goal: ResponseState<Cents>;
}

export type UnavailableReason =
  | "missing_revenue"
  | "missing_required_costs"
  | "missing_taxes"
  | "missing_orders"
  | "missing_goal"
  | "unclassified_taxes"
  | "non_positive_contribution_margin"
  | "zero_revenue"
  | "zero_orders"
  /** The derived value would exceed `Number.MAX_SAFE_INTEGER` — only this
   * one metric is degraded, the rest of the diagnostic still runs. */
  | "exceeds_safe_range";

export interface UnavailableMetric {
  readonly status: "unavailable";
  readonly reason: UnavailableReason;
}

export interface AvailableMetric<T> {
  readonly status: "available";
  readonly value: T;
}

export type Metric<T> = AvailableMetric<T> | UnavailableMetric;

export type BlindSpotField =
  | "revenue"
  | CostGroupKey
  | "taxes"
  | "orders"
  | "goal";

export type BlindSpotKind = "unknown" | "unanswered" | "open_range";

export interface BlindSpot {
  readonly field: BlindSpotField;
  readonly kind: BlindSpotKind;
}

export interface CostBucket {
  readonly group: CostGroupKey | "taxes";
  readonly totalCents: Cents;
  readonly isEstimated: boolean;
}

export interface ProfitResult {
  readonly formulaVersion: string;
  /** Always true: every result is a self-reported estimate, never an audit. */
  readonly selfReportedDisclaimer: true;

  readonly revenue: Metric<Cents>;
  /** Sum of whichever cost groups (and taxes) are currently resolved. */
  readonly knownCostsTotalCents: Cents;
  /** Revenue minus known costs — never called "profit". */
  readonly balanceBeforeUnknownCosts: Metric<Cents>;

  readonly profitBeforeTaxes: Metric<Cents>;
  /** The headline profit figure, after taxes. */
  readonly profit: Metric<Cents>;
  readonly marginBps: Metric<number>;
  readonly profitPerOrder: Metric<Cents>;
  /** How much stays in the business per R$100 sold, in cents. */
  readonly takeHomePer100Cents: Metric<number>;
  readonly breakEvenRevenue: Metric<Cents>;
  readonly breakEvenOrders: Metric<number>;
  /** Goal minus profit. Negative means the goal was already exceeded. */
  readonly gapToGoal: Metric<Cents>;

  readonly topCostGroups: readonly CostBucket[];
  /**
   * Every resolved cost bucket (never just the top N), in canonical
   * order (production, fees, delivery, structure, then taxes) — the
   * source for a full revenue-minus-costs statement. A blind-spot group
   * simply has no entry here; it never appears as zero.
   */
  readonly allCostGroups: readonly CostBucket[];
  readonly blindSpots: readonly BlindSpot[];
  readonly hasEstimatedInputs: boolean;
  readonly estimatedGroups: readonly BlindSpotField[];
}
