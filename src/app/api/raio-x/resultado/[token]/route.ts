import { NextResponse, type NextRequest } from "next/server";
import { resultTokenParamSchema } from "@/lib/validation/diagnostic-schemas";
import { handleRoute, notFound } from "@/server/http/errors";
import { getPublicResult } from "@/server/services/get-public-result";

export const dynamic = "force-dynamic";

/**
 * GET /api/raio-x/resultado/[token] — public, read-only result.
 *
 * No cookie, no session: the 256-bit token is the only credential, and it
 * grants nothing but reading this one snapshot. `no-store` keeps the
 * payload out of shared caches.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  return handleRoute(async () => {
    const { token } = await context.params;
    const parsedToken = resultTokenParamSchema.safeParse(token);
    // A malformed token is answered exactly like an unknown one.
    if (!parsedToken.success) throw notFound();

    const result = await getPublicResult(parsedToken.data);

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  });
}
