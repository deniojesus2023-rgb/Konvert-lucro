import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/lib/env";
import { finalizeSchema, uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { handleRoute, notFound } from "@/server/http/errors";
import { readJsonBody } from "@/server/http/request-guards";
import { readSessionSecret } from "@/server/security/session-cookie";
import { finalizeDiagnostic } from "@/server/services/finalize-diagnostic";

export const dynamic = "force-dynamic";

/**
 * POST /api/raio-x/[id]/finalize — closes the diagnostic and mints the
 * public result token.
 *
 * Idempotent: repeating the call with the same `idempotencyKey` returns
 * the same token without creating a second lead, consent or result.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return handleRoute(async () => {
    const { id } = await context.params;
    const parsedId = uuidParamSchema.safeParse(id);
    if (!parsedId.success) throw notFound();

    const payload = await readJsonBody(request, finalizeSchema);

    const outcome = await finalizeDiagnostic(
      parsedId.data,
      readSessionSecret(request),
      payload,
      getEnv().CONSENT_TEXT_VERSION,
    );

    return NextResponse.json(
      {
        resultToken: outcome.resultToken,
        resultPath: `/raio-x/resultado/${outcome.resultToken}`,
        alreadyFinalized: outcome.alreadyFinalized,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  });
}
