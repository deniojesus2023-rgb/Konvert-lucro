import { describe, expect, it } from "vitest";
import { toCents } from "../../money/cents";
import { topCostBuckets } from "./cost-buckets";

describe("topCostBuckets", () => {
  it("returns the top N buckets sorted descending", () => {
    const buckets = [
      { group: "production" as const, totalCents: toCents(1000), isEstimated: false },
      { group: "fees" as const, totalCents: toCents(5000), isEstimated: false },
      { group: "delivery" as const, totalCents: toCents(2000), isEstimated: false },
      { group: "fixedStructure" as const, totalCents: toCents(3000), isEstimated: false },
    ];

    const top = topCostBuckets(buckets, 3);
    expect(top.map((b) => b.group)).toEqual(["fees", "fixedStructure", "delivery"]);
  });

  it("returns fewer than the limit when fewer buckets are resolved", () => {
    const buckets = [
      { group: "production" as const, totalCents: toCents(1000), isEstimated: false },
    ];
    expect(topCostBuckets(buckets, 3)).toHaveLength(1);
  });

  it("returns an empty list when nothing is resolved", () => {
    expect(topCostBuckets([], 3)).toEqual([]);
  });
});
