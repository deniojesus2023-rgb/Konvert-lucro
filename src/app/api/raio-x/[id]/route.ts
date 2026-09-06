import { NextResponse, type NextRequest } from "next/server";
import { uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { handleRoute, notFound } from "@/server/http/errors";
import { readSessionSecret } from "@/server/security/session-cookie";
import { getDraft } from "@/server/services/get-draft";

export const dynamic = "force-dynamic";

/**
 * GET /api/raio-x/[id] — reads back the caller's own draft so the wizard
 * can resume where it left off. Requires the session cookie; a malformed
 * id, an unknown id and someone else's id all return the same 404.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return handleRoute(async () => {
    const { id } = await context.params;
    const parsedId = uuidParamSchema.safeParse(id);
    if (!parsedId.success) throw notFound();

    const draft = await getDraft(parsedId.data, readSessionSecret(request));

    return NextResponse.json(draft, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  });
}
