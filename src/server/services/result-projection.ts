import type { Cents } from "@/domain/money/cents";
import type { Metric, ProfitResult } from "@/domain/diagnostic/types";
import { centsToDb } from "@/server/db/money-codec";

/**
 * Flattens the headline metrics of a `ProfitResult` into queryable
 * columns. These are a projection for indexing and reporting only — the
 * full, authoritative result (statuses, unavailability reasons, blind
 * spots, disclaimer) always lives in `output_snapshot`, so nothing is lost
 * when a metric is unavailable and there is never a "0 means unavailable"
 * ambiguity: an unavailable metric is stored as NULL.
 */
export function projectResultColumns(result: ProfitResult) {
  return {
    profitStatus: result.profit.status,
    profitCents: centsColumn(result.profit),
    marginBps: numberColumn(result.marginBps),
    profitPerOrderCents: centsColumn(result.profitPerOrder),
    takeHomePer100Cents: numberColumn(result.takeHomePer100Cents),
    breakEvenRevenueCents: centsColumn(result.breakEvenRevenue),
    breakEvenOrders: bigIntColumn(result.breakEvenOrders),
    gapToGoalCents: centsColumn(result.gapToGoal),
    hasEstimatedInputs: result.hasEstimatedInputs,
  };
}

function centsColumn(metric: Metric<Cents>): bigint | null {
  return metric.status === "available" ? centsToDb(metric.value) : null;
}

function numberColumn(metric: Metric<number>): number | null {
  return metric.status === "available" ? metric.value : null;
}

function bigIntColumn(metric: Metric<number>): bigint | null {
  return metric.status === "available" ? BigInt(metric.value) : null;
}
