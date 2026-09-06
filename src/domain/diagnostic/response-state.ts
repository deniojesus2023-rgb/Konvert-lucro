import { roundHalfAwayFromZero, type Cents } from "../money/cents";

/**
 * An "estimated" answer is either typed directly by the user (a number
 * they judge to be roughly right, with no range behind it) or derived from
 * a closed range they picked (the range's midpoint). Both are usable
 * values, but the UI and any audit trail need to tell them apart — hence
 * the required `origin` discriminant instead of a single shared shape.
 */
export type EstimatedState<T> =
  | { readonly kind: "estimated"; readonly origin: "typed"; readonly value: T }
  | {
      readonly kind: "estimated";
      readonly origin: "range";
      readonly value: T;
      readonly range: { readonly min: T; readonly max: T };
    };

/**
 * Every answer in the diagnostic is one of six states. Only "informed",
 * "estimated" and "zero_confirmed" carry a usable value — "unknown" and
 * "unanswered" must never be treated as zero, and "range" (an open range)
 * has no computable point value at all.
 */
export type ResponseState<T> =
  | { readonly kind: "informed"; readonly value: T }
  | { readonly kind: "range"; readonly min: T; readonly max: T | null }
  | EstimatedState<T>
  | { readonly kind: "unknown" }
  | { readonly kind: "zero_confirmed" }
  | { readonly kind: "unanswered" };

export type ResolvedKind = "informed" | "estimated" | "zero_confirmed";

/** A resolved state is one that yields a usable value for calculation. */
export function isResolved<T>(
  state: ResponseState<T>,
): state is Extract<ResponseState<T>, { kind: ResolvedKind }> {
  return (
    state.kind === "informed" ||
    state.kind === "estimated" ||
    state.kind === "zero_confirmed"
  );
}

/** True for states that represent a genuine blind spot for calculation. */
export function isBlindSpot<T>(state: ResponseState<T>): boolean {
  return (
    state.kind === "unknown" ||
    state.kind === "unanswered" ||
    (state.kind === "range" && state.max === null)
  );
}

/**
 * Returns the usable numeric value of a resolved state, or `null` for
 * anything unresolved. `zeroValue` is the caller's representation of zero
 * (e.g. `ZERO_CENTS` or the plain number `0`).
 */
export function resolvedValue<T>(
  state: ResponseState<T>,
  zeroValue: T,
): T | null {
  switch (state.kind) {
    case "informed":
    case "estimated":
      return state.value;
    case "zero_confirmed":
      return zeroValue;
    default:
      return null;
  }
}

/** A user-typed estimate with no range behind it. */
export function estimateTyped<T>(value: T): EstimatedState<T> {
  return { kind: "estimated", origin: "typed", value };
}

/**
 * Normalizes a range answer before it reaches calculation: a closed range
 * (`min <= max`) becomes an `estimated` state whose value is the midpoint,
 * tagged with `origin: "range"` and carrying the original bounds so the UI
 * can show "estimativa entre R$X e R$Y" and let the user revise it. An
 * open range (`max === null`) never gets an invented midpoint and is
 * returned as-is — a blind spot, not a value. An inverted or otherwise
 * invalid range (`max < min`) is rejected outright: it isn't data, it's a
 * bug upstream (the form, a bad default) that must not silently produce a
 * number.
 */
export function estimateFromRange(
  min: Cents,
  max: Cents | null,
): ResponseState<Cents> {
  if (max === null) {
    return { kind: "range", min, max: null };
  }
  if (max < min) {
    throw new RangeError(
      `Faixa inválida: o máximo (${max}) é menor que o mínimo (${min})`,
    );
  }
  const midpoint = roundHalfAwayFromZero((min + max) / 2) as Cents;
  return { kind: "estimated", origin: "range", value: midpoint, range: { min, max } };
}

/**
 * Validates a raw order count before it is wrapped in a `ResponseState`:
 * must be a non-negative safe integer. Unlike money, orders have no
 * "faixa"/estimate concept in this phase — just a plain count or one of
 * the non-numeric states (unknown, zero_confirmed, unanswered).
 */
export function toOrderCount(value: number): number {
  if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
    throw new RangeError(
      `Quantidade de pedidos deve ser um número inteiro seguro: ${value}`,
    );
  }
  if (value < 0) {
    throw new RangeError(`Quantidade de pedidos não pode ser negativa: ${value}`);
  }
  return value;
}
