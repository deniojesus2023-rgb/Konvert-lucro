import type { ResponseState } from "@/domain/diagnostic/response-state";
import type { PatchAnswersPayload } from "@/lib/validation/diagnostic-schemas";
import {
  moneyAnswerToColumns,
  orderAnswerToColumns,
  type AnswerRow,
} from "@/lib/validation/answer-codec";
import { getDb } from "@/server/db/client";
import { ApiError, notFound } from "@/server/http/errors";
import {
  bumpAnswersVersion,
  findById,
  listAnswers,
  updateProfile,
  upsertAnswer,
} from "@/server/repositories/diagnostic-repository";
import { assertSessionOwns } from "./diagnostic-session";

/**
 * Saves a step of the diagnostic under optimistic locking.
 *
 * The whole operation is one transaction, and the version check lives in
 * the UPDATE's WHERE clause (see `bumpAnswersVersion`). Two requests that
 * start from the same version therefore can't both succeed: PostgreSQL
 * serializes them on the row lock and the late one matches zero rows, so a
 * delayed request can never overwrite a newer answer. The version is
 * incremented exactly once per accepted request, no matter how many fields
 * it carries.
 */
export async function updateAnswers(
  id: string,
  sessionSecret: string | null,
  payload: PatchAnswersPayload,
): Promise<{ answersVersion: number }> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const diagnostic = assertSessionOwns(await findById(tx, id), sessionSecret);

    if (diagnostic.status === "completed") {
      throw new ApiError(
        "already_completed",
        "Este diagnóstico já foi concluído. Crie uma revisão para alterá-lo.",
      );
    }

    const newVersion = await bumpAnswersVersion(tx, {
      id,
      expectedVersion: payload.expectedVersion,
    });

    if (newVersion === null) {
      // Nothing matched: either someone else advanced the version first or
      // the diagnostic was completed in the meantime. Re-read to report
      // precisely which, and hand back the current version so the client
      // can refetch and retry.
      const current = await findById(tx, id);
      if (!current) throw notFound();
      if (current.status === "completed") {
        throw new ApiError(
          "already_completed",
          "Este diagnóstico já foi concluído. Crie uma revisão para alterá-lo.",
        );
      }
      throw new ApiError(
        "version_conflict",
        "Suas respostas estão desatualizadas. Recarregue antes de salvar de novo.",
        { currentVersion: current.answersVersion },
      );
    }

    const existing = await listAnswers(tx, id);
    const existingTaxText = findTaxClassificationText(existing);

    if (payload.profile) {
      await updateProfile(tx, {
        id,
        deliveryType: payload.profile.deliveryType ?? undefined,
        mainChannel: payload.profile.mainChannel ?? undefined,
      });
    }

    const answers = payload.answers ?? {};

    for (const [fieldKey, answer] of Object.entries(answers)) {
      if (!answer) continue;

      if (fieldKey === "orders") {
        await upsertAnswer(tx, {
          diagnosticId: id,
          fieldKey,
          columns: orderAnswerToColumns(answer as ResponseState<number>),
        });
        continue;
      }

      // The tax classification rides along on the taxes row. An update
      // that doesn't mention it must not erase the one already stored.
      const valueText =
        fieldKey === "taxes" ? (payload.taxClassification ?? existingTaxText) : null;

      await upsertAnswer(tx, {
        diagnosticId: id,
        fieldKey,
        columns: moneyAnswerToColumns(answer as ResponseState<number>, valueText),
      });
    }

    // Classification changed on its own, without a new taxes amount.
    if (payload.taxClassification && !("taxes" in answers)) {
      const currentTaxes = existing.find((row) => row.fieldKey === "taxes");
      await upsertAnswer(tx, {
        diagnosticId: id,
        fieldKey: "taxes",
        columns: {
          responseKind: currentTaxes?.responseKind ?? "unanswered",
          estimateOrigin: currentTaxes?.estimateOrigin ?? null,
          valueCents: currentTaxes?.valueCents ?? null,
          valueNumber: currentTaxes?.valueNumber ?? null,
          rangeMinCents: currentTaxes?.rangeMinCents ?? null,
          rangeMaxCents: currentTaxes?.rangeMaxCents ?? null,
          valueText: payload.taxClassification,
        },
      });
    }

    return { answersVersion: newVersion };
  });
}

function findTaxClassificationText(rows: readonly AnswerRow[]): string | null {
  return rows.find((row) => row.fieldKey === "taxes")?.valueText ?? null;
}
