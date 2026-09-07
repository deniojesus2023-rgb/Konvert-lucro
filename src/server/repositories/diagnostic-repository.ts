import { and, eq, isNull, or, sql, gt } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import {
  diagnosticAnswers,
  diagnosticResults,
  diagnostics,
} from "@/server/db/schema";
import type { AnswerColumns, AnswerRow } from "@/lib/validation/answer-codec";

/** Anything a transaction can run on: the pool or an open transaction. */
export type Executor = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

export interface DiagnosticRow {
  id: string;
  establishmentId: string | null;
  sourceDiagnosticId: string | null;
  draftSessionHash: string;
  leadId: string | null;
  resultToken: string | null;
  status: "draft" | "completed";
  answersVersion: number;
  finalizeIdempotencyKey: string | null;
  deliveryType: string | null;
  mainChannel: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export async function insertDraft(
  db: Executor,
  input: { draftSessionHash: string; sourceDiagnosticId?: string | null },
): Promise<DiagnosticRow> {
  const [row] = await db
    .insert(diagnostics)
    .values({
      draftSessionHash: input.draftSessionHash,
      sourceDiagnosticId: input.sourceDiagnosticId ?? null,
      status: "draft",
      answersVersion: 0,
    })
    .returning();
  return row as DiagnosticRow;
}

export async function findById(db: Executor, id: string): Promise<DiagnosticRow | null> {
  const [row] = await db.select().from(diagnostics).where(eq(diagnostics.id, id)).limit(1);
  return (row as DiagnosticRow | undefined) ?? null;
}

/** Locks the row for the duration of the transaction, serializing concurrent finalizes. */
export async function findByIdForUpdate(
  db: Executor,
  id: string,
): Promise<DiagnosticRow | null> {
  const [row] = await db
    .select()
    .from(diagnostics)
    .where(eq(diagnostics.id, id))
    .limit(1)
    .for("update");
  return (row as DiagnosticRow | undefined) ?? null;
}

/**
 * The optimistic-locking write. The version predicate lives in the WHERE
 * clause, so PostgreSQL — not application code — decides the winner when
 * two requests race. A stale request matches zero rows and is rejected
 * instead of overwriting a newer answer.
 */
export async function bumpAnswersVersion(
  db: Executor,
  input: { id: string; expectedVersion: number },
): Promise<number | null> {
  const [row] = await db
    .update(diagnostics)
    .set({
      answersVersion: sql`${diagnostics.answersVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(diagnostics.id, input.id),
        eq(diagnostics.status, "draft"),
        eq(diagnostics.answersVersion, input.expectedVersion),
      ),
    )
    .returning({ answersVersion: diagnostics.answersVersion });

  return row?.answersVersion ?? null;
}

/** Links a completed diagnostic to the establishment created from it. Additive, idempotent. */
export async function linkEstablishment(
  db: Executor,
  input: { id: string; establishmentId: string },
): Promise<void> {
  await db
    .update(diagnostics)
    .set({ establishmentId: input.establishmentId, updatedAt: new Date() })
    .where(eq(diagnostics.id, input.id));
}

export async function updateProfile(
  db: Executor,
  input: { id: string; deliveryType?: string | null; mainChannel?: string | null },
): Promise<void> {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.deliveryType !== undefined) patch.deliveryType = input.deliveryType;
  if (input.mainChannel !== undefined) patch.mainChannel = input.mainChannel;
  await db.update(diagnostics).set(patch).where(eq(diagnostics.id, input.id));
}

export async function upsertAnswer(
  db: Executor,
  input: { diagnosticId: string; fieldKey: string; columns: AnswerColumns },
): Promise<void> {
  await db
    .insert(diagnosticAnswers)
    .values({
      diagnosticId: input.diagnosticId,
      fieldKey: input.fieldKey,
      ...input.columns,
    })
    .onConflictDoUpdate({
      target: [diagnosticAnswers.diagnosticId, diagnosticAnswers.fieldKey],
      set: { ...input.columns, updatedAt: new Date() },
    });
}

export async function listAnswers(
  db: Executor,
  diagnosticId: string,
): Promise<AnswerRow[]> {
  const rows = await db
    .select({
      fieldKey: diagnosticAnswers.fieldKey,
      responseKind: diagnosticAnswers.responseKind,
      estimateOrigin: diagnosticAnswers.estimateOrigin,
      valueCents: diagnosticAnswers.valueCents,
      valueNumber: diagnosticAnswers.valueNumber,
      rangeMinCents: diagnosticAnswers.rangeMinCents,
      rangeMaxCents: diagnosticAnswers.rangeMaxCents,
      valueText: diagnosticAnswers.valueText,
    })
    .from(diagnosticAnswers)
    .where(eq(diagnosticAnswers.diagnosticId, diagnosticId));

  return rows as AnswerRow[];
}

export async function markCompleted(
  db: Executor,
  input: {
    id: string;
    leadId: string;
    resultToken: string;
    finalizeIdempotencyKey: string;
  },
): Promise<void> {
  const now = new Date();
  await db
    .update(diagnostics)
    .set({
      status: "completed",
      leadId: input.leadId,
      resultToken: input.resultToken,
      finalizeIdempotencyKey: input.finalizeIdempotencyKey,
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(diagnostics.id, input.id));
}

export interface StoredResult {
  formulaVersion: string;
  inputSnapshot: unknown;
  outputSnapshot: unknown;
  calculatedAt: Date;
}

export async function insertResult(
  db: Executor,
  input: {
    diagnosticId: string;
    formulaVersion: string;
    inputSnapshot: unknown;
    outputSnapshot: unknown;
    profitStatus: "available" | "unavailable";
    profitCents: bigint | null;
    marginBps: number | null;
    profitPerOrderCents: bigint | null;
    takeHomePer100Cents: number | null;
    breakEvenRevenueCents: bigint | null;
    breakEvenOrders: bigint | null;
    gapToGoalCents: bigint | null;
    hasEstimatedInputs: boolean;
  },
): Promise<void> {
  await db.insert(diagnosticResults).values(input);
}

export async function findResultByDiagnosticId(
  db: Executor,
  diagnosticId: string,
): Promise<StoredResult | null> {
  const [row] = await db
    .select({
      formulaVersion: diagnosticResults.formulaVersion,
      inputSnapshot: diagnosticResults.inputSnapshot,
      outputSnapshot: diagnosticResults.outputSnapshot,
      calculatedAt: diagnosticResults.calculatedAt,
    })
    .from(diagnosticResults)
    .where(eq(diagnosticResults.diagnosticId, diagnosticId))
    .limit(1);

  return (row as StoredResult | undefined) ?? null;
}

/**
 * Public lookup: keyed exclusively on the high-entropy token, and only for
 * a token that is neither revoked nor expired. Nothing personal is
 * selected — the caller physically cannot leak a lead id or a name.
 */
export async function findPublicResultByToken(
  db: Executor,
  token: string,
): Promise<(StoredResult & { deliveryType: string | null; mainChannel: string | null }) | null> {
  const [row] = await db
    .select({
      formulaVersion: diagnosticResults.formulaVersion,
      inputSnapshot: diagnosticResults.inputSnapshot,
      outputSnapshot: diagnosticResults.outputSnapshot,
      calculatedAt: diagnosticResults.calculatedAt,
      deliveryType: diagnostics.deliveryType,
      mainChannel: diagnostics.mainChannel,
    })
    .from(diagnostics)
    .innerJoin(diagnosticResults, eq(diagnosticResults.diagnosticId, diagnostics.id))
    .where(
      and(
        eq(diagnostics.resultToken, token),
        eq(diagnostics.status, "completed"),
        isNull(diagnostics.resultTokenRevokedAt),
        or(
          isNull(diagnostics.resultTokenExpiresAt),
          gt(diagnostics.resultTokenExpiresAt, new Date()),
        ),
      ),
    )
    .limit(1);

  return (row as (StoredResult & { deliveryType: string | null; mainChannel: string | null }) | undefined) ?? null;
}
