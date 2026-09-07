import { NextResponse, type NextRequest } from "next/server";
import { requestLinkSchema } from "@/lib/validation/auth-schemas";
import { handleRoute } from "@/server/http/errors";
import { readJsonBody } from "@/server/http/request-guards";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { requestMagicLink } from "@/server/services/auth/request-magic-link";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/request-link — issues a one-time login token for an
 * email, creating the account on demand. Always responds the same way
 * regardless of whether the account already existed.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleRoute(async () => {
    enforceRateLimit(request);
    const { email } = await readJsonBody(request, requestLinkSchema);

    const result = await requestMagicLink(email);

    return NextResponse.json(
      {
        message: "Se o e-mail existir, enviaremos um link de acesso.",
        ...(result.devVerifyUrl ? { devVerifyUrl: result.devVerifyUrl } : {}),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  });
}
