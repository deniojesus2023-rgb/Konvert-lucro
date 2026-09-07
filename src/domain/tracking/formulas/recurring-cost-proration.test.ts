import { describe, expect, it } from "vitest";
import { toCents } from "../../money/cents";
import { prorateRecurringCost } from "./recurring-cost-proration";

describe("prorateRecurringCost", () => {
  it("allocates a full month's rent to a period covering the whole month", () => {
    const result = prorateRecurringCost(
      { amountCents: toCents(3_000_00), frequency: "monthly", startDate: "2026-01-01", endDate: null },
      { from: "2026-01-01", to: "2026-01-31" },
    );
    expect(result).toBe(3_000_00);
  });

  it("prorates a monthly cost that starts mid-month", () => {
    // Starts on the 16th of a 31-day month: 16 of 31 days fall in range.
    const result = prorateRecurringCost(
      { amountCents: toCents(3_100_00), frequency: "monthly", startDate: "2026-01-16", endDate: null },
      { from: "2026-01-01", to: "2026-01-31" },
    );
    // 3100,00 * 16 / 31 = 1600,00 (rounded)
    expect(result).toBe(1_600_00);
  });

  it("prorates a monthly cost that ends mid-month", () => {
    const result = prorateRecurringCost(
      { amountCents: toCents(3_100_00), frequency: "monthly", startDate: "2026-01-01", endDate: "2026-01-15" },
      { from: "2026-01-01", to: "2026-01-31" },
    );
    // 15 of 31 days: 3100,00 * 15 / 31 = 1500,00
    expect(result).toBe(1_500_00);
  });

  it("uses the real day count of February in a leap year", () => {
    const result = prorateRecurringCost(
      { amountCents: toCents(2_900_00), frequency: "monthly", startDate: "2028-02-01", endDate: null },
      { from: "2028-02-01", to: "2028-02-29" },
    );
    // 2028 is a leap year (29 days) — full month allocates the full amount.
    expect(result).toBe(2_900_00);
  });

  it("splits a monthly cost across two calendar months with different lengths", () => {
    const result = prorateRecurringCost(
      { amountCents: toCents(3_000_00), frequency: "monthly", startDate: "2026-01-01", endDate: null },
      { from: "2026-01-30", to: "2026-02-02" },
    );
    // Jan 30-31 (2 of 31 days): 3000*2/31 = 193,55 -> rounds to 194 (approx)
    // Feb 1-2 (2 of 28 days): 3000*2/28 = 214,29 -> rounds to 214
    const janShare = Math.round((3_000_00 * 2) / 31);
    const febShare = Math.round((3_000_00 * 2) / 28);
    expect(result).toBe(janShare + febShare);
  });

  it("allocates a weekly cost proportional to overlap days", () => {
    const result = prorateRecurringCost(
      { amountCents: toCents(700_00), frequency: "weekly", startDate: "2026-01-01", endDate: null },
      { from: "2026-01-01", to: "2026-01-07" },
    );
    expect(result).toBe(700_00);
  });

  it("returns zero when the cost's range doesn't overlap the period at all", () => {
    const result = prorateRecurringCost(
      { amountCents: toCents(3_000_00), frequency: "monthly", startDate: "2026-03-01", endDate: null },
      { from: "2026-01-01", to: "2026-01-31" },
    );
    expect(result).toBe(0);
  });

  it("returns zero once the cost has ended before the period starts", () => {
    const result = prorateRecurringCost(
      { amountCents: toCents(3_000_00), frequency: "monthly", startDate: "2025-01-01", endDate: "2025-12-31" },
      { from: "2026-01-01", to: "2026-01-31" },
    );
    expect(result).toBe(0);
  });
});
