import { cookies } from "next/headers";
import { APP_SESSION_COOKIE_NAME } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { getDb } from "@/server/db/client";
import { findEstablishmentsForUser } from "@/server/repositories/establishment-repository";
import { getSubscriptionStatus } from "@/server/services/billing/get-subscription-status";
import { BillingPanel } from "@/components/app/BillingPanel";

export default async function ConfiguracoesPage() {
  const cookieStore = await cookies();
  const sessionSecret = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUser(sessionSecret);
  if (!user) return null;

  const [establishment] = await findEstablishmentsForUser(getDb(), user.id);

  return (
    <div>
      <div className="question-meta" style={{ marginBottom: 32 }}>
        <p className="question-number">Configurações</p>
        <h1>{establishment?.name ?? "Sua conta"}</h1>
      </div>
      {!establishment ? (
        <p>Você ainda não tem um estabelecimento vinculado.</p>
      ) : (
        <BillingSection establishmentId={establishment.id} userId={user.id} />
      )}
    </div>
  );
}

async function BillingSection({ establishmentId, userId }: { establishmentId: string; userId: string }) {
  const subscription = await getSubscriptionStatus(establishmentId, userId);
  return <BillingPanel establishmentId={establishmentId} subscription={subscription} />;
}
