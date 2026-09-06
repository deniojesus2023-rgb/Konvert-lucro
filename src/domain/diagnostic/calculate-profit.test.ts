import { describe, expect, it } from "vitest";
import { toCents, type Cents } from "../money/cents";
import { calculateProfit } from "./calculate-profit";
import { estimateFromRange, estimateTyped, type ResponseState } from "./response-state";
import type { TaxClassification } from "./constants";
import type { DiagnosticInput } from "./types";

function informed(reais: number): ResponseState<Cents> {
  return { kind: "informed", value: toCents(reais * 100) };
}

function informedOrders(n: number): ResponseState<number> {
  return { kind: "informed", value: n };
}

const zeroConfirmed = { kind: "zero_confirmed" as const };
const unknown = { kind: "unknown" as const };
const unanswered = { kind: "unanswered" as const };

/** Base scenario from the spec: R$50.000 revenue, R$30.000 variable costs
 * (split across production/fees/delivery), R$10.000 fixed costs, taxes
 * explicitly zero, 1.000 orders. */
function baseInput(overrides: Partial<DiagnosticInput> = {}): DiagnosticInput {
  return {
    revenue: informed(50_000),
    costs: {
      production: informed(15_000),
      fees: informed(10_000),
      delivery: informed(5_000),
      fixedStructure: informed(10_000),
    },
    taxes: { classification: "variable", state: zeroConfirmed },
    orders: informedOrders(1000),
    goal: unanswered,
    ...overrides,
  };
}

describe("calculateProfit — mandatory base scenario", () => {
  const result = calculateProfit(baseInput({ goal: informed(5_000) }));

  it("profit: R$10.000", () => {
    expect(result.profit).toEqual({ status: "available", value: 1_000_000 });
  });

  it("margin: 20% (2000 bps)", () => {
    expect(result.marginBps).toEqual({ status: "available", value: 2000 });
  });

  it("profit per order: R$10", () => {
    expect(result.profitPerOrder).toEqual({ status: "available", value: 1000 });
  });

  it("take-home per R$100: R$20, i.e. 2000 cents (not 20)", () => {
    expect(result.takeHomePer100Cents).toEqual({ status: "available", value: 2000 });
  });

  it("break-even revenue: R$25.000", () => {
    expect(result.breakEvenRevenue).toEqual({ status: "available", value: 2_500_000 });
  });

  it("break-even orders: 500", () => {
    expect(result.breakEvenOrders).toEqual({ status: "available", value: 500 });
  });

  it("always carries the self-reported disclaimer, even fully confirmed", () => {
    expect(result.selfReportedDisclaimer).toBe(true);
  });

  it("has no blind spots and no estimated inputs", () => {
    expect(result.blindSpots).toEqual([]);
    expect(result.hasEstimatedInputs).toBe(false);
  });
});

describe("calculateProfit — taxes classified as variable (+R$4.000)", () => {
  const result = calculateProfit(
    baseInput({ taxes: { classification: "variable", state: informed(4_000) } }),
  );

  it("profit: R$6.000", () => {
    expect(result.profit).toEqual({ status: "available", value: 600_000 });
  });

  it("break-even revenue: R$31.250", () => {
    expect(result.breakEvenRevenue).toEqual({ status: "available", value: 3_125_000 });
  });

  it("break-even orders: 625", () => {
    expect(result.breakEvenOrders).toEqual({ status: "available", value: 625 });
  });
});

describe("calculateProfit — taxes classified as fixed (+R$4.000)", () => {
  const result = calculateProfit(
    baseInput({ taxes: { classification: "fixed", state: informed(4_000) } }),
  );

  it("profit: R$6.000", () => {
    expect(result.profit).toEqual({ status: "available", value: 600_000 });
  });

  it("break-even revenue: R$35.000", () => {
    expect(result.breakEvenRevenue).toEqual({ status: "available", value: 3_500_000 });
  });

  it("break-even orders: 700", () => {
    expect(result.breakEvenOrders).toEqual({ status: "available", value: 700 });
  });
});

describe("calculateProfit — required cost group unknown", () => {
  const result = calculateProfit(
    baseInput({
      costs: {
        production: informed(15_000),
        fees: informed(10_000),
        delivery: informed(5_000),
        fixedStructure: unknown,
      },
    }),
  );

  it("profit is unavailable, not zero", () => {
    expect(result.profit).toEqual({ status: "unavailable", reason: "missing_required_costs" });
    expect(result.profitBeforeTaxes).toEqual({
      status: "unavailable",
      reason: "missing_required_costs",
    });
  });

  it("balance before unknown costs is still shown, using only known costs", () => {
    // revenue 5_000_000 - (production 1_500_000 + fees 1_000_000 + delivery 500_000) = 2_000_000
    expect(result.balanceBeforeUnknownCosts).toEqual({ status: "available", value: 2_000_000 });
  });

  it("lists the unknown group as a blind spot, never as zero", () => {
    expect(result.blindSpots).toContainEqual({ field: "fixedStructure", kind: "unknown" });
  });

  it("dependent metrics are also unavailable", () => {
    expect(result.marginBps.status).toBe("unavailable");
    expect(result.breakEvenRevenue).toEqual({
      status: "unavailable",
      reason: "missing_required_costs",
    });
  });
});

describe("calculateProfit — required costs known but taxes unknown", () => {
  const result = calculateProfit(baseInput({ taxes: { classification: "variable", state: unknown } }));

  it("profit before taxes is confirmed", () => {
    expect(result.profitBeforeTaxes).toEqual({ status: "available", value: 1_000_000 });
  });

  it("final profit (after taxes) is unavailable", () => {
    expect(result.profit).toEqual({ status: "unavailable", reason: "missing_taxes" });
  });

  it("break-even is unavailable due to missing taxes", () => {
    expect(result.breakEvenRevenue).toEqual({ status: "unavailable", reason: "missing_taxes" });
  });
});

describe("calculateProfit — costs and taxes all unknown", () => {
  const result = calculateProfit(
    baseInput({
      costs: {
        production: unknown,
        fees: unknown,
        delivery: unanswered,
        fixedStructure: unknown,
      },
      taxes: { classification: "unclassified", state: unknown },
    }),
  );

  it("profit is unavailable", () => {
    expect(result.profit.status).toBe("unavailable");
  });

  it("balance before unknown costs falls back to revenue alone", () => {
    expect(result.balanceBeforeUnknownCosts).toEqual({ status: "available", value: 5_000_000 });
  });

  it("every cost group and taxes are listed as blind spots", () => {
    const fields = result.blindSpots.map((b) => b.field);
    expect(fields).toEqual(
      expect.arrayContaining(["production", "fees", "delivery", "fixedStructure", "taxes"]),
    );
  });

  it("top cost groups is empty (nothing resolved to rank)", () => {
    expect(result.topCostGroups).toEqual([]);
  });
});

describe("calculateProfit — only the tax total is known (unclassified)", () => {
  const result = calculateProfit(
    baseInput({ taxes: { classification: "unclassified", state: informed(4_000) } }),
  );

  it("profit is computed normally", () => {
    expect(result.profit).toEqual({ status: "available", value: 600_000 });
  });

  it("break-even is unavailable because the split (fixed vs variable) is unknown", () => {
    expect(result.breakEvenRevenue).toEqual({ status: "unavailable", reason: "unclassified_taxes" });
    expect(result.breakEvenOrders).toEqual({ status: "unavailable", reason: "unclassified_taxes" });
  });
});

describe("calculateProfit — revenue and orders both zero", () => {
  const result = calculateProfit(
    baseInput({
      revenue: zeroConfirmed,
      costs: {
        production: zeroConfirmed,
        fees: zeroConfirmed,
        delivery: zeroConfirmed,
        fixedStructure: zeroConfirmed,
      },
      taxes: { classification: "variable", state: zeroConfirmed },
      orders: { kind: "zero_confirmed" },
    }),
  );

  it("profit is confirmed as exactly zero (a valid result, not an error)", () => {
    expect(result.profit).toEqual({ status: "available", value: 0 });
  });

  it("margin and take-home are unavailable (division by zero revenue)", () => {
    expect(result.marginBps).toEqual({ status: "unavailable", reason: "zero_revenue" });
    expect(result.takeHomePer100Cents).toEqual({ status: "unavailable", reason: "zero_revenue" });
  });

  it("profit per order is unavailable (zero orders)", () => {
    expect(result.profitPerOrder).toEqual({ status: "unavailable", reason: "zero_orders" });
  });

  it("break-even is unavailable (non-positive contribution margin)", () => {
    expect(result.breakEvenRevenue).toEqual({
      status: "unavailable",
      reason: "non_positive_contribution_margin",
    });
  });
});

describe("calculateProfit — loss is a valid result", () => {
  const result = calculateProfit(
    baseInput({
      revenue: informed(10_000),
      costs: {
        production: informed(5_000),
        fees: informed(3_000),
        delivery: informed(2_000),
        fixedStructure: informed(2_000),
      },
      taxes: { classification: "variable", state: zeroConfirmed },
    }),
  );

  it("profit is confirmed and negative", () => {
    expect(result.profit).toEqual({ status: "available", value: -200_000 });
  });

  it("margin is confirmed and negative", () => {
    expect(result.marginBps).toEqual({ status: "available", value: -2000 });
  });
});

describe("calculateProfit — goal already exceeded", () => {
  const result = calculateProfit(baseInput({ goal: informed(5_000) }));

  it("gap to goal is negative (goal already surpassed)", () => {
    // goal 500_000 - profit 1_000_000 = -500_000
    expect(result.gapToGoal).toEqual({ status: "available", value: -500_000 });
  });
});

describe("calculateProfit — unknown goal blocks only the goal comparison", () => {
  const result = calculateProfit(baseInput({ goal: unknown }));

  it("gap to goal is unavailable", () => {
    expect(result.gapToGoal).toEqual({ status: "unavailable", reason: "missing_goal" });
  });

  it("profit itself is unaffected", () => {
    expect(result.profit).toEqual({ status: "available", value: 1_000_000 });
  });
});

describe("calculateProfit — unknown orders blocks only per-order metrics", () => {
  const result = calculateProfit(baseInput({ orders: unknown }));

  it("profit and margin are unaffected", () => {
    expect(result.profit).toEqual({ status: "available", value: 1_000_000 });
    expect(result.marginBps).toEqual({ status: "available", value: 2000 });
  });

  it("profit per order and break-even orders are unavailable", () => {
    expect(result.profitPerOrder).toEqual({ status: "unavailable", reason: "missing_orders" });
    expect(result.breakEvenOrders).toEqual({ status: "unavailable", reason: "missing_orders" });
  });

  it("break-even revenue is still available", () => {
    expect(result.breakEvenRevenue).toEqual({ status: "available", value: 2_500_000 });
  });
});

describe("calculateProfit — ranges: closed estimates, open ranges stay blind spots", () => {
  it("a closed range resolves to an estimated value and propagates the mark", () => {
    const estimated = estimateFromRange(toCents(9_000_00), toCents(11_000_00));
    const result = calculateProfit(baseInput({ revenue: estimated }));

    expect(result.hasEstimatedInputs).toBe(true);
    expect(result.estimatedGroups).toContain("revenue");
    expect(result.revenue).toEqual({ status: "available", value: 1_000_000 });
  });

  it("an open range never produces a numeric estimate and stays a blind spot", () => {
    const openRange = estimateFromRange(toCents(9_000_00), null);
    const result = calculateProfit(baseInput({ revenue: openRange }));

    expect(result.revenue).toEqual({ status: "unavailable", reason: "missing_revenue" });
    expect(result.blindSpots).toContainEqual({ field: "revenue", kind: "open_range" });
    expect(result.hasEstimatedInputs).toBe(false);
  });
});

describe("calculateProfit — top cost groups ranking", () => {
  it("ranks only resolved groups, largest first, excluding blind spots", () => {
    const result = calculateProfit(
      baseInput({
        costs: {
          production: informed(15_000),
          fees: informed(10_000),
          delivery: unknown,
          fixedStructure: informed(10_000),
        },
      }),
    );

    expect(result.topCostGroups.map((b) => b.group)).toEqual([
      "production",
      "fees",
      "fixedStructure",
    ]);
    expect(result.topCostGroups.some((b) => b.group === "delivery")).toBe(false);
  });
});

describe("calculateProfit — mandatory regression: overflow degrades only the affected metric", () => {
  // A near-zero contribution margin (revenue and production one cent apart)
  // pushes break-even revenue past Number.MAX_SAFE_INTEGER. Profit and
  // break-even orders must remain available regardless.
  const result = calculateProfit(
    baseInput({
      revenue: informed(10_000_000),
      costs: {
        production: { kind: "informed", value: toCents(999_999_999) },
        fees: zeroConfirmed,
        delivery: zeroConfirmed,
        fixedStructure: informed(10_000_000),
      },
      taxes: { classification: "variable", state: zeroConfirmed },
      orders: informedOrders(1000),
    }),
  );

  it("profit stays available at -R$9.999.999,99 (-999_999_999 centavos)", () => {
    expect(result.profit).toEqual({ status: "available", value: -999_999_999 });
  });

  it("break-even revenue is unavailable — it would exceed the safe integer range", () => {
    expect(result.breakEvenRevenue).toEqual({ status: "unavailable", reason: "exceeds_safe_range" });
  });

  it("break-even orders is still evaluated independently and stays available", () => {
    expect(result.breakEvenOrders).toEqual({ status: "available", value: 1_000_000_000_000 });
  });
});

describe("calculateProfit — typed estimate vs range-derived estimate", () => {
  it("a typed estimate (no range) is marked estimated without inventing bounds", () => {
    const result = calculateProfit(baseInput({ revenue: estimateTyped(toCents(50_000_00)) }));

    expect(result.hasEstimatedInputs).toBe(true);
    expect(result.estimatedGroups).toContain("revenue");
    expect(result.revenue).toEqual({ status: "available", value: 5_000_000 });
  });

  it("both origins resolve to the same usable value but stay distinguishable at the source", () => {
    const typed = estimateTyped(toCents(1500));
    const fromRange = estimateFromRange(toCents(1000), toCents(2000));

    expect(typed).toEqual({ kind: "estimated", origin: "typed", value: 1500 });
    expect(fromRange).toEqual({
      kind: "estimated",
      origin: "range",
      value: 1500,
      range: { min: 1000, max: 2000 },
    });
  });
});

describe("TaxClassification type sanity", () => {
  it("accepts the three documented classifications", () => {
    const classifications: TaxClassification[] = ["fixed", "variable", "unclassified"];
    expect(classifications).toHaveLength(3);
  });
});
