import type { CostBucket } from "../types";

/**
 * Ranks resolved cost buckets from largest to smallest and returns the top
 * `limit`. Blind-spot groups must never be passed in here — they are
 * reported separately as blind spots, never ranked (and never treated as
 * zero).
 */
export function topCostBuckets(
  buckets: readonly CostBucket[],
  limit = 3,
): readonly CostBucket[] {
  return [...buckets]
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, limit);
}
