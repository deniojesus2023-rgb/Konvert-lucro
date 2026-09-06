import { describe, expect, it } from "vitest";
import { toCents } from "@/domain/money/cents";
import {
  emptyMonetaryUiState,
  monetaryUiToResponseState,
  responseStateToMonetaryUi,
} from "./monetary-answer";

describe("monetaryUiToResponseState", () => {
  it("valor exato -> informed", () => {
    const ui = { ...emptyMonetaryUiState("exact"), exactValue: "5.000,00" };
    expect(monetaryUiToResponseState(ui)).toEqual({ kind: "informed", value: 500_000 });
  });

  it("valor aproximado -> estimated (origin typed)", () => {
    const ui = { ...emptyMonetaryUiState("approximate"), approximateValue: "1.500,00" };
    expect(monetaryUiToResponseState(ui)).toEqual({
      kind: "estimated",
      origin: "typed",
      value: 150_000,
    });
  });

  it("faixa fechada -> estimated (origin range) com o ponto médio da regra do domínio", () => {
    const ui = { ...emptyMonetaryUiState("range"), rangeMin: "1.000,00", rangeMax: "2.000,00" };
    expect(monetaryUiToResponseState(ui)).toEqual({
      kind: "estimated",
      origin: "range",
      value: 150_000,
      range: { min: 100_000, max: 200_000 },
    });
  });

  it("faixa aberta -> range com max null, nunca um ponto médio inventado", () => {
    const ui = { ...emptyMonetaryUiState("range"), rangeMin: "5.000,00", rangeMax: "" };
    expect(monetaryUiToResponseState(ui)).toEqual({ kind: "range", min: 500_000, max: null });
  });

  it("não sei -> unknown", () => {
    expect(monetaryUiToResponseState(emptyMonetaryUiState("unknown"))).toEqual({
      kind: "unknown",
    });
  });

  it("não tenho esse custo -> zero_confirmed", () => {
    expect(monetaryUiToResponseState(emptyMonetaryUiState("zero"))).toEqual({
      kind: "zero_confirmed",
    });
  });

  it("returns null (not zero) for an empty field, so Continuar stays disabled", () => {
    expect(monetaryUiToResponseState(emptyMonetaryUiState("exact"))).toBeNull();
    expect(monetaryUiToResponseState(emptyMonetaryUiState("approximate"))).toBeNull();
    expect(
      monetaryUiToResponseState({ ...emptyMonetaryUiState("range"), rangeMin: "" }),
    ).toBeNull();
  });

  it("returns null for an inverted range instead of guessing", () => {
    const ui = { ...emptyMonetaryUiState("range"), rangeMin: "2.000,00", rangeMax: "1.000,00" };
    expect(monetaryUiToResponseState(ui)).toBeNull();
  });

  it("returns null for garbage input rather than defaulting to zero", () => {
    const ui = { ...emptyMonetaryUiState("exact"), exactValue: "não é número" };
    expect(monetaryUiToResponseState(ui)).toBeNull();
  });
});

describe("responseStateToMonetaryUi — round trip for resuming a draft", () => {
  it("informed", () => {
    const ui = responseStateToMonetaryUi({ kind: "informed", value: toCents(500_000) });
    expect(ui.mode).toBe("exact");
    expect(monetaryUiToResponseState(ui)).toEqual({ kind: "informed", value: 500_000 });
  });

  it("estimated typed", () => {
    const ui = responseStateToMonetaryUi({
      kind: "estimated",
      origin: "typed",
      value: toCents(150_000),
    });
    expect(ui.mode).toBe("approximate");
    expect(monetaryUiToResponseState(ui)).toEqual({
      kind: "estimated",
      origin: "typed",
      value: 150_000,
    });
  });

  it("estimated from a closed range preserves min/max", () => {
    const ui = responseStateToMonetaryUi({
      kind: "estimated",
      origin: "range",
      value: toCents(150_000),
      range: { min: toCents(100_000), max: toCents(200_000) },
    });
    expect(ui.mode).toBe("range");
    expect(ui.rangeMax).not.toBe("");
  });

  it("open range preserves the empty max", () => {
    const ui = responseStateToMonetaryUi({ kind: "range", min: toCents(500_000), max: null });
    expect(ui.mode).toBe("range");
    expect(ui.rangeMax).toBe("");
  });

  it("unknown and zero_confirmed round-trip", () => {
    expect(responseStateToMonetaryUi({ kind: "unknown" }).mode).toBe("unknown");
    expect(responseStateToMonetaryUi({ kind: "zero_confirmed" }).mode).toBe("zero");
  });

  it("undefined/unanswered falls back to the empty exact state", () => {
    expect(responseStateToMonetaryUi(undefined).mode).toBe("exact");
    expect(responseStateToMonetaryUi({ kind: "unanswered" }).mode).toBe("exact");
  });
});
