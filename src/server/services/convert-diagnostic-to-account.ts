import { getDb } from "@/server/db/client";
import { ApiError } from "@/server/http/errors";
import { findById, linkEstablishment } from "@/server/repositories/diagnostic-repository";
import {
  findEstablishmentById,
  insertEstablishment,
  insertEstablishmentMember,
} from "@/server/repositories/establishment-repository";
import { findUserByEmail, insertUser } from "@/server/repositories/user-repository";
import { requestMagicLink, type MagicLinkRequested } from "@/server/services/auth/request-magic-link";
import { assertSessionOwns } from "./diagnostic-session";

export interface AccountActivated {
  establishmentId: string;
  /** Only present outside production — see requestMagicLink. */
  devVerifyUrl: string | null;
}

/**
 * Converts a completed diagnostic into a subscriber account: creates the
 * user (or reuses one with the same email), an establishment seeded from
 * the diagnostic's own answers, and links them as owner — then sends a
 * magic link so opening `/app` also serves as email verification.
 *
 * Idempotent: a diagnostic that's already linked to an establishment
 * returns that same establishment instead of creating a second one, so a
 * double-click or a retried request never duplicates anything.
 *
 * `diagnostic_results` is never touched — only the additive, nullable
 * `diagnostics.establishment_id` column is written.
 */
export async function convertDiagnosticToAccount(
  diagnosticId: string,
  sessionSecret: string | null,
  input: { email: string; establishmentName: string },
): Promise<AccountActivated> {
  const db = getDb();

  // The magic-link step below runs its own queries against the pool (a
  // separate connection). Calling it while `tx` is still open would let it
  // block on the uncommitted user/email row and deadlock against this very
  // transaction — so the transaction only ever creates rows, and the link
  // is requested afterward, once they're committed and visible.
  const establishmentId = await db.transaction(async (tx) => {
    const diagnostic = assertSessionOwns(await findById(tx, diagnosticId), sessionSecret);

    if (diagnostic.status !== "completed") {
      throw new ApiError("not_completed", "Só é possível ativar uma conta a partir de um diagnóstico concluído.");
    }

    if (diagnostic.establishmentId) {
      const existing = await findEstablishmentById(tx, diagnostic.establishmentId);
      // Recovers the same outcome on a retry — never a second establishment.
      if (existing) return existing.id;
    }

    const existingUser = await findUserByEmail(tx, input.email);
    const user = existingUser ?? (await insertUser(tx, { email: input.email }));

    const establishment = await insertEstablishment(tx, {
      name: input.establishmentName,
      deliveryType: diagnostic.deliveryType,
      mainChannel: diagnostic.mainChannel,
    });

    await insertEstablishmentMember(tx, { establishmentId: establishment.id, userId: user.id, role: "owner" });
    await linkEstablishment(tx, { id: diagnostic.id, establishmentId: establishment.id });

    return establishment.id;
  });

  const link: MagicLinkRequested = await requestMagicLink(input.email);
  return { establishmentId, devVerifyUrl: link.devVerifyUrl };
}
