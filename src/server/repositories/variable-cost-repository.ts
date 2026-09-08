import { and, eq, gte, lte } from "drizzle-orm";
import { variableCosts } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

export interface VariableCostRow {
  id: string;
  establishmentId: string;
  costDate: string;
  categoryId: string;
  amountCents: bigint;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function insertVariableCost(
  db: Executor,
  input: { establishmentId: string; costDate: string; categoryId: string; amountCents: bigint; note?: string | null },
): Promise<VariableCostRow> {
  const [row] = await db
    .insert(variableCosts)
    .values({ ...input, note: input.note ?? null })
    .returning();
  return row as VariableCostRow;
}

export async function listVariableCostsInRange(
  db: Executor,
  input: { establishmentId: string; fromDate: string; toDate: string },
): Promise<VariableCostRow[]> {
  const rows = await db
    .select()
    .from(variableCosts)
    .where(
      and(
        eq(variableCosts.establishmentId, input.establishmentId),
        gte(variableCosts.costDate, input.fromDate),
        lte(variableCosts.costDate, input.toDate),
      ),
    );
  return rows as VariableCostRow[];
}

/** True if a row for that establishment was actually deleted. */
export async function deleteVariableCost(
  db: Executor,
  input: { id: string; establishmentId: string },
): Promise<boolean> {
  const rows = await db
    .delete(variableCosts)
    .where(and(eq(variableCosts.id, input.id), eq(variableCosts.establishmentId, input.establishmentId)))
    .returning({ id: variableCosts.id });
  return rows.length > 0;
}
