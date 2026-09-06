import { describe, expect, it } from "vitest";
import { centsFromDb, centsToDb, countFromDb } from "./money-codec";

describe("centsFromDb", () => {
  it("reads a bigint, a string and a number identically", () => {
    expect(centsFromDb(1_000_000n)).toBe(1_000_000);
    expect(centsFromDb("1000000")).toBe(1_000_000);
    expect(centsFromDb(1_000_000)).toBe(1_000_000);
  });

  it("passes null through", () => {
    expect(centsFromDb(null)).toBeNull();
  });

  it("reads a negative value (a stored loss)", () => {
    expect(centsFromDb("-999999999")).toBe(-999_999_999);
  });

  it("refuses a value above the safe-integer range instead of truncating it", () => {
    const beyondSafe = (BigInt(Number.MAX_SAFE_INTEGER) + 1n).toString();
    expect(() => centsFromDb(beyondSafe)).toThrow(RangeError);
  });

  it("refuses a value below the safe-integer range", () => {
    const beyondSafe = (BigInt(Number.MIN_SAFE_INTEGER) - 1n).toString();
    expect(() => centsFromDb(beyondSafe)).toThrow(RangeError);
  });
});

describe("countFromDb", () => {
  it("reads counts and guards the same range", () => {
    expect(countFromDb("1000")).toBe(1000);
    expect(countFromDb(null)).toBeNull();
    expect(() => countFromDb((BigInt(Number.MAX_SAFE_INTEGER) + 1n).toString())).toThrow(
      RangeError,
    );
  });
});

describe("centsToDb", () => {
  it("writes bigint so nothing round-trips through a float", () => {
    expect(centsToDb(2000)).toBe(2000n);
    expect(typeof centsToDb(2000)).toBe("bigint");
  });

  it("passes null through", () => {
    expect(centsToDb(null)).toBeNull();
  });

  it("refuses a non-integer", () => {
    expect(() => centsToDb(10.5)).toThrow(RangeError);
  });
});
