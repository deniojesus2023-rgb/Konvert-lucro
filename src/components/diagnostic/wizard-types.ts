import type { Cents } from "@/domain/money/cents";
import type { ResponseState } from "@/domain/diagnostic/response-state";

/** The eight canonical money/order fields, exactly as the API names them. */
export interface DraftAnswers {
  revenue: ResponseState<Cents> | null;
  cost_production: ResponseState<Cents> | null;
  cost_fees: ResponseState<Cents> | null;
  cost_delivery: ResponseState<Cents> | null;
  cost_fixed_structure: ResponseState<Cents> | null;
  taxes: ResponseState<Cents> | null;
  orders: ResponseState<number> | null;
  goal: ResponseState<Cents> | null;
}

export function emptyDraftAnswers(): DraftAnswers {
  return {
    revenue: null,
    cost_production: null,
    cost_fees: null,
    cost_delivery: null,
    cost_fixed_structure: null,
    taxes: null,
    orders: null,
    goal: null,
  };
}

export type TaxClassification = "fixed" | "variable" | "unclassified";

export interface ProfileAnswers {
  deliveryType: string | null;
  mainChannel: string | null;
}

/** A monetary answer is "resolved" (safe to submit) once it isn't null. */
export function isMoneyFieldComplete(state: ResponseState<Cents> | null): boolean {
  return state !== null;
}

/**
 * The taxes field only demands a fixed/variable classification when the
 * amount is actually greater than zero — a `zero_confirmed`/`unknown`
 * answer has nothing to classify.
 */
export function taxesNeedClassification(state: ResponseState<Cents> | null): boolean {
  if (!state) return false;
  if (state.kind === "informed" || state.kind === "estimated") {
    return state.value > 0;
  }
  return false;
}

export const DELIVERY_TYPE_OPTIONS = [
  "Pizzaria",
  "Hamburgueria",
  "Restaurante",
  "Marmitaria",
  "Açaí e sobremesas",
  "Padaria",
  "Outro",
] as const;

export const MAIN_CHANNEL_OPTIONS = [
  "iFood",
  "WhatsApp",
  "Instagram",
  "Site próprio",
  "Telefone",
  "Balcão",
  "Outro",
] as const;

export const TOTAL_STEPS = 8;
