import { roundHalfAwayFromZero, type Cents } from "../money/cents";

/**
 * Every answer in the diagnostic is one of six states. Only "informed",
 * "estimated" and "zero_confirmed" carry a usable value — "unknown" and
 * "unanswered" must never be treated as zero, and "range" (an open range)
 * has no computable point value at all.
 */
export type ResponseState<T> =
  | { readonly kind: "informed"; readonly value: T }
  | { readonly kind: "range"; readonly min: T; readonly max: T | null }
  | {
      readonly kind: "estimated";
      readonly value: T;
      readonly range: { readonly min: T; readonly max: T };
    }
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

/**
 * Turns a closed range into an `estimated` state using the midpoint as an
 * explicit simulation hypothesis. Open ranges (`max === null`) cannot
 * produce a midpoint and are returned unchanged as a blind spot.
 */
export function estimateFromRange(
  min: Cents,
  max: Cents | null,
): ResponseState<Cents> {
  if (max === null) {
    return { kind: "range", min, max: null };
  }
  const midpoint = roundHalfAwayFromZero((min + max) / 2) as Cents;
  return { kind: "estimated", value: midpoint, range: { min, max } };
}
