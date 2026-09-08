import { getDb } from "@/server/db/client";
import { centsToDb, centsFromDb } from "@/server/db/money-codec";
import { assertMembership } from "@/server/services/establishment-membership";
import { findOrCreateCostCategory } from "@/server/repositories/cost-category-repository";
import { insertVariableCost } from "@/server/repositories/variable-cost-repository";
import type { VariableCostPayload } from "@/lib/validation/tracking-schemas";

export interface VariableCostView {
  id: string;
  costDate: string;
  categoryName: string;
  amountCents: number;
  note: string | null;
}

export async function createVariableCost(
  establishmentId: string,
  userId: string,
  payload: VariableCostPayload,
): Promise<VariableCostView> {
  const db = getDb();

  return db.transaction(async (tx) => {
    await assertMembership(tx, { establishmentId, userId });

    const category = await findOrCreateCostCategory(tx, {
      establishmentId,
      name: payload.categoryName,
      kind: "variable",
    });

    const amountCents = centsToDb(payload.amountCents);
    if (amountCents === null) throw new Error("Valor do custo ausente");

    const row = await insertVariableCost(tx, {
      establishmentId,
      costDate: payload.costDate,
      categoryId: category.id,
      amountCents,
      note: payload.note ?? null,
    });

    return {
      id: row.id,
      costDate: row.costDate,
      categoryName: category.name,
      amountCents: centsFromDb(row.amountCents) ?? 0,
      note: row.note,
    };
  });
}
