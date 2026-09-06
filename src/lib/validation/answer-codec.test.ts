import { describe, expect, it } from "vitest";
import { toCents } from "@/domain/money/cents";
import { estimateFromRange, estimateTyped } from "@/domain/diagnostic/response-state";
import {
  buildDiagnosticInput,
  columnsToMoneyAnswer,
  columnsToOrderAnswer,
  moneyAnswerToColumns,
  orderAnswerToColumns,
  type AnswerRow,
} from "./answer-codec";

function roundTrip(answer: Parameters<typeof moneyAnswerToColumns>[0]) {
  return columnsToMoneyAnswer(moneyAnswerToColumns(answer));
}

describe("money answer round trip — the six states survive persistence", () => {
  it("informed", () => {
    const answer = { kind: "informed" as const, value: toCents(5_000_00) };
    expect(roundTrip(answer)).toEqual(answer);
  });

  it("typed estimate keeps origin 'typed' and gains no range", () => {
    const answer = estimateTyped(toCents(1500));
    expect(roundTrip(answer)).toEqual({ kind: "estimated", origin: "typed", value: 1500 });
  });

  it("range-derived estimate keeps its origin AND its original bounds", () => {
    const answer = estimateFromRange(toCents(1000), toCents(2000));
    expect(roundTrip(answer)).toEqual({
      kind: "estimated",
      origin: "range",
      value: 1500,
      range: { min: 1000, max: 2000 },
    });
  });

  it("open range stays open — no midpoint is invented on the way back", () => {
    const answer = { kind: "range" as const, min: toCents(5_000_00), max: null };
    const restored = roundTrip(answer);
    expect(restored).toEqual({ kind: "range", min: 500000, max: null });
    expect(restored.kind).not.toBe("estimated");
  });

  it("closed range stays a range (not silently promoted to an estimate)", () => {
    const answer = { kind: "range" as const, min: toCents(1000), max: toCents(2000) };
    expect(roundTrip(answer)).toEqual({ kind: "range", min: 1000, max: 2000 });
  });

  it("unknown stays unknown — never a zero", () => {
    const columns = moneyAnswerToColumns({ kind: "unknown" });
    expect(columns.valueCents).toBeNull();
    expect(roundTrip({ kind: "unknown" })).toEqual({ kind: "unknown" });
  });

  it("unanswered stays unanswered — never a zero", () => {
    expect(roundTrip({ kind: "unanswered" })).toEqual({ kind: "unanswered" });
  });

  it("zero_confirmed stays the only legitimate zero", () => {
    const columns = moneyAnswerToColumns({ kind: "zero_confirmed" });
    expect(columns.valueCents).toBeNull();
    expect(roundTrip({ kind: "zero_confirmed" })).toEqual({ kind: "zero_confirmed" });
  });

  it("stores money as bigint, never as a float", () => {
    const columns = moneyAnswerToColumns({ kind: "informed", value: toCents(1_000_000_000) });
    expect(typeof columns.valueCents).toBe("bigint");
    expect(columns.valueCents).toBe(1_000_000_000n);
  });
});

describe("order answer round trip", () => {
  it("informed count", () => {
    const columns = orderAnswerToColumns({ kind: "informed", value: 1000 });
    expect(columns.valueNumber).toBe(1000n);
    expect(columnsToOrderAnswer(columns)).toEqual({ kind: "informed", value: 1000 });
  });

  it("unknown count stays unknown", () => {
    expect(columnsToOrderAnswer(orderAnswerToColumns({ kind: "unknown" }))).toEqual({
      kind: "unknown",
    });
  });
});

describe("buildDiagnosticInput", () => {
  const row = (fieldKey: string, columns: Partial<AnswerRow>): AnswerRow => ({
    fieldKey,
    responseKind: "unanswered",
    estimateOrigin: null,
    valueCents: null,
    valueNumber: null,
    rangeMinCents: null,
    rangeMaxCents: null,
    valueText: null,
    ...columns,
  });

  it("maps every field key onto the domain input shape", () => {
    const input = buildDiagnosticInput([
      row("revenue", { responseKind: "informed", valueCents: 5_000_000n }),
      row("cost_production", { responseKind: "informed", valueCents: 1_500_000n }),
      row("cost_fees", { responseKind: "informed", valueCents: 1_000_000n }),
      row("cost_delivery", { responseKind: "informed", valueCents: 500_000n }),
      row("cost_fixed_structure", { responseKind: "informed", valueCents: 1_000_000n }),
      row("taxes", { responseKind: "zero_confirmed", valueText: "variable" }),
      row("orders", { responseKind: "informed", valueNumber: 1000n }),
      row("goal", { responseKind: "informed", valueCents: 500_000n }),
    ]);

    expect(input.revenue).toEqual({ kind: "informed", value: 5_000_000 });
    expect(input.costs.production).toEqual({ kind: "informed", value: 1_500_000 });
    expect(input.costs.fixedStructure).toEqual({ kind: "informed", value: 1_000_000 });
    expect(input.taxes.classification).toBe("variable");
    expect(input.taxes.state).toEqual({ kind: "zero_confirmed" });
    expect(input.orders).toEqual({ kind: "informed", value: 1000 });
    expect(input.goal).toEqual({ kind: "informed", value: 500_000 });
  });

  it("treats a missing row as unanswered — never as zero", () => {
    const input = buildDiagnosticInput([]);
    expect(input.revenue).toEqual({ kind: "unanswered" });
    expect(input.costs.production).toEqual({ kind: "unanswered" });
    expect(input.taxes.state).toEqual({ kind: "unanswered" });
    expect(input.orders).toEqual({ kind: "unanswered" });
  });

  it("degrades an unrecognized tax classification to 'unclassified' rather than guessing", () => {
    const input = buildDiagnosticInput([
      row("taxes", { responseKind: "informed", valueCents: 400_000n, valueText: "sei-la" }),
    ]);
    expect(input.taxes.classification).toBe("unclassified");
  });
});
