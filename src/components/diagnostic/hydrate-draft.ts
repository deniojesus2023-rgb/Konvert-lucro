import type { Cents } from "@/domain/money/cents";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import type { DraftAnswers } from "./wizard-types";
import { emptyDraftAnswers } from "./wizard-types";
import type { DraftResponse } from "@/lib/client/api";

/**
 * The API already returns each answer in exactly the `ResponseState`
 * shape (it's serialized straight from the domain type on the server), so
 * hydrating local state back from `GET /api/raio-x/[id]` is a direct
 * field-by-field read — never a guess, never a default to zero for a
 * field that simply isn't present yet.
 */
export function hydrateAnswers(apiAnswers: Record<string, unknown>): DraftAnswers {
  const empty = emptyDraftAnswers();
  const read = <T>(key: keyof DraftAnswers): T | null =>
    (apiAnswers[key] as T | undefined) ?? null;

  return {
    revenue: read<ResponseState<Cents>>("revenue") ?? empty.revenue,
    cost_production: read<ResponseState<Cents>>("cost_production") ?? empty.cost_production,
    cost_fees: read<ResponseState<Cents>>("cost_fees") ?? empty.cost_fees,
    cost_delivery: read<ResponseState<Cents>>("cost_delivery") ?? empty.cost_delivery,
    cost_fixed_structure:
      read<ResponseState<Cents>>("cost_fixed_structure") ?? empty.cost_fixed_structure,
    taxes: read<ResponseState<Cents>>("taxes") ?? empty.taxes,
    orders: read<ResponseState<number>>("orders") ?? empty.orders,
    goal: read<ResponseState<Cents>>("goal") ?? empty.goal,
  };
}

export function hydrateProfile(draft: DraftResponse): { deliveryType: string | null; mainChannel: string | null } {
  return { deliveryType: draft.deliveryType, mainChannel: draft.mainChannel };
}
