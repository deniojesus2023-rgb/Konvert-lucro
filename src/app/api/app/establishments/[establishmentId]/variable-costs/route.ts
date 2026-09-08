import { NextResponse, type NextRequest } from "next/server";
import { uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { periodQuerySchema, variableCostSchema } from "@/lib/validation/tracking-schemas";
import { ApiError, handleRoute, notFound, unauthorized } from "@/server/http/errors";
import { readJsonBody } from "@/server/http/request-guards";
import { readAppSessionSecret } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { createVariableCost } from "@/server/services/create-variable-cost";
import { listVariableCostsForRange } from "@/server/services/list-variable-costs";

export const dynamic = "force-dynamic";

/**
 * GET /api/app/establishments/[establishmentId]/variable-costs?from&to —
 * lists one-off costs in a date range (for the `/app/custos` list).
 * POST creates one, finding-or-creating its category by name.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ establishmentId: string }> },
): Promise<NextResponse> {
  return handleRoute(async () => {
    const { establishmentId } = await context.params;
    const parsedId = uuidParamSchema.safeParse(establishmentId);
    if (!parsedId.success) throw notFound();

    const user = await getCurrentUser(readAppSessionSecret(request));
    if (!user) throw unauthorized();

    const query = periodQuerySchema.safeParse({
      from: request.nextUrl.searchParams.get("from"),
      to: request.nextUrl.searchParams.get("to"),
    });
    if (!query.success) {
      throw new ApiError("validation_failed", "Período inválido", {
        issues: query.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }

    const variableCosts = await listVariableCostsForRange(parsedId.data, user.id, {
      fromDate: query.data.from,
      toDate: query.data.to,
    });

    return NextResponse.json({ variableCosts }, { status: 200, headers: { "Cache-Control": "no-store" } });
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ establishmentId: string }> },
): Promise<NextResponse> {
  return handleRoute(async () => {
    const { establishmentId } = await context.params;
    const parsedId = uuidParamSchema.safeParse(establishmentId);
    if (!parsedId.success) throw notFound();

    const user = await getCurrentUser(readAppSessionSecret(request));
    if (!user) throw unauthorized();

    const payload = await readJsonBody(request, variableCostSchema);
    const variableCost = await createVariableCost(parsedId.data, user.id, payload);

    return NextResponse.json({ variableCost }, { status: 200, headers: { "Cache-Control": "no-store" } });
  });
}
