import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { dailyEntries } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

export interface DailyEntryRow {
  id: string;
  establishmentId: string;
  entryDate: string;
  salesChannelId: string | null;
  grossRevenueCents: bigint;
  ordersCount: number;
  discountsCents: bigint;
  cancellationsCents: bigint;
  knownFeesCents: bigint;
  entriesVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyEntryFields {
  grossRevenueCents: bigint;
  ordersCount: number;
  discountsCents: bigint;
  cancellationsCents: bigint;
  knownFeesCents: bigint;
}

export async function findDailyEntry(
  db: Executor,
  input: { establishmentId: string; entryDate: string; salesChannelId: string | null },
): Promise<DailyEntryRow | null> {
  const [row] = await db
    .select()
    .from(dailyEntries)
    .where(
      and(
        eq(dailyEntries.establishmentId, input.establishmentId),
        eq(dailyEntries.entryDate, input.entryDate),
        input.salesChannelId === null
          ? isNull(dailyEntries.salesChannelId)
          : eq(dailyEntries.salesChannelId, input.salesChannelId),
      ),
    )
    .limit(1);
  return (row as DailyEntryRow | undefined) ?? null;
}

/**
 * Creates a new daily entry, or — if one already exists for this
 * (establishment, date, channel) — updates it with an optimistic-lock
 * check on `entriesVersion`, mirroring `bumpAnswersVersion`. Returns the
 * new version, or `null` if an update's expected version was stale.
 */
export async function insertDailyEntry(
  db: Executor,
  input: { establishmentId: string; entryDate: string; salesChannelId: string | null } & DailyEntryFields,
): Promise<DailyEntryRow> {
  const [row] = await db
    .insert(dailyEntries)
    .values({
      establishmentId: input.establishmentId,
      entryDate: input.entryDate,
      salesChannelId: input.salesChannelId,
      grossRevenueCents: input.grossRevenueCents,
      ordersCount: input.ordersCount,
      discountsCents: input.discountsCents,
      cancellationsCents: input.cancellationsCents,
      knownFeesCents: input.knownFeesCents,
      entriesVersion: 0,
    })
    .returning();
  return row as DailyEntryRow;
}

export async function updateDailyEntry(
  db: Executor,
  input: { id: string; expectedVersion: number } & DailyEntryFields,
): Promise<number | null> {
  const [row] = await db
    .update(dailyEntries)
    .set({
      grossRevenueCents: input.grossRevenueCents,
      ordersCount: input.ordersCount,
      discountsCents: input.discountsCents,
      cancellationsCents: input.cancellationsCents,
      knownFeesCents: input.knownFeesCents,
      entriesVersion: input.expectedVersion + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(dailyEntries.id, input.id), eq(dailyEntries.entriesVersion, input.expectedVersion)))
    .returning({ entriesVersion: dailyEntries.entriesVersion });
  return row?.entriesVersion ?? null;
}

export async function listDailyEntriesInRange(
  db: Executor,
  input: { establishmentId: string; fromDate: string; toDate: string },
): Promise<DailyEntryRow[]> {
  const rows = await db
    .select()
    .from(dailyEntries)
    .where(
      and(
        eq(dailyEntries.establishmentId, input.establishmentId),
        gte(dailyEntries.entryDate, input.fromDate),
        lte(dailyEntries.entryDate, input.toDate),
      ),
    );
  return rows as DailyEntryRow[];
}
