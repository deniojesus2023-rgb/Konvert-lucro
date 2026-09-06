import { describe, expect, it } from "vitest";
import {
  emptyOrderUiState,
  orderUiToResponseState,
  responseStateToOrderUi,
} from "./order-answer";

describe("orderUiToResponseState", () => {
  it("exact count -> informed", () => {
    expect(orderUiToResponseState({ mode: "exact", value: "1000" })).toEqual({
      kind: "informed",
      value: 1000,
    });
  });

  it("não sei -> unknown", () => {
    expect(orderUiToResponseState(emptyOrderUiState("unknown"))).toEqual({ kind: "unknown" });
  });

  it("não tive pedidos -> zero_confirmed", () => {
    expect(orderUiToResponseState(emptyOrderUiState("zero"))).toEqual({ kind: "zero_confirmed" });
  });

  it("returns null (not zero) for an empty or non-numeric field", () => {
    expect(orderUiToResponseState(emptyOrderUiState("exact"))).toBeNull();
    expect(orderUiToResponseState({ mode: "exact", value: "abc" })).toBeNull();
    expect(orderUiToResponseState({ mode: "exact", value: "-5" })).toBeNull();
    expect(orderUiToResponseState({ mode: "exact", value: "1.5" })).toBeNull();
  });
});

describe("responseStateToOrderUi", () => {
  it("round-trips informed, unknown and zero_confirmed", () => {
    expect(responseStateToOrderUi({ kind: "informed", value: 42 })).toEqual({
      mode: "exact",
      value: "42",
    });
    expect(responseStateToOrderUi({ kind: "unknown" }).mode).toBe("unknown");
    expect(responseStateToOrderUi({ kind: "zero_confirmed" }).mode).toBe("zero");
  });
});
