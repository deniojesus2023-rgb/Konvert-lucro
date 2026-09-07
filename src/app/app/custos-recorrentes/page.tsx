import { cookies } from "next/headers";
import { APP_SESSION_COOKIE_NAME } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { getDb } from "@/server/db/client";
import { findEstablishmentsForUser } from "@/server/repositories/establishment-repository";
import { listRecurringCosts } from "@/server/repositories/recurring-cost-repository";
import { centsFromDb } from "@/server/db/money-codec";
import { formatCurrencyDisplay } from "@/lib/client/currency";
import { RecurringCostForm } from "@/components/app/RecurringCostForm";

export default async function CustosRecorrentesPage() {
  const cookieStore = await cookies();
  const sessionSecret = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUser(sessionSecret);
  if (!user) return null;

  const [establishment] = await findEstablishmentsForUser(getDb(), user.id);

  return (
    <div>
      <div className="question-meta" style={{ marginBottom: 32 }}>
        <p className="question-number">Custos recorrentes</p>
        <h1>Aluguel, folha, assinaturas</h1>
      </div>
      {!establishment ? (
        <p>Você ainda não tem um estabelecimento vinculado.</p>
      ) : (
        <>
          <RecurringCostsList establishmentId={establishment.id} />
          <RecurringCostForm establishmentId={establishment.id} />
        </>
      )}
    </div>
  );
}

async function RecurringCostsList({ establishmentId }: { establishmentId: string }) {
  const rows = await listRecurringCosts(getDb(), establishmentId);
  const active = rows.filter((row) => row.active);

  if (active.length === 0) {
    return <p style={{ marginBottom: 24 }}>Nenhum custo recorrente cadastrado ainda.</p>;
  }

  return (
    <section style={{ marginBottom: 32 }}>
      {active.map((row) => (
        <div key={row.id} className="statement-row">
          <span>
            {row.name} ({row.frequency === "monthly" ? "mensal" : "semanal"})
          </span>
          <strong>{formatCurrencyDisplay(centsFromDb(row.amountCents) ?? 0)}</strong>
        </div>
      ))}
    </section>
  );
}
