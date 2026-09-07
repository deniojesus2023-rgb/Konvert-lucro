import { NextResponse, type NextRequest } from "next/server";
import { ApiError, handleRoute } from "@/server/http/errors";
import { getStripeClient, getStripeEnv } from "@/server/services/billing/stripe-client";
import { processBillingWebhook } from "@/server/services/billing/process-billing-webhook";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/webhook — called by Stripe, never a browser. This is
 * the one route in the app that deliberately skips `readJsonBody`: Stripe
 * signs the *exact* raw request bytes, so the body must be read as text
 * and handed to `constructEvent` unparsed — re-serializing it through
 * `JSON.parse`/`JSON.stringify` first would invalidate the signature. It
 * also has no `Origin` header to check (server-to-server) and no app
 * session — the Stripe signature is the entire trust boundary here.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleRoute(async () => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) throw new ApiError("invalid_signature", "Assinatura ausente");

    const rawBody = await request.text();
    const { webhookSecret } = getStripeEnv();

    let event;
    try {
      event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new ApiError("invalid_signature", "Assinatura inválida");
    }

    await processBillingWebhook(event);

    return NextResponse.json({ received: true }, { status: 200 });
  });
}
