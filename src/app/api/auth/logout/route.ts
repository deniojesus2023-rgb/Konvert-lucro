import { NextResponse } from "next/server";
import { clearAppSessionCookie } from "@/server/security/app-session-cookie";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout — clears the app session cookie. */
export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  clearAppSessionCookie(response);
  return response;
}
