import { NextResponse, type NextRequest } from "next/server";
import { uuidParamSchema } from "@/lib/validation/diagnostic-schemas";
import { activateAccountSchema } from "@/lib/validation/auth-schemas";
import { handleRoute, notFound } from "@/server/http/errors";
import { readJsonBody } from "@/server/http/request-guards";
import { readSessionSecret } from "@/server/security/session-cookie";
import { convertDiagnosticToAccount } from "@/server/services/convert-diagnostic-to-account";

export const dynamic = "force-dynamic";

/**
 * POST /api/raio-x/[id]/activate-account — turns a completed diagnostic
 * into a subscriber account. Requires the same session cookie that owns
 * the diagnostic (the one still in the browser from the wizard); no
 * separate login is needed to reach this step.
 *
 * Never logs the user in directly — a magic link is issued so opening it
 * also verifies the email before `/app` becomes reachable.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return handleRoute(async () => {
    const { id } = await context.params;
    const parsedId = uuidParamSchema.safeParse(id);
    if (!parsedId.success) throw notFound();

    const { email, establishmentName } = await readJsonBody(request, activateAccountSchema);

    const result = await convertDiagnosticToAccount(parsedId.data, readSessionSecret(request), {
      email,
      establishmentName,
    });

    return NextResponse.json(
      {
        message: "Conta criada. Confira seu e-mail para acessar o painel.",
        ...(result.devVerifyUrl ? { devVerifyUrl: result.devVerifyUrl } : {}),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  });
}
