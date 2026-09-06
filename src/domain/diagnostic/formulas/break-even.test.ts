import { describe, expect, it } from "vitest";
import { toCents } from "../../money/cents";
import { computeBreakEven } from "./break-even";

describe("computeBreakEven", () => {
  it("matches the mandatory base scenario (R$25.000 / 500 orders)", () => {
    const result = computeBreakEven({
      revenueCents: toCents(50_000_00),
      variableCostsCents: toCents(30_000_00),
      fixedCostsCents: toCents(10_000_00),
      ordersValue: 1000,
    });

    expect(result.revenue).toEqual({ status: "available", value: 25_000_00 });
    expect(result.orders).toEqual({ status: "available", value: 500 });
  });

  it("returns break-even revenue even when orders are unknown", () => {
    const result = computeBreakEven({
      revenueCents: toCents(50_000_00),
      variableCostsCents: toCents(30_000_00),
      fixedCostsCents: toCents(10_000_00),
      ordersValue: null,
    });

    expect(result.revenue).toEqual({ status: "available", value: 25_000_00 });
    expect(result.orders).toEqual({ status: "unavailable", reason: "missing_orders" });
  });

  it("is unavailable (both) when contribution margin is zero", () => {
    const result = computeBreakEven({
      revenueCents: toCents(50_000_00),
      variableCostsCents: toCents(50_000_00),
      fixedCostsCents: toCents(10_000_00),
      ordersValue: 1000,
    });

    expect(result.revenue).toEqual({
      status: "unavailable",
      reason: "non_positive_contribution_margin",
    });
    expect(result.orders).toEqual({
      status: "unavailable",
      reason: "non_positive_contribution_margin",
    });
  });

  it("is unavailable (both) when contribution margin is negative", () => {
    const result = computeBreakEven({
      revenueCents: toCents(50_000_00),
      variableCostsCents: toCents(60_000_00),
      fixedCostsCents: toCents(10_000_00),
      ordersValue: 1000,
    });

    expect(result.revenue.status).toBe("unavailable");
    expect(result.orders.status).toBe("unavailable");
  });

  it("flags zero orders distinctly from missing orders", () => {
    const result = computeBreakEven({
      revenueCents: toCents(50_000_00),
      variableCostsCents: toCents(30_000_00),
      fixedCostsCents: toCents(10_000_00),
      ordersValue: 0,
    });

    expect(result.orders).toEqual({ status: "unavailable", reason: "zero_orders" });
  });

  it("rounds break-even orders up (never a partial order)", () => {
    const result = computeBreakEven({
      revenueCents: toCents(100_00),
      variableCostsCents: toCents(40_00),
      fixedCostsCents: toCents(21_00),
      ordersValue: 7,
    });
    // contribution = 100_00 - 40_00 = 60_00
    // breakEvenOrders = ceil(fixedCosts * orders / contribution) = ceil(2100 * 7 / 6000)
    //                 = ceil(14700 / 6000) = ceil(2.45) = 3
    expect(result.orders).toEqual({ status: "available", value: 3 });
  });

  it("variable-tax scenario matches R$31.250 / 625 orders", () => {
    const result = computeBreakEven({
      revenueCents: toCents(50_000_00),
      variableCostsCents: toCents(34_000_00),
      fixedCostsCents: toCents(10_000_00),
      ordersValue: 1000,
    });

    expect(result.revenue).toEqual({ status: "available", value: 31_250_00 });
    expect(result.orders).toEqual({ status: "available", value: 625 });
  });

  it("fixed-tax scenario matches R$35.000 / 700 orders", () => {
    const result = computeBreakEven({
      revenueCents: toCents(50_000_00),
      variableCostsCents: toCents(30_000_00),
      fixedCostsCents: toCents(14_000_00),
      ordersValue: 1000,
    });

    expect(result.revenue).toEqual({ status: "available", value: 35_000_00 });
    expect(result.orders).toEqual({ status: "available", value: 700 });
  });

  it("mandatory regression: rounds break-even revenue UP to the next cent", () => {
    // revenue 10.000, variable costs 7.000, fixed costs 100 (all in cents)
    // contribution = 3.000; fixedCosts*revenue/contribution = 1_000_000/3_000 = 333,333... -> 334
    const result = computeBreakEven({
      revenueCents: toCents(10_000),
      variableCostsCents: toCents(7_000),
      fixedCostsCents: toCents(100),
      ordersValue: null,
    });

    expect(result.revenue).toEqual({ status: "available", value: 334 });
  });

  it("mandatory regression: an overflowing break-even revenue does not take break-even orders down with it", () => {
    // A near-zero contribution margin (1 cent) blows break-even revenue past
    // Number.MAX_SAFE_INTEGER, but the order-count figure stays comfortably
    // inside safe-integer range and must still be reported.
    const result = computeBreakEven({
      revenueCents: toCents(1_000_000_000),
      variableCostsCents: toCents(999_999_999),
      fixedCostsCents: toCents(1_000_000_000),
      ordersValue: 1000,
    });

    expect(result.revenue).toEqual({ status: "unavailable", reason: "exceeds_safe_range" });
    expect(result.orders).toEqual({ status: "available", value: 1_000_000_000_000 });
  });
});
