import { cookies } from "next/headers";
import { APP_SESSION_COOKIE_NAME } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { getDb } from "@/server/db/client";
import { findEstablishmentsForUser } from "@/server/repositories/establishment-repository";
import { listDailyEntriesInRange } from "@/server/repositories/daily-entry-repository";
import { centsFromDb } from "@/server/db/money-codec";
import { formatCurrencyDisplay } from "@/lib/client/currency";
import { todayInTimezone, startOfMonth } from "@/lib/dates/period-bounds";

export default async function VendasPage() {
  const cookieStore = await cookies();
  const sessionSecret = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUser(sessionSecret);
  if (!user) return null;

  const [establishment] = await findEstablishmentsForUser(getDb(), user.id);

  if (!establishment) {
    return (
      <div>
        <div className="question-meta" style={{ marginBottom: 32 }}>
          <p className="question-number">Vendas</p>
          <h1>Lançamentos do mês</h1>
        </div>
        <p>Você ainda não tem um estabelecimento vinculado.</p>
      </div>
    );
  }

  const today = todayInTimezone(establishment.timezone);
  const entries = await listDailyEntriesInRange(getDb(), {
    establishmentId: establishment.id,
    fromDate: startOfMonth(today),
    toDate: today,
  });
  entries.sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1));

  return (
    <div>
      <div className="question-meta" style={{ marginBottom: 32 }}>
        <p className="question-number">Vendas</p>
        <h1>Lançamentos do mês</h1>
      </div>
      {entries.length === 0 ? (
        <p>Nenhum lançamento neste mês ainda.</p>
      ) : (
        <section>
          {entries.map((entry) => (
            <div key={entry.id} className="statement-row">
              <span>{entry.entryDate}</span>
              <strong>{formatCurrencyDisplay(centsFromDb(entry.grossRevenueCents) ?? 0)}</strong>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
