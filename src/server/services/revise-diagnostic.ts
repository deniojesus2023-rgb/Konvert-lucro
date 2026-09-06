import { generateSessionSecret, hashSessionSecret } from "@/domain/token/secrets";
import { getDb } from "@/server/db/client";
import { ApiError } from "@/server/http/errors";
import {
  findById,
  insertDraft,
  listAnswers,
  upsertAnswer,
} from "@/server/repositories/diagnostic-repository";
import { assertSessionOwns } from "./diagnostic-session";

export interface RevisionStarted {
  id: string;
  status: "draft";
  answersVersion: number;
  sourceDiagnosticId: string;
  sessionSecret: string;
}

/**
 * Opens a revision of a completed diagnostic.
 *
 * Nothing about the previous diagnostic is touched: its result row, its
 * public token and its answers stay exactly as they were, permanently. The
 * revision is a NEW draft that merely points back at its source, so the
 * old link a user may have already shared keeps resolving to the old
 * numbers.
 *
 * The new draft gets a brand-new session secret and starts at
 * `answersVersion = 0`: the version counter is per-draft optimistic-locking
 * state, not a history counter — the source's own version is frozen
 * alongside its immutable result, and `source_diagnostic_id` is what
 * carries the lineage.
 */
export async function reviseDiagnostic(
  id: string,
  sessionSecret: string | null,
): Promise<RevisionStarted> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const source = assertSessionOwns(await findById(tx, id), sessionSecret);

    if (source.status !== "completed") {
      throw new ApiError(
        "not_completed",
        "Só é possível revisar um diagnóstico já concluído.",
      );
    }

    const newSecret = generateSessionSecret();
    const draft = await insertDraft(tx, {
      draftSessionHash: hashSessionSecret(newSecret),
      sourceDiagnosticId: source.id,
    });

    // Copy the answers so the user revises instead of retyping everything.
    for (const row of await listAnswers(tx, id)) {
      await upsertAnswer(tx, {
        diagnosticId: draft.id,
        fieldKey: row.fieldKey,
        columns: {
          responseKind: row.responseKind,
          estimateOrigin: row.estimateOrigin,
          valueCents: row.valueCents,
          valueNumber: row.valueNumber,
          rangeMinCents: row.rangeMinCents,
          rangeMaxCents: row.rangeMaxCents,
          valueText: row.valueText,
        },
      });
    }

    return {
      id: draft.id,
      status: "draft",
      answersVersion: draft.answersVersion,
      sourceDiagnosticId: source.id,
      sessionSecret: newSecret,
    };
  });
}
