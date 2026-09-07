import { generateSessionSecret, hashSessionSecret } from "@/domain/token/secrets";
import { getDb } from "@/server/db/client";
import { insertLoginToken } from "@/server/repositories/login-token-repository";
import { findUserByEmail, insertUser } from "@/server/repositories/user-repository";
import { isProduction } from "@/lib/env";

const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000;

export interface MagicLinkRequested {
  /**
   * Only populated outside production, where there is no real email
   * provider wired up yet — lets the flow be tested end-to-end without one.
   * Never present in production; a real ESP integration must replace this
   * before launch (same kind of documented gap as the dev-only rate
   * limiter).
   */
  devVerifyUrl: string | null;
}

/**
 * Requests (or silently creates) an account for `email` and issues a
 * one-time login token. Always succeeds the same way regardless of whether
 * the user already existed — there's nothing to enumerate since a new
 * account is created on demand.
 */
export async function requestMagicLink(email: string): Promise<MagicLinkRequested> {
  const db = getDb();
  const existing = await findUserByEmail(db, email);
  const user = existing ?? (await insertUser(db, { email }).catch(async () => {
    // Two concurrent requests for a brand-new email can race on the
    // unique constraint; the loser just reads back what the winner wrote.
    const raced = await findUserByEmail(db, email);
    if (!raced) throw new Error("Falha ao criar ou encontrar o usuário");
    return raced;
  }));

  const token = generateSessionSecret();
  const expiresAt = new Date(Date.now() + LOGIN_TOKEN_TTL_MS);
  await insertLoginToken(db, { userId: user.id, tokenHash: hashSessionSecret(token), expiresAt });

  // A real send would go here (Resend/Postmark/etc). Never log the raw
  // token — it's a bearer credential just like the diagnostic session
  // secret.
  if (isProduction()) {
    return { devVerifyUrl: null };
  }
  return { devVerifyUrl: `/entrar/verificar?token=${token}` };
}
