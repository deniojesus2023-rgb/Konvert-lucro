import { and, eq, isNull, or } from "drizzle-orm";
import { costCategories } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

export interface CostCategoryRow {
  id: string;
  establishmentId: string | null;
  name: string;
  kind: "variable" | "recurring";
  createdAt: Date;
}

/** System-default variable-cost categories, shared by every establishment. */
export const DEFAULT_VARIABLE_COST_CATEGORY_NAMES = ["Embalagem", "Ingredientes extras", "Manutenção", "Outros"] as const;

export async function insertCostCategory(
  db: Executor,
  input: { establishmentId: string | null; name: string; kind: "variable" | "recurring" },
): Promise<CostCategoryRow> {
  const [row] = await db.insert(costCategories).values(input).returning();
  return row;
}

/** Categories visible to an establishment: its own plus the system defaults (`establishmentId IS NULL`). */
export async function listCostCategories(db: Executor, establishmentId: string): Promise<CostCategoryRow[]> {
  return db
    .select()
    .from(costCategories)
    .where(or(eq(costCategories.establishmentId, establishmentId), isNull(costCategories.establishmentId)));
}

export async function findOrCreateCostCategory(
  db: Executor,
  input: { establishmentId: string; name: string; kind: "variable" | "recurring" },
): Promise<CostCategoryRow> {
  const where = and(
    eq(costCategories.establishmentId, input.establishmentId),
    eq(costCategories.name, input.name),
    eq(costCategories.kind, input.kind),
  );

  const [existing] = await db.select().from(costCategories).where(where).limit(1);
  if (existing) return existing;

  const [row] = await db
    .insert(costCategories)
    .values(input)
    .onConflictDoNothing({
      target: [costCategories.establishmentId, costCategories.name, costCategories.kind],
    })
    .returning();
  if (row) return row;

  // Lost the insert race to a concurrent request — the row now exists.
  const [row2] = await db.select().from(costCategories).where(where).limit(1);
  if (!row2) throw new Error("Falha ao criar ou encontrar a categoria de custo");
  return row2;
}
