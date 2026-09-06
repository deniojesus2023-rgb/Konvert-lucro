import type { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

/**
 * The draft-edit session.
 *
 * The cookie carries ONLY the raw secret; the diagnostic id always comes
 * from the URL. The database stores only the SHA-256 of the secret, so a
 * database dump grants no write access, and knowing a diagnostic's UUID
 * grants nothing at all.
 *
 * Lifetime: 30 days — long enough for someone to come back and finish or
 * revise a diagnostic on the same device, short enough that an abandoned
 * shared machine stops being an edit vector within a month. A revision
 * issues a brand-new secret and replaces this cookie, so edit rights move
 * to the new draft while the previous result stays readable through its
 * public token.
 */
export const SESSION_COOKIE_NAME = "konvert_raiox_session";
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function readSessionSecret(request: NextRequest): string | null {
  const value = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return value && value.length > 0 ? value : null;
}

export function setSessionCookie(response: NextResponse, secret: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: secret,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // Plain HTTP on localhost during development would drop a Secure
    // cookie, so it's enabled only in production.
    secure: getEnv().NODE_ENV === "production",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });
}
