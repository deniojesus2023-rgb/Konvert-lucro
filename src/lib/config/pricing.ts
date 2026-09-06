import { centsToReaisString, toCents } from "@/domain/money/cents";

/**
 * Single source of truth for the offer price. Every screen that mentions
 * R$149/mês, the "menos de R$5 por dia" framing, or any other derived
 * figure must read it from here — never hardcode a second copy of the
 * price that could drift out of sync.
 */
export const OFFER_PRICE_CENTS = 14_900;

const DAYS_PER_MONTH = 30;

export function formatOfferPricePerMonth(): string {
  return `R$${centsToReaisString(toCents(OFFER_PRICE_CENTS)).replace(",00", "")}/mês`;
}

/** "Menos de R$5 por dia" — rounds the daily cost UP so the claim never overstates the price. */
export function formatOfferPricePerDay(): string {
  const perDayCents = Math.ceil(OFFER_PRICE_CENTS / DAYS_PER_MONTH);
  const reais = Math.ceil(perDayCents / 100);
  return `Menos de R$${reais} por dia`;
}
