import { getDb } from "@/server/db/client";
import { getEnv } from "@/lib/env";
import { ApiError } from "@/server/http/errors";
import { assertMembership } from "@/server/services/establishment-membership";
import { findLatestSubscription } from "@/server/repositories/subscription-repository";
import { getStripeClient } from "./stripe-client";

/**
 * Opens Stripe's self-service Billing Portal for whoever the establishment
 * last checked out as. Requires a `providerCustomerId` on record, which
 * only exists once at least one Checkout session has completed.
 */
export async function createPortalSession(establishmentId: string, userId: string): Promise<{ url: string }> {
  const db = getDb();
  await assertMembership(db, { establishmentId, userId });

  const latest = await findLatestSubscription(db, establishmentId);
  if (!latest?.providerCustomerId) {
    throw new ApiError("not_completed", "Este estabelecimento ainda não tem uma assinatura para gerenciar.");
  }

  const stripe = getStripeClient();
  const appOrigin = getEnv().APP_ORIGIN ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: latest.providerCustomerId,
    return_url: `${appOrigin}/app/configuracoes`,
  });

  return { url: session.url };
}
