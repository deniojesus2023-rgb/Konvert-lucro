import { NextResponse, type NextRequest } from "next/server";
import { verifyLoginSchema } from "@/lib/validation/auth-schemas";
import { handleRoute } from "@/server/http/errors";
import { readJsonBody } from "@/server/http/request-guards";
import { setAppSessionCookie } from "@/server/security/app-session-cookie";
import { verifyMagicLink } from "@/server/services/auth/verify-magic-link";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/verify — consumes a one-time login token and opens an
 * app session. Invalid, expired, or already-used tokens all fail with the
 * same 404, never distinguishing which.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleRoute(async () => {
    const { token } = await readJsonBody(request, verifyLoginSchema);

    const login = await verifyMagicLink(token);

    const response = NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
    setAppSessionCookie(response, login.sessionSecret);
    return response;
  });
}
