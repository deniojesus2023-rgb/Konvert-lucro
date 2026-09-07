import { describe, expect, it } from "vitest";
import { toCents, ZERO_CENTS } from "../../money/cents";
import { aggregatePeriod } from "./period-aggregate";

describe("aggregatePeriod", () => {
  it("sums multiple daily entries and variable costs into one PeriodInput", () => {
    const result = aggregatePeriod(
      [
        {
          grossRevenueCents: toCents(1_000_00),
          ordersCount: 40,
          discountsCents: toCents(10_00),
          cancellationsCents: toCents(5_00),
          knownFeesCents: toCents(50_00),
        },
        {
          grossRevenueCents: toCents(2_000_00),
          ordersCount: 60,
          discountsCents: toCents(20_00),
          cancellationsCents: toCents(0),
          knownFeesCents: toCents(80_00),
        },
      ],
      [{ amountCents: toCents(300_00) }, { amountCents: toCents(150_00) }],
    );

    expect(result).toEqual({
      grossRevenueCents: 3_000_00,
      ordersCount: 100,
      discountsCents: 30_00,
      cancellationsCents: 5_00,
      knownFeesCents: 130_00,
      variableCostsCents: 450_00,
    });
  });

  it("returns all-zero totals for an empty period", () => {
    const result = aggregatePeriod([], []);

    expect(result).toEqual({
      grossRevenueCents: ZERO_CENTS,
      ordersCount: 0,
      discountsCents: ZERO_CENTS,
      cancellationsCents: ZERO_CENTS,
      knownFeesCents: ZERO_CENTS,
      variableCostsCents: ZERO_CENTS,
    });
  });
});
