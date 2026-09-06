import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

/**
 * A separate, anonymous cookie for correlating funnel events — deliberately
 * NOT the diagnostic's session cookie. It carries no authorization (it
 * never grants read/write access to a diagnostic) and no personal data,
 * just an opaque id that groups events from the same browser.
 */
export const FUNNEL_COOKIE_NAME = "konvert_funnel_sid";
const FUNNEL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export function readOrCreateFunnelSessionId(request: NextRequest): {
  sessionId: string;
  isNew: boolean;
} {
  const existing = request.cookies.get(FUNNEL_COOKIE_NAME)?.value;
  if (existing && existing.length > 0) {
    return { sessionId: existing, isNew: false };
  }
  return { sessionId: randomUUID(), isNew: true };
}

export function setFunnelCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set({
    name: FUNNEL_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: getEnv().NODE_ENV === "production",
    maxAge: FUNNEL_COOKIE_MAX_AGE_SECONDS,
  });
}
