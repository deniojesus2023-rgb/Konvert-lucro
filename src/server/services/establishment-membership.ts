import { notFound } from "@/server/http/errors";
import { findMembership } from "@/server/repositories/establishment-repository";
import type { Executor } from "@/server/repositories/diagnostic-repository";

/**
 * Authorizes access to an establishment. Same anti-enumeration discipline
 * as `assertSessionOwns`: a non-member gets the same 404 as a
 * non-existent establishment, never a 403 — so a logged-in user can't
 * probe which establishment ids exist.
 */
export async function assertMembership(
  db: Executor,
  input: { establishmentId: string; userId: string },
): Promise<"owner" | "member"> {
  const membership = await findMembership(db, input);
  if (!membership) throw notFound();
  return membership.role;
}
