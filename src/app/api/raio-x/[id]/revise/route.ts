import { NextResponse, type NextRequest } from "next/server";
import { uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { handleRoute, notFound } from "@/server/http/errors";
import { assertAllowedOrigin } from "@/server/http/request-guards";
import { readSessionSecret, setSessionCookie } from "@/server/security/session-cookie";
import { reviseDiagnostic } from "@/server/services/revise-diagnostic";

export const dynamic = "force-dynamic";

/**
 * POST /api/raio-x/[id]/revise — opens a new draft based on a completed
 * diagnostic.
 *
 * The response swaps the session cookie for the new draft's secret: edit
 * rights move to the revision, while the previous result and its public
 * link remain untouched and readable.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return handleRoute(async () => {
    assertAllowedOrigin(request);

    const { id } = await context.params;
    const parsedId = uuidParamSchema.safeParse(id);
    if (!parsedId.success) throw notFound();

    const revision = await reviseDiagnostic(parsedId.data, readSessionSecret(request));

    const response = NextResponse.json(
      {
        id: revision.id,
        status: revision.status,
        answersVersion: revision.answersVersion,
        sourceDiagnosticId: revision.sourceDiagnosticId,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );

    setSessionCookie(response, revision.sessionSecret);
    return response;
  });
}
