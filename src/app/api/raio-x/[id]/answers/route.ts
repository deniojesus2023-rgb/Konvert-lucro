import { NextResponse, type NextRequest } from "next/server";
import {
  patchAnswersSchema,
  uuidParamSchema,
} from "@/lib/validation/diagnostic-schemas";
import { handleRoute, notFound } from "@/server/http/errors";
import { readJsonBody } from "@/server/http/request-guards";
import { readSessionSecret } from "@/server/security/session-cookie";
import { updateAnswers } from "@/server/services/update-answers";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/raio-x/[id]/answers — saves a step under optimistic locking.
 *
 * The client sends the `expectedVersion` it last saw. A stale version gets
 * 409 with the current one, so a delayed request can never overwrite a
 * newer answer.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return handleRoute(async () => {
    const { id } = await context.params;
    const parsedId = uuidParamSchema.safeParse(id);
    if (!parsedId.success) throw notFound();

    const payload = await readJsonBody(request, patchAnswersSchema);
    const updated = await updateAnswers(parsedId.data, readSessionSecret(request), payload);

    return NextResponse.json(updated, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  });
}
