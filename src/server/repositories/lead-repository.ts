import { consents, leads } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

export async function insertLead(
  db: Executor,
  input: { name: string; whatsapp: string },
): Promise<{ id: string }> {
  const [row] = await db
    .insert(leads)
    .values({ name: input.name, whatsapp: input.whatsapp })
    .returning({ id: leads.id });
  return row;
}

/**
 * Contact consent is mandatory (it's the legal basis for storing the
 * contact at all) and is therefore always stamped. Marketing opt-in is
 * independent: when refused, `marketingOptInAt` stays null and nothing
 * about the result changes.
 */
export async function insertConsent(
  db: Executor,
  input: {
    leadId: string;
    consentTextVersion: string;
    marketingOptIn: boolean;
  },
): Promise<void> {
  const now = new Date();
  await db.insert(consents).values({
    leadId: input.leadId,
    contactConsentAcceptedAt: now,
    consentTextVersion: input.consentTextVersion,
    marketingOptIn: input.marketingOptIn,
    marketingOptInAt: input.marketingOptIn ? now : null,
  });
}
