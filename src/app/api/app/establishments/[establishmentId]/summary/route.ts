import { NextResponse, type NextRequest } from "next/server";
import { uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { periodQuerySchema } from "@/lib/validation/tracking-schemas";
import { ApiError, handleRoute, notFound, unauthorized } from "@/server/http/errors";
import { readAppSessionSecret } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { getPeriodSummary } from "@/server/services/get-period-summary";

export const dynamic = "force-dynamic";

/**
 * GET /api/app/establishments/[establishmentId]/summary?from&to — the
 * ledger-driven equivalent of the diagnostic's `ProfitResult`: net
 * revenue, total costs, profit, margin, per-order and take-home figures
 * for the requested date range.
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

    const summary = await getPeriodSummary(parsedId.data, user.id, {
      fromDate: query.data.from,
      toDate: query.data.to,
    });

    return NextResponse.json({ summary }, { status: 200, headers: { "Cache-Control": "no-store" } });
  });
}
