import type { Cents } from "@/domain/money/cents";
import { estimateFromRange, estimateTyped, type ResponseState } from "@/domain/diagnostic/response-state";
import { formatCentsForInput, parseCurrencyInput } from "./currency";

/**
 * The five visible choices for a monetary answer, per the diagnostic spec.
 * "zero" is worded per-field ("Não tenho esse custo" / "Não tive vendas
 * no período" / "Não tive pedidos") but always becomes `zero_confirmed`.
 */
export type MonetaryUiMode = "exact" | "approximate" | "range" | "unknown" | "zero";

export interface MonetaryUiState {
  readonly mode: MonetaryUiMode;
  readonly exactValue: string;
  readonly approximateValue: string;
  readonly rangeMin: string;
  /** Empty string means an open range ("mais de X") — never a real "0". */
  readonly rangeMax: string;
}

export function emptyMonetaryUiState(mode: MonetaryUiMode = "exact"): MonetaryUiState {
  return { mode, exactValue: "", approximateValue: "", rangeMin: "", rangeMax: "" };
}

/**
 * Converts the widget's UI state into the exact `ResponseState` shape the
 * API expects. Returns `null` when the current mode doesn't yet have a
 * complete, valid value — e.g. an empty field, or an inverted range — so
 * the caller can keep "Continuar" disabled instead of guessing a value.
 *
 * This never invents a number: an empty field is `null` (incomplete), not
 * zero, and an open range never gets a midpoint.
 */
export function monetaryUiToResponseState(ui: MonetaryUiState): ResponseState<Cents> | null {
  switch (ui.mode) {
    case "exact": {
      const cents = parseCurrencyInput(ui.exactValue);
      return cents === null ? null : { kind: "informed", value: cents as Cents };
    }
    case "approximate": {
      const cents = parseCurrencyInput(ui.approximateValue);
      return cents === null ? null : estimateTyped(cents as Cents);
    }
    case "range": {
      const min = parseCurrencyInput(ui.rangeMin);
      if (min === null) return null;
      if (ui.rangeMax.trim() === "") {
        return { kind: "range", min: min as Cents, max: null };
      }
      const max = parseCurrencyInput(ui.rangeMax);
      if (max === null) return null;
      try {
        return estimateFromRange(min as Cents, max as Cents);
      } catch {
        // Inverted range (max < min): not a valid answer yet.
        return null;
      }
    }
    case "unknown":
      return { kind: "unknown" };
    case "zero":
      return { kind: "zero_confirmed" };
  }
}

/** The inverse mapping, used to prefill the widget when resuming a draft. */
export function responseStateToMonetaryUi(
  state: ResponseState<Cents> | undefined,
): MonetaryUiState {
  if (!state) return emptyMonetaryUiState();

  switch (state.kind) {
    case "informed":
      return { ...emptyMonetaryUiState("exact"), exactValue: formatForUi(state.value) };
    case "estimated":
      if (state.origin === "typed") {
        return {
          ...emptyMonetaryUiState("approximate"),
          approximateValue: formatForUi(state.value),
        };
      }
      return {
        ...emptyMonetaryUiState("range"),
        rangeMin: formatForUi(state.range.min),
        rangeMax: formatForUi(state.range.max),
      };
    case "range":
      return {
        ...emptyMonetaryUiState("range"),
        rangeMin: formatForUi(state.min),
        rangeMax: state.max === null ? "" : formatForUi(state.max),
      };
    case "unknown":
      return emptyMonetaryUiState("unknown");
    case "zero_confirmed":
      return emptyMonetaryUiState("zero");
    case "unanswered":
      return emptyMonetaryUiState();
  }
}

function formatForUi(cents: Cents): string {
  return formatCentsForInput(cents);
}
