import { verifySessionSecret } from "@/domain/token/secrets";
import { notFound } from "@/server/http/errors";
import type { DiagnosticRow } from "@/server/repositories/diagnostic-repository";

/**
 * Authorizes access to a diagnostic. Knowing the UUID is never enough —
 * the caller must present the session secret whose SHA-256 matches the
 * stored hash.
 *
 * Every failure (missing cookie, wrong secret, unknown id) raises the same
 * 404 so an attacker can't distinguish "exists but isn't yours" from
 * "doesn't exist" and enumerate diagnostics.
 */
export function assertSessionOwns(
  diagnostic: DiagnosticRow | null,
  secret: string | null,
): DiagnosticRow {
  if (!diagnostic || !secret) throw notFound();
  if (!verifySessionSecret(secret, diagnostic.draftSessionHash)) throw notFound();
  return diagnostic;
}
