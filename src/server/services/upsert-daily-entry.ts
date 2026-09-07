import { centsFromDb, centsToDb } from "@/server/db/money-codec";
import { getDb } from "@/server/db/client";
import { ApiError } from "@/server/http/errors";
import { assertMembership } from "@/server/services/establishment-membership";
import { findOrCreateSalesChannel } from "@/server/repositories/sales-channel-repository";
import {
  findDailyEntry,
  insertDailyEntry,
  updateDailyEntry,
  type DailyEntryRow,
} from "@/server/repositories/daily-entry-repository";
import type { DailyEntryPayload } from "@/lib/validation/tracking-schemas";

export interface DailyEntryView {
  id: string;
  entryDate: string;
  channelId: string | null;
  grossRevenueCents: number;
  ordersCount: number;
  discountsCents: number;
  cancellationsCents: number;
  knownFeesCents: number;
  entriesVersion: number;
}

/** `payload`'s cents fields are always present (schema-required, not nullable). */
function requiredCentsToDb(value: number): bigint {
  const converted = centsToDb(value);
  if (converted === null) throw new Error("Valor monetário obrigatório ausente");
  return converted;
}

function toView(row: DailyEntryRow): DailyEntryView {
  return {
    id: row.id,
    entryDate: row.entryDate,
    channelId: row.salesChannelId,
    grossRevenueCents: centsFromDb(row.grossRevenueCents) ?? 0,
    ordersCount: row.ordersCount,
    discountsCents: centsFromDb(row.discountsCents) ?? 0,
    cancellationsCents: centsFromDb(row.cancellationsCents) ?? 0,
    knownFeesCents: centsFromDb(row.knownFeesCents) ?? 0,
    entriesVersion: row.entriesVersion,
  };
}

/**
 * Creates or edits the single daily entry for
 * (establishment, entryDate, channel). Editing follows the same
 * optimistic-lock discipline as `updateAnswers`: the caller must send back
 * the version it last read, and a stale version is rejected rather than
 * silently overwritten.
 */
export async function upsertDailyEntry(
  establishmentId: string,
  userId: string,
  payload: DailyEntryPayload,
): Promise<DailyEntryView> {
  const db = getDb();

  return db.transaction(async (tx) => {
    await assertMembership(tx, { establishmentId, userId });

    const salesChannelId = payload.channelName
      ? (await findOrCreateSalesChannel(tx, { establishmentId, name: payload.channelName })).id
      : null;

    const fields = {
      grossRevenueCents: requiredCentsToDb(payload.grossRevenueCents),
      ordersCount: payload.ordersCount,
      discountsCents: requiredCentsToDb(payload.discountsCents),
      cancellationsCents: requiredCentsToDb(payload.cancellationsCents),
      knownFeesCents: requiredCentsToDb(payload.knownFeesCents),
    };

    const existing = await findDailyEntry(tx, { establishmentId, entryDate: payload.entryDate, salesChannelId });

    if (!existing) {
      const row = await insertDailyEntry(tx, {
        establishmentId,
        entryDate: payload.entryDate,
        salesChannelId,
        ...fields,
      });
      return toView(row);
    }

    if (payload.expectedVersion === undefined) {
      throw new ApiError(
        "version_conflict",
        "Já existe um lançamento para esta data e canal. Recarregue para editá-lo.",
        { currentVersion: existing.entriesVersion },
      );
    }

    const newVersion = await updateDailyEntry(tx, {
      id: existing.id,
      expectedVersion: payload.expectedVersion,
      ...fields,
    });

    if (newVersion === null) {
      const current = await findDailyEntry(tx, {
        establishmentId,
        entryDate: payload.entryDate,
        salesChannelId,
      });
      throw new ApiError(
        "version_conflict",
        "Este lançamento foi alterado em outro lugar. Recarregue antes de salvar de novo.",
        { currentVersion: current?.entriesVersion ?? null },
      );
    }

    return toView({ ...existing, ...fields, entriesVersion: newVersion });
  });
}
