import type { ResponseState } from "@/domain/diagnostic/response-state";

/** Orders have no faixa/estimativa concept — just a count or a non-numeric state. */
export type OrderUiMode = "exact" | "unknown" | "zero";

export interface OrderUiState {
  readonly mode: OrderUiMode;
  readonly value: string;
}

export function emptyOrderUiState(mode: OrderUiMode = "exact"): OrderUiState {
  return { mode, value: "" };
}

export function orderUiToResponseState(ui: OrderUiState): ResponseState<number> | null {
  switch (ui.mode) {
    case "exact": {
      const trimmed = ui.value.trim();
      if (trimmed === "" || !/^\d+$/.test(trimmed)) return null;
      const value = Number(trimmed);
      return Number.isSafeInteger(value) ? { kind: "informed", value } : null;
    }
    case "unknown":
      return { kind: "unknown" };
    case "zero":
      return { kind: "zero_confirmed" };
  }
}

export function responseStateToOrderUi(state: ResponseState<number> | undefined): OrderUiState {
  if (!state) return emptyOrderUiState();
  switch (state.kind) {
    case "informed":
      return { mode: "exact", value: String(state.value) };
    case "zero_confirmed":
      return emptyOrderUiState("zero");
    case "unknown":
      return emptyOrderUiState("unknown");
    default:
      return emptyOrderUiState();
  }
}
