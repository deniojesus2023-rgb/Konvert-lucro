import { describe, expect, it } from "vitest";
import { previousMonthRange, startOfMonth, startOfWeek } from "./period-bounds";

describe("startOfWeek", () => {
  it("returns the same date when it's already a Monday", () => {
    expect(startOfWeek("2026-01-05")).toBe("2026-01-05");
  });

  it("returns the previous Monday for a mid-week date", () => {
    expect(startOfWeek("2026-01-08")).toBe("2026-01-05");
  });

  it("handles a Sunday correctly (ISO week start, not calendar week start)", () => {
    expect(startOfWeek("2026-01-11")).toBe("2026-01-05");
  });

  it("crosses a month boundary correctly", () => {
    expect(startOfWeek("2026-03-01")).toBe("2026-02-23");
  });
});

describe("startOfMonth", () => {
  it("returns the first day of the month", () => {
    expect(startOfMonth("2026-03-17")).toBe("2026-03-01");
  });
});

describe("previousMonthRange", () => {
  it("returns the full prior month within the same year", () => {
    expect(previousMonthRange("2026-03-01")).toEqual({ fromDate: "2026-02-01", toDate: "2026-02-28" });
  });

  it("crosses a year boundary", () => {
    expect(previousMonthRange("2026-01-01")).toEqual({ fromDate: "2025-12-01", toDate: "2025-12-31" });
  });

  it("accounts for a leap-year February", () => {
    expect(previousMonthRange("2028-03-01")).toEqual({ fromDate: "2028-02-01", toDate: "2028-02-29" });
  });
});
