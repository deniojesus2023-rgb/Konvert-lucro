import { getDb } from "@/server/db/client";
import { insertEstablishment, insertEstablishmentMember, type EstablishmentRow } from "@/server/repositories/establishment-repository";
import type { CreateEstablishmentPayload } from "@/lib/validation/establishment-schemas";

/**
 * Creates a fresh establishment for a logged-in user who doesn't have one
 * yet (the direct-signup onboarding path — distinct from
 * `convertDiagnosticToAccount`, which seeds an establishment from an
 * already-completed diagnostic instead of a bare name).
 */
export async function createEstablishmentForUser(
  userId: string,
  input: CreateEstablishmentPayload,
): Promise<EstablishmentRow> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const establishment = await insertEstablishment(tx, { name: input.name });
    await insertEstablishmentMember(tx, { establishmentId: establishment.id, userId, role: "owner" });
    return establishment;
  });
}
