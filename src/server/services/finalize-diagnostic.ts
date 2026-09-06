import { calculateProfit } from "@/domain/diagnostic/calculate-profit";
import { FORMULA_VERSION } from "@/domain/diagnostic/constants";
import { generateResultToken } from "@/domain/token/secrets";
import { buildDiagnosticInput, type AnswerRow } from "@/lib/validation/answer-codec";
import { ALL_FIELD_KEYS, type FinalizePayload } from "@/lib/validation/diagnostic-schemas";
import { getDb } from "@/server/db/client";
import { ApiError } from "@/server/http/errors";
import {
  findByIdForUpdate,
  insertResult,
  listAnswers,
  markCompleted,
} from "@/server/repositories/diagnostic-repository";
import { insertConsent, insertLead } from "@/server/repositories/lead-repository";
import { assertSessionOwns } from "./diagnostic-session";
import { projectResultColumns } from "./result-projection";

export interface FinalizeOutcome {
  resultToken: string;
  /** True when this call replayed an already-finalized diagnostic. */
  alreadyFinalized: boolean;
}

/**
 * Closes a diagnostic: one transaction that either produces exactly one
 * lead, one consent, one result and one token — or leaves the database
 * untouched.
 *
 * Concurrency and retries are handled by two mechanisms working together:
 * `SELECT ... FOR UPDATE` serializes simultaneous calls on the same
 * diagnostic, and `finalize_idempotency_key` (UNIQUE) makes a replay
 * recognizable. A double click therefore doesn't duplicate anything: the
 * second call finds the diagnostic already completed under the same key
 * and returns the same token.
 */
export async function finalizeDiagnostic(
  id: string,
  sessionSecret: string | null,
  payload: FinalizePayload,
  consentTextVersionFallback: string,
): Promise<FinalizeOutcome> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const diagnostic = assertSessionOwns(await findByIdForUpdate(tx, id), sessionSecret);

    if (diagnostic.status === "completed") {
      if (
        diagnostic.finalizeIdempotencyKey === payload.idempotencyKey &&
        diagnostic.resultToken
      ) {
        return { resultToken: diagnostic.resultToken, alreadyFinalized: true };
      }
      throw new ApiError(
        "already_completed",
        "Este diagnóstico já foi concluído. Crie uma revisão para refazê-lo.",
      );
    }

    if (diagnostic.answersVersion !== payload.expectedVersion) {
      throw new ApiError(
        "version_conflict",
        "Suas respostas estão desatualizadas. Recarregue antes de concluir.",
        { currentVersion: diagnostic.answersVersion },
      );
    }

    const rows = await listAnswers(tx, id);
    assertMinimumCompleteness(rows);

    // The financial rules stay entirely in the domain: this service only
    // assembles the normalized input and stores what comes back.
    const input = buildDiagnosticInput(rows);
    const result = calculateProfit(input);

    const lead = await insertLead(tx, {
      name: payload.contact.name,
      whatsapp: payload.contact.whatsapp,
    });

    await insertConsent(tx, {
      leadId: lead.id,
      consentTextVersion: payload.contact.consentTextVersion || consentTextVersionFallback,
      marketingOptIn: payload.contact.marketingOptIn,
    });

    const resultToken = generateResultToken();

    await insertResult(tx, {
      diagnosticId: id,
      formulaVersion: FORMULA_VERSION,
      inputSnapshot: input,
      outputSnapshot: result,
      ...projectResultColumns(result),
    });

    await markCompleted(tx, {
      id,
      leadId: lead.id,
      resultToken,
      finalizeIdempotencyKey: payload.idempotencyKey,
    });

    return { resultToken, alreadyFinalized: false };
  });
}

/**
 * Minimum completeness: every canonical field must have been *answered* —
 * in any of the six states, "não sei" included. An unknown cost is a valid
 * answer that yields an unavailable profit (never a zero); what blocks
 * finalizing is a step the user never reached at all.
 */
export function assertMinimumCompleteness(rows: readonly AnswerRow[]): void {
  const present = new Set(rows.map((row) => row.fieldKey));
  const missing = ALL_FIELD_KEYS.filter((key) => !present.has(key));

  if (missing.length > 0) {
    throw new ApiError(
      "incomplete_diagnostic",
      "Ainda faltam etapas do diagnóstico para concluir.",
      { missingFields: missing },
    );
  }
}
