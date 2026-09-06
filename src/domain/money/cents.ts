/**
 * Money is always represented as an integer number of cents. This module is
 * the only place allowed to convert between a human-facing "reais" value
 * (typed by a user, formatted for display) and the integer `Cents` used by
 * the rest of the domain, the database and the API.
 *
 * Nothing outside this module (and `arithmetic.ts`) should perform
 * floating-point math on money.
 */

declare const CENTS_BRAND: unique symbol;

/** An integer number of cents. Never a fraction, never `NaN`/`Infinity`. */
export type Cents = number & { readonly [CENTS_BRAND]: true };

/**
 * R$10.000.000,00 in cents. This is the validation ceiling for any single
 * monetary field coming from the diagnostic — not a ceiling for derived
 * totals (see `toDerivedCents`).
 */
export const MAX_INPUT_CENTS = 1_000_000_000 as Cents;

function isIntegerInSafeRange(value: number): boolean {
  return Number.isInteger(value) && Number.isSafeInteger(value);
}

/**
 * Validates and brands a monetary value coming from user input: must be a
 * non-negative integer number of cents within `MAX_INPUT_CENTS` (or the
 * `max` override).
 */
export function toCents(value: number, max: number = MAX_INPUT_CENTS): Cents {
  if (!isIntegerInSafeRange(value)) {
    throw new RangeError(
      `Valor monetário deve ser um número inteiro seguro de centavos, recebido: ${value}`,
    );
  }
  if (value < 0) {
    throw new RangeError(`Valor monetário não pode ser negativo: ${value}`);
  }
  if (value > max) {
    throw new RangeError(
      `Valor monetário excede o limite permitido de ${max} centavos: ${value}`,
    );
  }
  return value as Cents;
}

/**
 * Brands a value computed internally by the domain (sums, differences,
 * profit/loss) — allowed to be negative (a loss) and is only bounded by
 * JS safe-integer range, not by `MAX_INPUT_CENTS`.
 */
export function toDerivedCents(value: number): Cents {
  if (!isIntegerInSafeRange(value)) {
    throw new RangeError(
      `Valor derivado deve ser um número inteiro seguro de centavos, recebido: ${value}`,
    );
  }
  return value as Cents;
}

export const ZERO_CENTS = 0 as Cents;

/**
 * Rounds to the nearest integer, ties breaking away from zero
 * (`1.5 -> 2`, `-1.5 -> -2`), unlike `Math.round` which breaks ties toward
 * `+Infinity` (`Math.round(-1.5) === -1`).
 */
export function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/**
 * Parses a Brazilian-formatted reais string (e.g. "1.234,56", "1234,5",
 * "1234.56", "1234") into `Cents`. Rejects anything with more than two
 * decimal digits (a fraction of a cent) and any non-numeric content.
 * Returns `null` instead of throwing so callers (Zod schemas, forms) can
 * turn it into a field-level validation error.
 */
export function parseReaisStringToCents(input: string): Cents | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  // Accept "1.234,56" (pt-BR) or "1234.56" (plain) but not both separators
  // mixed in an ambiguous way beyond the standard pt-BR grouping.
  const ptBrPattern = /^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$|^-?\d+(,\d{1,2})?$/;
  const plainPattern = /^-?\d+(\.\d{1,2})?$/;

  let normalized: string;
  if (ptBrPattern.test(trimmed)) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (plainPattern.test(trimmed)) {
    normalized = trimmed;
  } else {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  if (value < 0) return null;

  const cents = roundHalfAwayFromZero(value * 100);
  // Guard against float noise turning e.g. "10,00" into 999.9999...
  if (!isIntegerInSafeRange(cents)) return null;
  if (cents > MAX_INPUT_CENTS) return null;

  return cents as Cents;
}

/** Formats `Cents` as a pt-BR reais string, e.g. `2000 -> "20,00"`. */
export function centsToReaisString(value: Cents): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  const reais = Math.trunc(abs / 100);
  const remainder = abs % 100;
  const reaisFormatted = reais.toLocaleString("pt-BR");
  const centsFormatted = remainder.toString().padStart(2, "0");
  return `${negative ? "-" : ""}${reaisFormatted},${centsFormatted}`;
}
