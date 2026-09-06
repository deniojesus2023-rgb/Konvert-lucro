import { describe, expect, it } from "vitest";
import { toCents, ZERO_CENTS } from "../money/cents";
import {
  estimateFromRange,
  isBlindSpot,
  isResolved,
  resolvedValue,
} from "./response-state";

describe("isResolved", () => {
  it("treats informed, estimated and zero_confirmed as resolved", () => {
    expect(isResolved({ kind: "informed", value: toCents(100) })).toBe(true);
    expect(
      isResolved({
        kind: "estimated",
        value: toCents(150),
        range: { min: toCents(100), max: toCents(200) },
      }),
    ).toBe(true);
    expect(isResolved({ kind: "zero_confirmed" })).toBe(true);
  });

  it("treats unknown, unanswered and range as unresolved", () => {
    expect(isResolved({ kind: "unknown" })).toBe(false);
    expect(isResolved({ kind: "unanswered" })).toBe(false);
    expect(isResolved({ kind: "range", min: toCents(100), max: toCents(200) })).toBe(false);
  });
});

describe("isBlindSpot", () => {
  it("flags unknown and unanswered", () => {
    expect(isBlindSpot({ kind: "unknown" })).toBe(true);
    expect(isBlindSpot({ kind: "unanswered" })).toBe(true);
  });

  it("flags an open range but not a closed one", () => {
    expect(isBlindSpot({ kind: "range", min: toCents(100), max: null })).toBe(true);
    expect(isBlindSpot({ kind: "range", min: toCents(100), max: toCents(200) })).toBe(false);
  });

  it("does not flag resolved states", () => {
    expect(isBlindSpot({ kind: "informed", value: toCents(100) })).toBe(false);
    expect(isBlindSpot({ kind: "zero_confirmed" })).toBe(false);
  });
});

describe("resolvedValue", () => {
  it("returns the informed value", () => {
    expect(resolvedValue({ kind: "informed", value: toCents(500) }, ZERO_CENTS)).toBe(500);
  });

  it("returns zeroValue for zero_confirmed (the only legitimate zero)", () => {
    expect(resolvedValue({ kind: "zero_confirmed" }, ZERO_CENTS)).toBe(0);
  });

  it("never turns unknown/unanswered into zero", () => {
    expect(resolvedValue({ kind: "unknown" }, ZERO_CENTS)).toBeNull();
    expect(resolvedValue({ kind: "unanswered" }, ZERO_CENTS)).toBeNull();
  });

  it("returns null for an unresolved range", () => {
    expect(resolvedValue({ kind: "range", min: toCents(1), max: toCents(2) }, ZERO_CENTS)).toBeNull();
  });
});

describe("estimateFromRange", () => {
  it("produces an estimated state with the midpoint for a closed range", () => {
    const state = estimateFromRange(toCents(1000), toCents(2000));
    expect(state.kind).toBe("estimated");
    if (state.kind === "estimated") {
      expect(state.value).toBe(1500);
      expect(state.range).toEqual({ min: 1000, max: 2000 });
    }
  });

  it("rounds an odd midpoint away from zero", () => {
    const state = estimateFromRange(toCents(1000), toCents(2001));
    expect(state.kind).toBe("estimated");
    if (state.kind === "estimated") {
      // (1000 + 2001) / 2 = 1500.5 -> 1501
      expect(state.value).toBe(1501);
    }
  });

  it("cannot produce a midpoint for an open range", () => {
    const state = estimateFromRange(toCents(50_000_00), null);
    expect(state).toEqual({ kind: "range", min: 5_000_000, max: null });
    expect(isBlindSpot(state)).toBe(true);
  });
});
