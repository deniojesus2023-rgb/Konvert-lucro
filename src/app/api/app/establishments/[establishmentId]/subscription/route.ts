import { NextResponse, type NextRequest } from "next/server";
import { uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { handleRoute, notFound, unauthorized } from "@/server/http/errors";
import { readAppSessionSecret } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { getSubscriptionStatus } from "@/server/services/billing/get-subscription-status";

export const dynamic = "force-dynamic";

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

    const subscription = await getSubscriptionStatus(parsedId.data, user.id);

    return NextResponse.json({ subscription }, { status: 200, headers: { "Cache-Control": "no-store" } });
  });
}
