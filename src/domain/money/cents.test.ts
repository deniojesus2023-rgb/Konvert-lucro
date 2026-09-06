import { describe, expect, it } from "vitest";
import {
  MAX_INPUT_CENTS,
  centsToReaisString,
  parseReaisStringToCents,
  roundHalfAwayFromZero,
  toCents,
  toDerivedCents,
  ZERO_CENTS,
} from "./cents";

describe("MAX_INPUT_CENTS", () => {
  it("equals R$10.000.000,00 in cents", () => {
    expect(MAX_INPUT_CENTS).toBe(1_000_000_000);
  });
});

describe("roundHalfAwayFromZero", () => {
  it("rounds positive ties up", () => {
    expect(roundHalfAwayFromZero(1.5)).toBe(2);
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
  });

  it("rounds negative ties away from zero (not toward +Infinity)", () => {
    expect(roundHalfAwayFromZero(-1.5)).toBe(-2);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
  });

  it("still rounds non-ties normally", () => {
    expect(roundHalfAwayFromZero(1.2)).toBe(1);
    expect(roundHalfAwayFromZero(-1.2)).toBe(-1);
    expect(roundHalfAwayFromZero(1.7)).toBe(2);
    expect(roundHalfAwayFromZero(-1.7)).toBe(-2);
  });

  it("differs from Math.round for negative halves", () => {
    // Documents exactly why we can't use Math.round directly for money.
    expect(Math.round(-1.5)).toBe(-1);
    expect(roundHalfAwayFromZero(-1.5)).toBe(-2);
  });

  it("mandatory regression: never returns -0", () => {
    const result = roundHalfAwayFromZero(-0.1);
    expect(result).toBe(0);
    expect(Object.is(result, -0)).toBe(false);
    expect(Object.is(result, 0)).toBe(true);
  });

  it("also normalizes -0 for other small negative fractions that round to zero", () => {
    expect(Object.is(roundHalfAwayFromZero(-0.49), 0)).toBe(true);
  });
});

describe("toCents", () => {
  it("accepts a valid non-negative integer", () => {
    expect(toCents(12345)).toBe(12345);
    expect(toCents(0)).toBe(0);
  });

  it("rejects non-integers", () => {
    expect(() => toCents(12.5)).toThrow(RangeError);
  });

  it("rejects negative values", () => {
    expect(() => toCents(-1)).toThrow(RangeError);
  });

  it("rejects values above the limit", () => {
    expect(() => toCents(MAX_INPUT_CENTS + 1)).toThrow(RangeError);
  });

  it("accepts the exact limit", () => {
    expect(toCents(MAX_INPUT_CENTS)).toBe(MAX_INPUT_CENTS);
  });

  it("rejects unsafe integers", () => {
    expect(() => toCents(Number.MAX_SAFE_INTEGER + 10, Number.MAX_SAFE_INTEGER + 100)).toThrow(
      RangeError,
    );
  });
});

describe("toDerivedCents", () => {
  it("allows negative values (a loss)", () => {
    expect(toDerivedCents(-500)).toBe(-500);
  });

  it("still rejects non-integers and unsafe values", () => {
    expect(() => toDerivedCents(1.1)).toThrow(RangeError);
    expect(() => toDerivedCents(Number.MAX_SAFE_INTEGER + 2)).toThrow(RangeError);
  });
});

describe("parseReaisStringToCents", () => {
  it("parses plain integers", () => {
    expect(parseReaisStringToCents("1234")).toBe(123400);
  });

  it("parses pt-BR formatted values with thousands separators", () => {
    expect(parseReaisStringToCents("1.234,56")).toBe(123456);
    expect(parseReaisStringToCents("50.000")).toBe(5_000_000);
  });

  it("parses a value with a single decimal digit", () => {
    expect(parseReaisStringToCents("10,5")).toBe(1050);
  });

  it("parses plain decimal (dot) notation", () => {
    expect(parseReaisStringToCents("1234.56")).toBe(123456);
  });

  it("rejects a fraction of a cent", () => {
    expect(parseReaisStringToCents("10,555")).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(parseReaisStringToCents("abc")).toBeNull();
    expect(parseReaisStringToCents("")).toBeNull();
    expect(parseReaisStringToCents("R$ 10,00")).toBeNull();
  });

  it("rejects negative amounts", () => {
    expect(parseReaisStringToCents("-10,00")).toBeNull();
  });

  it("rejects values above the input ceiling", () => {
    expect(parseReaisStringToCents("10000001,00")).toBeNull();
  });
});

describe("centsToReaisString", () => {
  it("formats a round value", () => {
    expect(centsToReaisString(toCents(2000))).toBe("20,00");
  });

  it("formats with thousands separators", () => {
    expect(centsToReaisString(toCents(123456))).toBe("1.234,56");
  });

  it("formats zero", () => {
    expect(centsToReaisString(ZERO_CENTS)).toBe("0,00");
  });

  it("formats a negative value (a loss)", () => {
    expect(centsToReaisString(toDerivedCents(-2000))).toBe("-20,00");
  });

  it("round-trips with parseReaisStringToCents", () => {
    const original = "1.234,56";
    const cents = parseReaisStringToCents(original);
    expect(cents).not.toBeNull();
    expect(centsToReaisString(cents!)).toBe(original);
  });
});
