import { describe, expect, it } from "vitest";
import { toCents, toDerivedCents } from "./cents";
import { addCents, mulDivCeil, mulDivRound, negateCents, subtractCents } from "./arithmetic";

describe("addCents / subtractCents / negateCents", () => {
  it("adds several values", () => {
    expect(addCents(toCents(100), toCents(200), toCents(300))).toBe(600);
  });

  it("subtracts, allowing negative results", () => {
    expect(subtractCents(toCents(100), toCents(300))).toBe(-200);
  });

  it("negates", () => {
    expect(negateCents(toDerivedCents(-200))).toBe(200);
  });

  it("throws when a sum would exceed the safe integer range", () => {
    const huge = toDerivedCents(Number.MAX_SAFE_INTEGER);
    expect(() => addCents(huge, toCents(10))).toThrow(RangeError);
  });
});

describe("mulDivRound", () => {
  it("computes an exact division with no remainder", () => {
    // margin: profit 1_000_000 cents / revenue 5_000_000 cents * 10_000 = 2000 bps (20%)
    expect(mulDivRound(1_000_000, 10_000, 5_000_000)).toBe(2000);
  });

  it("rounds ties away from zero", () => {
    // 1 * 3 / 2 = 1.5 -> 2
    expect(mulDivRound(1, 3, 2)).toBe(2);
    // -1 * 3 / 2 = -1.5 -> -2
    expect(mulDivRound(-1, 3, 2)).toBe(-2);
  });

  it("rounds a negative result correctly (loss scenario)", () => {
    // profit -1_000_000 / revenue 5_000_000 * 10_000 = -2000 bps
    expect(mulDivRound(-1_000_000, 10_000, 5_000_000)).toBe(-2000);
  });

  it("does not lose precision for products beyond Number.MAX_SAFE_INTEGER", () => {
    // Two values near the R$10.000.000 input ceiling multiplied together
    // overflow a plain `number` multiplication (1e9 * 1e9 = 1e18).
    const a = 1_000_000_000;
    const b = 1_000_000_000;
    // a*b/a should be exactly b regardless of how large a*b got.
    expect(mulDivRound(a, b, a)).toBe(b);
  });

  it("throws on division by zero", () => {
    expect(() => mulDivRound(1, 2, 0)).toThrow(RangeError);
  });
});

describe("mulDivCeil", () => {
  it("computes an exact division with no remainder", () => {
    // break-even orders, base case: fixedCosts 1_000_000 * orders 1000 / contribution 2_000_000 = 500
    expect(mulDivCeil(1_000_000, 1000, 2_000_000)).toBe(500);
  });

  it("rounds any remainder up (never a partial order)", () => {
    expect(mulDivCeil(1, 1, 3)).toBe(1); // 0.333... -> 1
    expect(mulDivCeil(10, 1, 3)).toBe(4); // 3.333... -> 4
  });

  it("throws on division by zero", () => {
    expect(() => mulDivCeil(1, 2, 0)).toThrow(RangeError);
  });
});
