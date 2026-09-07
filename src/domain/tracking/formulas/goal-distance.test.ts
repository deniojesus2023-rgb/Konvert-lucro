import { describe, expect, it } from "vitest";
import { toCents } from "../../money/cents";
import { goalDistance } from "./goal-distance";

describe("goalDistance", () => {
  it("returns goal minus profit when profit is below the goal", () => {
    const result = goalDistance({ status: "available", value: toCents(2_000_00) }, toCents(5_000_00));
    expect(result).toEqual({ status: "available", value: 3_000_00 });
  });

  it("returns a negative distance when profit already exceeds the goal", () => {
    const result = goalDistance({ status: "available", value: toCents(8_000_00) }, toCents(5_000_00));
    expect(result).toEqual({ status: "available", value: -3_000_00 });
  });

  it("is unavailable with 'no_goal' when no goal is set, even with a resolved profit", () => {
    const result = goalDistance({ status: "available", value: toCents(2_000_00) }, null);
    expect(result).toEqual({ status: "unavailable", reason: "no_goal" });
  });

  it("propagates profit's own unavailable reason instead of masking it", () => {
    const result = goalDistance({ status: "unavailable", reason: "zero_orders" }, toCents(5_000_00));
    expect(result).toEqual({ status: "unavailable", reason: "zero_orders" });
  });
});
