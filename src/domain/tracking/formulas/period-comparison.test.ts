import { describe, expect, it } from "vitest";
import { toCents } from "../../money/cents";
import { TRACKING_FORMULA_VERSION } from "../constants";
import { comparePeriods } from "./period-comparison";
import type { PeriodResult } from "../types";

function result(profitCents: number, marginBps: number): PeriodResult {
  return {
    formulaVersion: TRACKING_FORMULA_VERSION,
    netRevenueCents: toCents(0),
    totalCostsCents: toCents(0),
    profit: { status: "available", value: toCents(profitCents) },
    marginBps: { status: "available", value: marginBps },
    profitPerOrder: { status: "unavailable", reason: "zero_orders" },
    takeHomePer100Cents: { status: "available", value: marginBps },
  };
}

describe("comparePeriods", () => {
  it("computes a positive delta when the current period improved", () => {
    const comparison = comparePeriods(result(3_000_00, 6000), result(2_000_00, 5000));
    expect(comparison.profitDeltaCents).toEqual({ status: "available", value: 1_000_00 });
    expect(comparison.marginDeltaBps).toEqual({ status: "available", value: 1000 });
  });

  it("computes a negative delta when the current period got worse", () => {
    const comparison = comparePeriods(result(1_000_00, 2000), result(2_000_00, 5000));
    expect(comparison.profitDeltaCents).toEqual({ status: "available", value: -1_000_00 });
    expect(comparison.marginDeltaBps).toEqual({ status: "available", value: -3000 });
  });

  it("is unavailable with 'no_prior_period' when the previous period has no data", () => {
    const previous: PeriodResult = {
      ...result(0, 0),
      profit: { status: "unavailable", reason: "zero_orders" },
    };
    const comparison = comparePeriods(result(1_000_00, 5000), previous);
    expect(comparison.profitDeltaCents).toEqual({ status: "unavailable", reason: "no_prior_period" });
  });

  it("propagates the current period's own unavailable reason instead of masking it", () => {
    const current: PeriodResult = {
      ...result(0, 0),
      profit: { status: "unavailable", reason: "exceeds_safe_range" },
    };
    const comparison = comparePeriods(current, result(1_000_00, 5000));
    expect(comparison.profitDeltaCents).toEqual({ status: "unavailable", reason: "exceeds_safe_range" });
  });
});
