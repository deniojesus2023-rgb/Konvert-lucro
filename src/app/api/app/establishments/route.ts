import { NextResponse, type NextRequest } from "next/server";
import { createEstablishmentSchema } from "@/lib/validation/establishment-schemas";
import { handleRoute, unauthorized } from "@/server/http/errors";
import { readJsonBody } from "@/server/http/request-guards";
import { readAppSessionSecret } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { createEstablishmentForUser } from "@/server/services/create-establishment";

export const dynamic = "force-dynamic";

/**
 * POST /api/app/establishments — direct-signup onboarding: creates an
 * establishment (owned by the current user) for someone who logged in
 * without going through the free diagnostic funnel first.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleRoute(async () => {
    const user = await getCurrentUser(readAppSessionSecret(request));
    if (!user) throw unauthorized();

    const payload = await readJsonBody(request, createEstablishmentSchema);
    const establishment = await createEstablishmentForUser(user.id, payload);

    return NextResponse.json(
      {
        establishment: {
          id: establishment.id,
          name: establishment.name,
          timezone: establishment.timezone,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  });
}
