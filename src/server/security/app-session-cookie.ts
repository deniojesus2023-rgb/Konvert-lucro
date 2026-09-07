import type { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

/**
 * The authenticated app session — separate from `konvert_raiox_session`
 * (which only ever authorizes editing one anonymous diagnostic draft).
 *
 * Same shape as the diagnostic session: the cookie carries only the raw
 * secret, the database stores only its SHA-256 (`users.session_hash`), so a
 * database dump grants no login. A new login overwrites the stored hash,
 * invalidating any previous session for that user.
 */
export const APP_SESSION_COOKIE_NAME = "konvert_app_session";
export const APP_SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function readAppSessionSecret(request: NextRequest): string | null {
  const value = request.cookies.get(APP_SESSION_COOKIE_NAME)?.value;
  return value && value.length > 0 ? value : null;
}

export function setAppSessionCookie(response: NextResponse, secret: string): void {
  response.cookies.set({
    name: APP_SESSION_COOKIE_NAME,
    value: secret,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: getEnv().NODE_ENV === "production",
    maxAge: APP_SESSION_COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearAppSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: APP_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: getEnv().NODE_ENV === "production",
    maxAge: 0,
  });
}
