import {
  centsToReaisString,
  parseReaisStringToCents,
  toCents,
  toDerivedCents,
} from "@/domain/money/cents";

/**
 * Thin client-facing wrappers around the domain's money module — the only
 * place allowed to parse/format reais. Never reimplement pt-BR currency
 * parsing here or anywhere else in the UI.
 */

/** Formats cents for display in a currency input, e.g. `5000 -> "50,00"`. */
export function formatCentsForInput(cents: number): string {
  return centsToReaisString(toCents(cents, Number.MAX_SAFE_INTEGER));
}

/**
 * Parses a pt-BR currency string typed by the user into cents, or `null`
 * if the string isn't a valid amount (empty, garbage, negative, a
 * fraction of a cent, or above the input ceiling).
 */
export function parseCurrencyInput(input: string): number | null {
  return parseReaisStringToCents(input);
}

/**
 * Full display with the "R$" prefix and sign, e.g. `-2000 -> "-R$20,00"`.
 * Unlike `formatCentsForInput` (a user-typed amount, always non-negative),
 * this formats derived results — profit, a loss, a gap to the goal — which
 * are allowed to be negative.
 */
export function formatCurrencyDisplay(cents: number): string {
  const value = toDerivedCents(cents);
  const negative = value < 0;
  const formatted = centsToReaisString(toCents(Math.abs(value), Number.MAX_SAFE_INTEGER));
  return `${negative ? "-" : ""}R$${formatted}`;
}

/** Rounded whole-reais display for headline copy, e.g. `1950 -> "R$20"`. */
export function formatWholeReais(cents: number): string {
  const reais = Math.round(Math.abs(cents) / 100);
  const sign = cents < 0 ? "-" : "";
  return `${sign}R$${reais.toLocaleString("pt-BR")}`;
}
