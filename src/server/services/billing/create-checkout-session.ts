import { getDb } from "@/server/db/client";
import { getEnv } from "@/lib/env";
import { assertMembership } from "@/server/services/establishment-membership";
import { getStripeClient, getStripeEnv } from "./stripe-client";
import { findEstablishmentById } from "@/server/repositories/establishment-repository";
import { notFound } from "@/server/http/errors";

/**
 * Starts a Stripe Checkout session for one establishment's subscription.
 * The establishment id rides along as subscription metadata so the
 * webhook (which only ever sees Stripe object ids) can find its way back
 * to the right establishment without a second lookup table.
 */
export async function createCheckoutSession(
  establishmentId: string,
  userId: string,
  userEmail: string,
): Promise<{ url: string }> {
  const db = getDb();
  await assertMembership(db, { establishmentId, userId });
  const establishment = await findEstablishmentById(db, establishmentId);
  if (!establishment) throw notFound();

  const stripe = getStripeClient();
  const { priceId } = getStripeEnv();
  const appOrigin = getEnv().APP_ORIGIN ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: userEmail,
    subscription_data: { metadata: { establishmentId } },
    success_url: `${appOrigin}/app/configuracoes?checkout=sucesso`,
    cancel_url: `${appOrigin}/app/configuracoes?checkout=cancelado`,
  });

  if (!session.url) throw new Error("Stripe não retornou uma URL de checkout");
  return { url: session.url };
}
