import { getDb } from "@/server/db/client";
import { findById, listAnswers } from "@/server/repositories/diagnostic-repository";
import type { AnswerRow } from "@/lib/validation/answer-codec";
import { columnsToMoneyAnswer, columnsToOrderAnswer } from "@/lib/validation/answer-codec";
import { assertSessionOwns } from "./diagnostic-session";

export interface DraftView {
  id: string;
  status: "draft" | "completed";
  answersVersion: number;
  deliveryType: string | null;
  mainChannel: string | null;
  /** How the tax amount splits between fixed and variable, if known. */
  taxClassification: string | null;
  sourceDiagnosticId: string | null;
  completedAt: string | null;
  answers: Record<string, unknown>;
}

/**
 * Reads a draft back for the browser that owns it — this is what makes
 * "retomar de onde parou" work. The session hash and any secret material
 * are deliberately absent from the response shape.
 */
export async function getDraft(id: string, sessionSecret: string | null): Promise<DraftView> {
  const db = getDb();
  const diagnostic = assertSessionOwns(await findById(db, id), sessionSecret);
  const rows = await listAnswers(db, id);

  return {
    id: diagnostic.id,
    status: diagnostic.status,
    answersVersion: diagnostic.answersVersion,
    deliveryType: diagnostic.deliveryType,
    mainChannel: diagnostic.mainChannel,
    // Not an answer of its own: it qualifies the taxes answer, so it's
    // surfaced beside the answers rather than inside them.
    taxClassification: rows.find((row) => row.fieldKey === "taxes")?.valueText ?? null,
    sourceDiagnosticId: diagnostic.sourceDiagnosticId,
    completedAt: diagnostic.completedAt?.toISOString() ?? null,
    answers: toAnswersView(rows),
  };
}

function toAnswersView(rows: readonly AnswerRow[]): Record<string, unknown> {
  const view: Record<string, unknown> = {};
  for (const row of rows) {
    view[row.fieldKey] =
      row.fieldKey === "orders" ? columnsToOrderAnswer(row) : columnsToMoneyAnswer(row);
  }
  return view;
}
