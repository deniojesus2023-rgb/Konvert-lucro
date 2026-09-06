import { toDerivedCents, type Cents } from "./cents";

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_BIGINT = -MAX_SAFE_BIGINT;

/**
 * Thrown when a derived result (not a division-by-zero — that's a
 * programming error, guarded separately) would exceed
 * `Number.MAX_SAFE_INTEGER`. This is a distinct class specifically so
 * callers can catch *this* condition and degrade a single metric to
 * "unavailable" instead of letting an unrelated bug get swallowed too, and
 * so one metric overflowing never has to abort the whole diagnostic.
 */
export class UnsafeIntegerRangeError extends RangeError {
  constructor(value: bigint) {
    super(
      `Resultado intermediário excede o intervalo seguro de inteiros: ${value.toString()}`,
    );
    this.name = "UnsafeIntegerRangeError";
  }
}

function toSafeNumber(value: bigint): number {
  if (value > MAX_SAFE_BIGINT || value < MIN_SAFE_BIGINT) {
    throw new UnsafeIntegerRangeError(value);
  }
  return Number(value);
}

/** Sums any number of `Cents`, checked against the safe-integer range. */
export function addCents(...values: Cents[]): Cents {
  const sum = values.reduce((acc, v) => acc + BigInt(v), 0n);
  return toDerivedCents(toSafeNumber(sum));
}

export function subtractCents(a: Cents, b: Cents): Cents {
  return toDerivedCents(toSafeNumber(BigInt(a) - BigInt(b)));
}

export function negateCents(a: Cents): Cents {
  return toDerivedCents(toSafeNumber(-BigInt(a)));
}

/**
 * Computes `round(a * b / c)` using `BigInt` intermediates so that
 * `a * b` never silently loses precision even when it exceeds
 * `Number.MAX_SAFE_INTEGER` (e.g. two values near the R$10.000.000 input
 * ceiling multiplied together). Ties round away from zero, matching
 * `roundHalfAwayFromZero`. Throws if `c` is zero — callers must guard
 * division by zero explicitly before calling this.
 */
export function mulDivRound(a: number, b: number, c: number): number {
  if (c === 0) {
    throw new RangeError("Divisão por zero em mulDivRound");
  }
  const numerator = BigInt(a) * BigInt(b);
  const denominator = BigInt(c);
  const resultIsNegative = numerator < 0n !== denominator < 0n;
  const absNumerator = numerator < 0n ? -numerator : numerator;
  const absDenominator = denominator < 0n ? -denominator : denominator;

  const quotient = absNumerator / absDenominator;
  const remainder = absNumerator % absDenominator;
  const roundedAbs =
    remainder * 2n >= absDenominator ? quotient + 1n : quotient;

  const signed = resultIsNegative ? -roundedAbs : roundedAbs;
  return toSafeNumber(signed);
}

/**
 * Runs `compute`, catching only `UnsafeIntegerRangeError` — an expected,
 * recoverable data condition — and reporting it as `{ ok: false }` instead
 * of throwing. Any other error propagates unchanged: this must never mask
 * a real bug such as an unguarded division by zero. Callers use this to
 * degrade a single derived metric to "unavailable" without letting one
 * pathological input abort the rest of the diagnostic.
 */
export function computeOrOverflow<T>(
  compute: () => T,
): { readonly ok: true; readonly value: T } | { readonly ok: false } {
  try {
    return { ok: true, value: compute() };
  } catch (err) {
    if (err instanceof UnsafeIntegerRangeError) {
      return { ok: false };
    }
    throw err;
  }
}

/**
 * Computes `ceil(a * b / c)`. Intended for positive operands only (e.g.
 * break-even order counts) — sign handling mirrors `mulDivRound` but the
 * "ceiling" here means "round the absolute value up", which only matches
 * the conventional ceiling when the result is non-negative.
 */
export function mulDivCeil(a: number, b: number, c: number): number {
  if (c === 0) {
    throw new RangeError("Divisão por zero em mulDivCeil");
  }
  const numerator = BigInt(a) * BigInt(b);
  const denominator = BigInt(c);
  const resultIsNegative = numerator < 0n !== denominator < 0n;
  const absNumerator = numerator < 0n ? -numerator : numerator;
  const absDenominator = denominator < 0n ? -denominator : denominator;

  const quotient = absNumerator / absDenominator;
  const remainder = absNumerator % absDenominator;
  const roundedAbs = remainder > 0n ? quotient + 1n : quotient;

  const signed = resultIsNegative ? -roundedAbs : roundedAbs;
  return toSafeNumber(signed);
}
