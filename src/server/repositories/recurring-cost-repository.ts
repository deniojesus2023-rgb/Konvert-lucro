import { and, eq, lte, or, isNull, gte } from "drizzle-orm";
import { recurringCosts } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

export interface RecurringCostRow {
  id: string;
  establishmentId: string;
  categoryId: string;
  name: string;
  amountCents: bigint;
  frequency: "monthly" | "weekly";
  startDate: string;
  endDate: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function insertRecurringCost(
  db: Executor,
  input: {
    establishmentId: string;
    categoryId: string;
    name: string;
    amountCents: bigint;
    frequency: "monthly" | "weekly";
    startDate: string;
    endDate?: string | null;
  },
): Promise<RecurringCostRow> {
  const [row] = await db
    .insert(recurringCosts)
    .values({ ...input, endDate: input.endDate ?? null })
    .returning();
  return row as RecurringCostRow;
}

/**
 * Every active recurring cost whose range could overlap `[fromDate,
 * toDate]` — the caller (the tracking engine) does the exact day-level
 * proration; this just narrows to candidates cheaply in SQL.
 */
export async function listActiveRecurringCostsOverlapping(
  db: Executor,
  input: { establishmentId: string; fromDate: string; toDate: string },
): Promise<RecurringCostRow[]> {
  const rows = await db
    .select()
    .from(recurringCosts)
    .where(
      and(
        eq(recurringCosts.establishmentId, input.establishmentId),
        eq(recurringCosts.active, true),
        lte(recurringCosts.startDate, input.toDate),
        or(isNull(recurringCosts.endDate), gte(recurringCosts.endDate, input.fromDate)),
      ),
    );
  return rows as RecurringCostRow[];
}

export async function listRecurringCosts(db: Executor, establishmentId: string): Promise<RecurringCostRow[]> {
  const rows = await db.select().from(recurringCosts).where(eq(recurringCosts.establishmentId, establishmentId));
  return rows as RecurringCostRow[];
}

/** True if a row for that establishment was actually deactivated. */
export async function deactivateRecurringCost(
  db: Executor,
  input: { id: string; establishmentId: string },
): Promise<boolean> {
  const rows = await db
    .update(recurringCosts)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(recurringCosts.id, input.id), eq(recurringCosts.establishmentId, input.establishmentId)))
    .returning({ id: recurringCosts.id });
  return rows.length > 0;
}
