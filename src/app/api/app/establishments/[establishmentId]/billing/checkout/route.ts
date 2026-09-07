import { NextResponse, type NextRequest } from "next/server";
import { uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { handleRoute, notFound, unauthorized } from "@/server/http/errors";
import { readAppSessionSecret } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { createCheckoutSession } from "@/server/services/billing/create-checkout-session";

export const dynamic = "force-dynamic";

/** POST — starts a Stripe Checkout session for this establishment's subscription. */
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

    const { url } = await createCheckoutSession(parsedId.data, user.id, user.email);

    return NextResponse.json({ url }, { status: 200, headers: { "Cache-Control": "no-store" } });
  });
}
