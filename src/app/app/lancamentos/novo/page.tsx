import { cookies } from "next/headers";
import { APP_SESSION_COOKIE_NAME } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { getDb } from "@/server/db/client";
import { findEstablishmentsForUser } from "@/server/repositories/establishment-repository";
import { DailyEntryForm } from "@/components/app/DailyEntryForm";

export default async function NovoLancamentoPage() {
  const cookieStore = await cookies();
  const sessionSecret = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUser(sessionSecret);
  if (!user) return null;

  const [establishment] = await findEstablishmentsForUser(getDb(), user.id);

  return (
    <div>
      <div className="question-meta" style={{ marginBottom: 32 }}>
        <p className="question-number">Lançamento diário</p>
        <h1>Como foi hoje?</h1>
      </div>
      {!establishment ? (
        <p>Você ainda não tem um estabelecimento vinculado.</p>
      ) : (
        <DailyEntryForm establishmentId={establishment.id} timezone={establishment.timezone} />
      )}
    </div>
  );
}
