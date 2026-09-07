import { and, eq } from "drizzle-orm";
import { goals } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

export interface GoalRow {
  id: string;
  establishmentId: string;
  periodType: "month";
  periodStart: string;
  profitGoalCents: bigint | null;
  revenueGoalCents: bigint | null;
  marginGoalBps: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalFields {
  profitGoalCents: bigint | null;
  revenueGoalCents: bigint | null;
  marginGoalBps: number | null;
}

export async function findGoal(
  db: Executor,
  input: { establishmentId: string; periodStart: string },
): Promise<GoalRow | null> {
  const [row] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.establishmentId, input.establishmentId), eq(goals.periodStart, input.periodStart)))
    .limit(1);
  return (row as GoalRow | undefined) ?? null;
}

/** Creates or replaces the one goal for (establishment, month) — no optimistic lock, see schema note. */
export async function upsertGoal(
  db: Executor,
  input: { establishmentId: string; periodStart: string } & GoalFields,
): Promise<GoalRow> {
  const [row] = await db
    .insert(goals)
    .values({
      establishmentId: input.establishmentId,
      periodStart: input.periodStart,
      profitGoalCents: input.profitGoalCents,
      revenueGoalCents: input.revenueGoalCents,
      marginGoalBps: input.marginGoalBps,
    })
    .onConflictDoUpdate({
      target: [goals.establishmentId, goals.periodType, goals.periodStart],
      set: {
        profitGoalCents: input.profitGoalCents,
        revenueGoalCents: input.revenueGoalCents,
        marginGoalBps: input.marginGoalBps,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row as GoalRow;
}
