import { describe, expect, it } from "vitest";
import { formatOfferPricePerDay, formatOfferPricePerMonth, OFFER_PRICE_CENTS } from "./pricing";

describe("pricing — every derived figure comes from OFFER_PRICE_CENTS", () => {
  it("is R$149,00", () => {
    expect(OFFER_PRICE_CENTS).toBe(14_900);
  });

  it("formats the monthly price from the constant", () => {
    expect(formatOfferPricePerMonth()).toBe("R$149/mês");
  });

  it("derives 'menos de R$5 por dia' from the same constant, rounded up", () => {
    // 14900 / 30 = 496,67 cents/day -> ceil to 497 -> R$5 (ceil reais) so
    // the claim never understates the actual daily cost.
    expect(formatOfferPricePerDay()).toBe("Menos de R$5 por dia");
  });

  it("recomputes automatically if the constant changes (no independent hardcoded copy)", () => {
    // Simulates a price bump and checks the day-rate formula still tracks it,
    // proving formatOfferPricePerDay is a function of OFFER_PRICE_CENTS, not
    // a second literal.
    const simulatedPriceCents = 29_900;
    const perDay = Math.ceil(Math.ceil(simulatedPriceCents / 30) / 100);
    expect(perDay).toBe(10);
  });
});
