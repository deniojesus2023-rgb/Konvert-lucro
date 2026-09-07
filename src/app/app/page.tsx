import { cookies } from "next/headers";
import { APP_SESSION_COOKIE_NAME } from "@/server/security/app-session-cookie";
import { getCurrentUser } from "@/server/services/auth/current-user";
import { getDb } from "@/server/db/client";
import { findEstablishmentsForUser } from "@/server/repositories/establishment-repository";
import { getPeriodSummary } from "@/server/services/get-period-summary";
import { getPeriodComparison } from "@/server/services/get-period-comparison";
import type { PeriodResult } from "@/domain/tracking/types";
import { formatCurrencyDisplay } from "@/lib/client/currency";
import { todayInTimezone, startOfWeek, startOfMonth, previousMonthRange } from "@/lib/dates/period-bounds";
import { Button } from "@/components/ui/Button";
import { IndicatorList } from "@/components/result/IndicatorList";

function profitLabel(summary: PeriodResult): string {
  return summary.profit.status === "available" ? formatCurrencyDisplay(summary.profit.value) : "Indisponível";
}

function marginLabel(summary: PeriodResult): string {
  return summary.marginBps.status === "available"
    ? `${(summary.marginBps.value / 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
    : "Indisponível";
}

export default async function AppPage() {
  const cookieStore = await cookies();
  const sessionSecret = cookieStore.get(APP_SESSION_COOKIE_NAME)?.value ?? null;
  const user = await getCurrentUser(sessionSecret);
  // The layout above already redirects when there's no user; this is just
  // the type narrowing for what follows.
  if (!user) return null;

  const establishments = await findEstablishmentsForUser(getDb(), user.id);
  const establishment = establishments[0] ?? null;

  return (
    <div>
      <div className="question-meta" style={{ marginBottom: 32 }}>
        <p className="question-number">Painel</p>
        <h1>Bem-vindo, {user.email}.</h1>
      </div>
      {!establishment ? (
        <p>
          Você ainda não tem um estabelecimento vinculado. Isso acontece automaticamente ao ativar sua
          conta a partir de um Raio-X do Lucro.
        </p>
      ) : (
        <AppDashboard establishmentId={establishment.id} userId={user.id} timezone={establishment.timezone} />
      )}
    </div>
  );
}

async function AppDashboard({
  establishmentId,
  userId,
  timezone,
}: {
  establishmentId: string;
  userId: string;
  timezone: string;
}) {
  const today = todayInTimezone(timezone);
  const monthStart = startOfMonth(today);
  const [todaySummary, weekSummary, monthComparison] = await Promise.all([
    getPeriodSummary(establishmentId, userId, { fromDate: today, toDate: today }),
    getPeriodSummary(establishmentId, userId, { fromDate: startOfWeek(today), toDate: today }),
    getPeriodComparison(establishmentId, userId, {
      current: { fromDate: monthStart, toDate: today },
      previous: previousMonthRange(monthStart),
    }),
  ]);
  const monthSummary = monthComparison.current;

  const monthDeltaLabel =
    monthComparison.comparison.profitDeltaCents.status === "available"
      ? `${monthComparison.comparison.profitDeltaCents.value >= 0 ? "+" : ""}${formatCurrencyDisplay(monthComparison.comparison.profitDeltaCents.value)} vs. mês anterior`
      : "Sem dados do mês anterior";

  return (
    <>
      <IndicatorList
        title="Lucro"
        rows={[
          { label: "Hoje", value: profitLabel(todaySummary) },
          { label: "Esta semana", value: profitLabel(weekSummary) },
          { label: "Este mês", value: profitLabel(monthSummary) },
          { label: "Comparado ao mês anterior", value: monthDeltaLabel },
        ]}
      />
      <IndicatorList
        title="Margem"
        rows={[
          { label: "Hoje", value: marginLabel(todaySummary) },
          { label: "Esta semana", value: marginLabel(weekSummary) },
          { label: "Este mês", value: marginLabel(monthSummary) },
        ]}
      />
      <Button href="/app/lancamentos/novo" fullWidth>
        Lançar hoje <span aria-hidden="true">→</span>
      </Button>
      <nav style={{ marginTop: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Button href="/app/vendas" variant="ghost">
          Vendas
        </Button>
        <Button href="/app/custos-recorrentes" variant="ghost">
          Custos recorrentes
        </Button>
        <Button href="/app/metas" variant="ghost">
          Metas
        </Button>
        <Button href="/app/configuracoes" variant="ghost">
          Configurações
        </Button>
      </nav>
    </>
  );
}
