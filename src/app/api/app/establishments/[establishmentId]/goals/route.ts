import { NextResponse, type NextRequest } from "next/server";
import { uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { goalSchema, monthStartSchema } from "@/lib/validation/tracking-schemas";
import { ApiError, handleRoute, notFound, unauthorized } from "@/server/http/errors";
import { readJsonBody } from "@/server/http/request-guards";
import { readAppSessionSecret } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { upsertMonthlyGoal } from "@/server/services/upsert-goal";
import { getGoalProgress } from "@/server/services/get-goal-progress";

export const dynamic = "force-dynamic";

/**
 * GET returns the month's `PeriodResult` plus its distance from the
 * profit goal (if one is set). POST/PUT create or replace the one goal
 * for that month — no optimistic lock, see the `goals` table comment.
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

    const monthStart = monthStartSchema.safeParse(request.nextUrl.searchParams.get("month"));
    if (!monthStart.success) {
      throw new ApiError("validation_failed", "Mês inválido", {
        issues: monthStart.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }

    const progress = await getGoalProgress(parsedId.data, user.id, monthStart.data);

    return NextResponse.json({ progress }, { status: 200, headers: { "Cache-Control": "no-store" } });
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

    const payload = await readJsonBody(request, goalSchema);
    const goal = await upsertMonthlyGoal(parsedId.data, user.id, payload);

    return NextResponse.json({ goal }, { status: 200, headers: { "Cache-Control": "no-store" } });
  });
}
