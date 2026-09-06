import { describe, expect, it } from "vitest";
import { formatCentsForInput, parseCurrencyInput } from "./currency";

describe("formatCentsForInput", () => {
  it("formats pt-BR with thousands separator and two decimals", () => {
    expect(formatCentsForInput(123456)).toBe("1.234,56");
    expect(formatCentsForInput(2000)).toBe("20,00");
    expect(formatCentsForInput(0)).toBe("0,00");
  });
});

describe("parseCurrencyInput", () => {
  it("parses pt-BR formatted values", () => {
    expect(parseCurrencyInput("1.234,56")).toBe(123456);
    expect(parseCurrencyInput("50.000")).toBe(5_000_000);
    expect(parseCurrencyInput("20,00")).toBe(2000);
  });

  it("returns null for empty or invalid input", () => {
    expect(parseCurrencyInput("")).toBeNull();
    expect(parseCurrencyInput("abc")).toBeNull();
    expect(parseCurrencyInput("R$ 10,00")).toBeNull();
  });

  it("never turns an empty field into zero", () => {
    expect(parseCurrencyInput("  ")).toBeNull();
  });
});
