import type { Cents } from "@/domain/money/cents";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import type { DiagnosticInput } from "@/domain/diagnostic/types";
import type { TaxClassification } from "@/domain/diagnostic/constants";
import { centsFromDb, centsToDb, countFromDb } from "@/server/db/money-codec";
import type { FieldKey } from "./diagnostic-schemas";

/**
 * Translation between the wire/database shape of an answer and the
 * domain's `ResponseState`. Shape only — no financial rules live here.
 *
 * The six states must survive a round trip intact: a typed estimate must
 * not come back as a range-derived one, an open range must not come back
 * as a closed one, and "unknown"/"unanswered" must never come back as a
 * zero.
 */

export interface AnswerColumns {
  responseKind: "informed" | "range" | "estimated" | "unknown" | "zero_confirmed" | "unanswered";
  estimateOrigin: "typed" | "range" | null;
  valueCents: bigint | null;
  valueNumber: bigint | null;
  rangeMinCents: bigint | null;
  rangeMaxCents: bigint | null;
  valueText: string | null;
}

export interface AnswerRow extends AnswerColumns {
  fieldKey: string;
}

/** Wire answer (already validated by Zod) → database columns. */
export function moneyAnswerToColumns(
  answer: ResponseState<number>,
  valueText: string | null = null,
): AnswerColumns {
  const base: AnswerColumns = {
    responseKind: answer.kind,
    estimateOrigin: null,
    valueCents: null,
    valueNumber: null,
    rangeMinCents: null,
    rangeMaxCents: null,
    valueText,
  };

  switch (answer.kind) {
    case "informed":
      return { ...base, valueCents: centsToDb(answer.value) };
    case "range":
      return {
        ...base,
        rangeMinCents: centsToDb(answer.min),
        // Stays null for an open range: there is no upper bound to store,
        // and no midpoint may be invented from it later.
        rangeMaxCents: centsToDb(answer.max),
      };
    case "estimated":
      return answer.origin === "range"
        ? {
            ...base,
            estimateOrigin: "range",
            valueCents: centsToDb(answer.value),
            rangeMinCents: centsToDb(answer.range.min),
            rangeMaxCents: centsToDb(answer.range.max),
          }
        : { ...base, estimateOrigin: "typed", valueCents: centsToDb(answer.value) };
    default:
      // unknown | zero_confirmed | unanswered carry no value at all.
      return base;
  }
}

export function orderAnswerToColumns(answer: ResponseState<number>): AnswerColumns {
  const base: AnswerColumns = {
    responseKind: answer.kind,
    estimateOrigin: null,
    valueCents: null,
    valueNumber: null,
    rangeMinCents: null,
    rangeMaxCents: null,
    valueText: null,
  };

  if (answer.kind === "informed") {
    return { ...base, valueNumber: BigInt(answer.value) };
  }
  return base;
}

/** Database columns → domain `ResponseState<Cents>`. */
export function columnsToMoneyAnswer(row: AnswerColumns): ResponseState<Cents> {
  switch (row.responseKind) {
    case "informed":
      return { kind: "informed", value: requireCents(row.valueCents, "value_cents") };
    case "range":
      return {
        kind: "range",
        min: requireCents(row.rangeMinCents, "range_min_cents"),
        max: centsFromDb(row.rangeMaxCents),
      };
    case "estimated": {
      const value = requireCents(row.valueCents, "value_cents");
      if (row.estimateOrigin === "range") {
        return {
          kind: "estimated",
          origin: "range",
          value,
          range: {
            min: requireCents(row.rangeMinCents, "range_min_cents"),
            max: requireCents(row.rangeMaxCents, "range_max_cents"),
          },
        };
      }
      return { kind: "estimated", origin: "typed", value };
    }
    case "unknown":
      return { kind: "unknown" };
    case "zero_confirmed":
      return { kind: "zero_confirmed" };
    default:
      return { kind: "unanswered" };
  }
}

export function columnsToOrderAnswer(row: AnswerColumns): ResponseState<number> {
  switch (row.responseKind) {
    case "informed": {
      const value = countFromDb(row.valueNumber);
      if (value === null) {
        throw new Error("Resposta de pedidos marcada como informada mas sem valor");
      }
      return { kind: "informed", value };
    }
    case "zero_confirmed":
      return { kind: "zero_confirmed" };
    case "unknown":
      return { kind: "unknown" };
    default:
      return { kind: "unanswered" };
  }
}

function requireCents(value: bigint | null, column: string): Cents {
  const parsed = centsFromDb(value);
  if (parsed === null) {
    throw new Error(`Coluna ${column} obrigatória para este tipo de resposta está nula`);
  }
  return parsed;
}

const UNANSWERED = { kind: "unanswered" } as const;

/**
 * Assembles the normalized `DiagnosticInput` handed to `calculateProfit`.
 * A field with no stored row becomes `unanswered` — never zero.
 */
export function buildDiagnosticInput(rows: readonly AnswerRow[]): DiagnosticInput {
  const byKey = new Map(rows.map((row) => [row.fieldKey, row]));

  const money = (key: FieldKey): ResponseState<Cents> => {
    const row = byKey.get(key);
    return row ? columnsToMoneyAnswer(row) : UNANSWERED;
  };

  const taxesRow = byKey.get("taxes");
  const ordersRow = byKey.get("orders");

  return {
    revenue: money("revenue"),
    costs: {
      production: money("cost_production"),
      fees: money("cost_fees"),
      delivery: money("cost_delivery"),
      fixedStructure: money("cost_fixed_structure"),
    },
    taxes: {
      classification: readTaxClassification(taxesRow?.valueText ?? null),
      state: taxesRow ? columnsToMoneyAnswer(taxesRow) : UNANSWERED,
    },
    orders: ordersRow ? columnsToOrderAnswer(ordersRow) : UNANSWERED,
    goal: money("goal"),
  };
}

/**
 * A tax amount whose split between fixed and variable is unknown can still
 * produce a profit figure — only the break-even is withheld. So an absent
 * or unrecognized classification degrades to "unclassified" rather than
 * guessing one.
 */
function readTaxClassification(value: string | null): TaxClassification {
  return value === "fixed" || value === "variable" ? value : "unclassified";
}
