import { getDb } from "@/server/db/client";
import { notFound } from "@/server/http/errors";
import { findPublicResultByToken } from "@/server/repositories/diagnostic-repository";

export interface PublicResultView {
  formulaVersion: string;
  calculatedAt: string;
  deliveryType: string | null;
  mainChannel: string | null;
  /** The complete ProfitResult, exactly as calculated at finalize time. */
  result: unknown;
}

/**
 * The public, read-only view of a result.
 *
 * Looked up solely by the 256-bit token — there is no other way in, and no
 * parameter that could widen the query to another lead's row. The payload
 * carries only what the future result screen needs: no lead id, no name,
 * no WhatsApp, no consent record, and not even the diagnostic's own UUID
 * (which would tie this public link back to the private edit endpoints).
 *
 * A token that doesn't exist, was revoked, or has expired is
 * indistinguishable from one that never existed: all yield 404.
 */
export async function getPublicResult(token: string): Promise<PublicResultView> {
  const row = await findPublicResultByToken(getDb(), token);
  if (!row) throw notFound();

  return {
    formulaVersion: row.formulaVersion,
    calculatedAt: row.calculatedAt.toISOString(),
    deliveryType: row.deliveryType,
    mainChannel: row.mainChannel,
    result: row.outputSnapshot,
  };
}
