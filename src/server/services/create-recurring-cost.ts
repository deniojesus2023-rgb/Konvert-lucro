import { getDb } from "@/server/db/client";
import { centsToDb, centsFromDb } from "@/server/db/money-codec";
import { assertMembership } from "@/server/services/establishment-membership";
import { findOrCreateCostCategory } from "@/server/repositories/cost-category-repository";
import { insertRecurringCost, type RecurringCostRow } from "@/server/repositories/recurring-cost-repository";
import type { RecurringCostPayload } from "@/lib/validation/tracking-schemas";

export interface RecurringCostView {
  id: string;
  name: string;
  amountCents: number;
  frequency: "monthly" | "weekly";
  startDate: string;
  endDate: string | null;
}

function toView(row: RecurringCostRow): RecurringCostView {
  return {
    id: row.id,
    name: row.name,
    amountCents: centsFromDb(row.amountCents) ?? 0,
    frequency: row.frequency,
    startDate: row.startDate,
    endDate: row.endDate,
  };
}

export async function createRecurringCost(
  establishmentId: string,
  userId: string,
  payload: RecurringCostPayload,
): Promise<RecurringCostView> {
  const db = getDb();

  return db.transaction(async (tx) => {
    await assertMembership(tx, { establishmentId, userId });

    const category = await findOrCreateCostCategory(tx, {
      establishmentId,
      name: payload.categoryName,
      kind: "recurring",
    });

    const amountCents = centsToDb(payload.amountCents);
    if (amountCents === null) throw new Error("Valor do custo recorrente ausente");

    const row = await insertRecurringCost(tx, {
      establishmentId,
      categoryId: category.id,
      name: payload.name,
      amountCents,
      frequency: payload.frequency,
      startDate: payload.startDate,
      endDate: payload.endDate ?? null,
    });

    return toView(row);
  });
}
