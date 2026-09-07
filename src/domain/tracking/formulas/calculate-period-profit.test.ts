import { describe, expect, it } from "vitest";
import { toCents, ZERO_CENTS } from "../../money/cents";
import { calculatePeriodProfit } from "./calculate-period-profit";
import { TRACKING_FORMULA_VERSION } from "../constants";
import type { PeriodInput } from "../types";

function input(overrides: Partial<PeriodInput> = {}): PeriodInput {
  return {
    grossRevenueCents: toCents(5_000_00),
    ordersCount: 100,
    discountsCents: toCents(100_00),
    cancellationsCents: toCents(50_00),
    knownFeesCents: toCents(500_00),
    variableCostsCents: toCents(1_500_00),
    recurringCostsCents: ZERO_CENTS,
    ...overrides,
  };
}

describe("calculatePeriodProfit", () => {
  it("computes net revenue, total costs, profit, margin, per-order and take-home", () => {
    const result = calculatePeriodProfit(input());

    // net revenue = 5.000 - 100 - 50 = 4.850
    expect(result.netRevenueCents).toBe(4_850_00);
    // total costs = 1.500 + 500 = 2.000
    expect(result.totalCostsCents).toBe(2_000_00);
    // profit = 4.850 - 2.000 = 2.850
    expect(result.profit).toEqual({ status: "available", value: 2_850_00 });
    // margin = 2850/4850 = 0.587628... -> 5876 bps (rounded)
    expect(result.marginBps).toEqual({ status: "available", value: 5876 });
    expect(result.takeHomePer100Cents).toEqual({ status: "available", value: 5876 });
    // profit per order = 2850,00 / 100 = 28,50
    expect(result.profitPerOrder).toEqual({ status: "available", value: 28_50 });
    expect(result.formulaVersion).toBe(TRACKING_FORMULA_VERSION);
  });

  it("reports a loss as a negative profit, not zero", () => {
    const result = calculatePeriodProfit(
      input({ grossRevenueCents: toCents(1_000_00), variableCostsCents: toCents(1_500_00) }),
    );

    expect(result.profit.status).toBe("available");
    if (result.profit.status === "available") {
      expect(result.profit.value).toBeLessThan(0);
    }
  });

  it("flags zero orders distinctly, even with a resolved profit", () => {
    const result = calculatePeriodProfit(input({ ordersCount: 0 }));

    expect(result.profit.status).toBe("available");
    expect(result.profitPerOrder).toEqual({ status: "unavailable", reason: "zero_orders" });
  });

  it("flags non-positive net revenue instead of dividing by zero or a negative", () => {
    const result = calculatePeriodProfit(
      input({
        grossRevenueCents: toCents(100_00),
        discountsCents: toCents(100_00),
        cancellationsCents: ZERO_CENTS,
      }),
    );

    expect(result.netRevenueCents).toBe(ZERO_CENTS);
    expect(result.marginBps).toEqual({ status: "unavailable", reason: "non_positive_revenue" });
    expect(result.takeHomePer100Cents).toEqual({ status: "unavailable", reason: "non_positive_revenue" });
  });

  it("folds prorated recurring costs into total costs and profit", () => {
    const result = calculatePeriodProfit(input({ recurringCostsCents: toCents(1_000_00) }));

    // total costs = 1.500 + 500 + 1.000 = 3.000
    expect(result.totalCostsCents).toBe(3_000_00);
    // profit = 4.850 - 3.000 = 1.850
    expect(result.profit).toEqual({ status: "available", value: 1_850_00 });
  });

  it("handles an entirely empty period (no entries, no costs) without crashing", () => {
    const result = calculatePeriodProfit({
      grossRevenueCents: ZERO_CENTS,
      ordersCount: 0,
      discountsCents: ZERO_CENTS,
      cancellationsCents: ZERO_CENTS,
      knownFeesCents: ZERO_CENTS,
      variableCostsCents: ZERO_CENTS,
      recurringCostsCents: ZERO_CENTS,
    });

    expect(result.netRevenueCents).toBe(ZERO_CENTS);
    expect(result.totalCostsCents).toBe(ZERO_CENTS);
    expect(result.profit).toEqual({ status: "available", value: ZERO_CENTS });
    expect(result.marginBps).toEqual({ status: "unavailable", reason: "non_positive_revenue" });
    expect(result.profitPerOrder).toEqual({ status: "unavailable", reason: "zero_orders" });
  });
});
