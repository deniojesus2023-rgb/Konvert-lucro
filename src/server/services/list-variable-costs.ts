import { getDb } from "@/server/db/client";
import { centsFromDb } from "@/server/db/money-codec";
import { assertMembership } from "@/server/services/establishment-membership";
import { listCostCategories } from "@/server/repositories/cost-category-repository";
import { deleteVariableCost, listVariableCostsInRange } from "@/server/repositories/variable-cost-repository";
import type { VariableCostView } from "@/server/services/create-variable-cost";

export async function listVariableCostsForRange(
  establishmentId: string,
  userId: string,
  range: { fromDate: string; toDate: string },
): Promise<VariableCostView[]> {
  const db = getDb();
  await assertMembership(db, { establishmentId, userId });

  const [rows, categories] = await Promise.all([
    listVariableCostsInRange(db, { establishmentId, ...range }),
    listCostCategories(db, establishmentId),
  ]);

  const nameById = new Map(categories.map((category) => [category.id, category.name]));

  return rows.map((row) => ({
    id: row.id,
    costDate: row.costDate,
    categoryName: nameById.get(row.categoryId) ?? "Outros",
    amountCents: centsFromDb(row.amountCents) ?? 0,
    note: row.note,
  }));
}

export async function removeVariableCost(establishmentId: string, userId: string, costId: string): Promise<void> {
  const db = getDb();
  await assertMembership(db, { establishmentId, userId });
  await deleteVariableCost(db, { id: costId, establishmentId });
}
