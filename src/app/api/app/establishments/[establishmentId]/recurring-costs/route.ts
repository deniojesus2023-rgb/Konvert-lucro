import { NextResponse, type NextRequest } from "next/server";
import { uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { recurringCostSchema } from "@/lib/validation/tracking-schemas";
import { handleRoute, notFound, unauthorized } from "@/server/http/errors";
import { readJsonBody } from "@/server/http/request-guards";
import { readAppSessionSecret } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { createRecurringCost } from "@/server/services/create-recurring-cost";
import { getDb } from "@/server/db/client";
import { assertMembership } from "@/server/services/establishment-membership";
import { listRecurringCosts } from "@/server/repositories/recurring-cost-repository";
import { centsFromDb } from "@/server/db/money-codec";

export const dynamic = "force-dynamic";

/**
 * GET lists every recurring cost for the establishment (active or not —
 * the `/app/custos-recorrentes` screen shows both so an owner can see what
 * they turned off). POST creates one; its share of any given period is
 * always computed on demand by the tracking engine, never stored.
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

    const db = getDb();
    await assertMembership(db, { establishmentId: parsedId.data, userId: user.id });

    const rows = await listRecurringCosts(db, parsedId.data);

    return NextResponse.json(
      {
        recurringCosts: rows.map((row) => ({
          id: row.id,
          name: row.name,
          amountCents: centsFromDb(row.amountCents) ?? 0,
          frequency: row.frequency,
          startDate: row.startDate,
          endDate: row.endDate,
          active: row.active,
        })),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
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

    const payload = await readJsonBody(request, recurringCostSchema);
    const recurringCost = await createRecurringCost(parsedId.data, user.id, payload);

    return NextResponse.json({ recurringCost }, { status: 200, headers: { "Cache-Control": "no-store" } });
  });
}
