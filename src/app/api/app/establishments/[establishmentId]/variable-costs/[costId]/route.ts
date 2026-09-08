import { NextResponse, type NextRequest } from "next/server";
import { uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { handleRoute, notFound, unauthorized } from "@/server/http/errors";
import { readAppSessionSecret } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { removeVariableCost } from "@/server/services/list-variable-costs";

export const dynamic = "force-dynamic";

/** DELETE /api/app/establishments/[establishmentId]/variable-costs/[costId] */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ establishmentId: string; costId: string }> },
): Promise<NextResponse> {
  return handleRoute(async () => {
    const { establishmentId, costId } = await context.params;
    const parsedEstablishmentId = uuidParamSchema.safeParse(establishmentId);
    const parsedCostId = uuidParamSchema.safeParse(costId);
    if (!parsedEstablishmentId.success || !parsedCostId.success) throw notFound();

    const user = await getCurrentUser(readAppSessionSecret(request));
    if (!user) throw unauthorized();

    await removeVariableCost(parsedEstablishmentId.data, user.id, parsedCostId.data);

    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  });
}
