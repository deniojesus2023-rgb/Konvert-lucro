import { cookies } from "next/headers";
import { APP_SESSION_COOKIE_NAME } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { getDb } from "@/server/db/client";
import { findEstablishmentsForUser } from "@/server/repositories/establishment-repository";
import { getGoalProgress } from "@/server/services/get-goal-progress";
import { formatCurrencyDisplay } from "@/lib/client/currency";
import { todayInTimezone, startOfMonth } from "@/lib/dates/period-bounds";
import { GoalForm } from "@/components/app/GoalForm";
import { IndicatorList } from "@/components/result/IndicatorList";

export default async function MetasPage() {
  const cookieStore = await cookies();
  const sessionSecret = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUser(sessionSecret);
  if (!user) return null;

  const [establishment] = await findEstablishmentsForUser(getDb(), user.id);

  return (
    <div>
      <div className="question-meta" style={{ marginBottom: 32 }}>
        <p className="question-number">Metas</p>
        <h1>Meta de lucro do mês</h1>
      </div>
      {!establishment ? (
        <p>Você ainda não tem um estabelecimento vinculado.</p>
      ) : (
        <MetasContent establishmentId={establishment.id} userId={user.id} timezone={establishment.timezone} />
      )}
    </div>
  );
}

async function MetasContent({
  establishmentId,
  userId,
  timezone,
}: {
  establishmentId: string;
  userId: string;
  timezone: string;
}) {
  const monthStart = startOfMonth(todayInTimezone(timezone));
  const progress = await getGoalProgress(establishmentId, userId, monthStart);

  const gapLabel =
    progress.gapToGoal.status === "available"
      ? progress.gapToGoal.value < 0
        ? `Superou a meta em ${formatCurrencyDisplay(Math.abs(progress.gapToGoal.value))}`
        : `Faltam ${formatCurrencyDisplay(progress.gapToGoal.value)}`
      : "Defina uma meta para acompanhar";

  return (
    <>
      <IndicatorList
        title="Este mês"
        rows={[
          {
            label: "Lucro até agora",
            value:
              progress.summary.profit.status === "available"
                ? formatCurrencyDisplay(progress.summary.profit.value)
                : "Indisponível",
          },
          { label: "Distância da meta", value: gapLabel },
        ]}
      />
      <GoalForm
        establishmentId={establishmentId}
        monthStart={monthStart}
        initialProfitGoalCents={progress.profitGoalCents}
      />
    </>
  );
}
