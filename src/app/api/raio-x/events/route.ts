import { NextResponse, type NextRequest } from "next/server";
import { funnelEventSchema } from "@/lib/validation/diagnostic-schemas";
import { getDb } from "@/server/db/client";
import { handleRoute } from "@/server/http/errors";
import { readJsonBody } from "@/server/http/request-guards";
import { readOrCreateFunnelSessionId, setFunnelCookie } from "@/server/security/funnel-cookie";
import { recordFunnelEvent } from "@/server/repositories/funnel-repository";

export const dynamic = "force-dynamic";

/**
 * POST /api/raio-x/events — records one funnel event.
 *
 * The payload is validated against a closed schema (`funnelEventSchema`):
 * only the known event names and the four documented metadata keys are
 * accepted, so the client cannot smuggle a token, a secret or personal
 * data into analytics no matter what it sends. Uses its own anonymous
 * cookie, unrelated to the diagnostic's session cookie.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleRoute(async () => {
    const payload = await readJsonBody(request, funnelEventSchema);
    const { sessionId, isNew } = readOrCreateFunnelSessionId(request);

    await recordFunnelEvent(getDb(), {
      sessionId,
      eventName: payload.eventName,
      diagnosticId: payload.diagnosticId ?? null,
      metadata: payload.metadata ?? null,
    });

    const response = new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
    if (isNew) setFunnelCookie(response, sessionId);
    return response;
  });
}
