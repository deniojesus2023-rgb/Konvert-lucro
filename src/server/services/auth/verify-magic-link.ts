import { generateSessionSecret, hashSessionSecret } from "@/domain/token/secrets";
import { getDb } from "@/server/db/client";
import { notFound } from "@/server/http/errors";
import { findValidLoginToken, markLoginTokenConsumed } from "@/server/repositories/login-token-repository";
import { markEmailVerified, setUserSessionHash } from "@/server/repositories/user-repository";

export interface VerifiedLogin {
  userId: string;
  /** Returned to the route only so it can be written into the httpOnly cookie. */
  sessionSecret: string;
}

/**
 * Consumes a one-time magic-link token and opens an app session. An
 * invalid, expired, or already-used token all fail identically (404) —
 * same anti-enumeration pattern as an unowned diagnostic.
 *
 * Clicking any valid link is itself proof of mailbox control, so this also
 * marks the account's email verified — whether this is an ordinary login or
 * the link sent right after account activation.
 */
export async function verifyMagicLink(token: string): Promise<VerifiedLogin> {
  const db = getDb();
  const tokenHash = hashSessionSecret(token);
  const loginToken = await findValidLoginToken(db, tokenHash);
  if (!loginToken) throw notFound();

  await markLoginTokenConsumed(db, loginToken.id);
  await markEmailVerified(db, loginToken.userId);

  const sessionSecret = generateSessionSecret();
  await setUserSessionHash(db, loginToken.userId, hashSessionSecret(sessionSecret));

  return { userId: loginToken.userId, sessionSecret };
}
