import { NextResponse, type NextRequest } from "next/server";
import { handleRoute } from "@/server/http/errors";
import { assertAllowedOrigin } from "@/server/http/request-guards";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { setSessionCookie } from "@/server/security/session-cookie";
import { startDiagnostic } from "@/server/services/start-diagnostic";

export const dynamic = "force-dynamic";

/**
 * POST /api/raio-x — starts an anonymous draft.
 *
 * Responds with the diagnostic id, its status and the answers version. The
 * session secret goes out only inside the httpOnly cookie, and no result
 * token exists yet (it's minted at finalize time).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleRoute(async () => {
    assertAllowedOrigin(request);
    enforceRateLimit(request);

    const started = await startDiagnostic();

    const response = NextResponse.json(
      {
        id: started.id,
        status: started.status,
        answersVersion: started.answersVersion,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );

    setSessionCookie(response, started.sessionSecret);
    return response;
  });
}
