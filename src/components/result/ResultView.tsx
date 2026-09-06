import type { Cents } from "@/domain/money/cents";
import type { Metric, ProfitResult } from "@/domain/diagnostic/types";
import { formatCurrencyDisplay, formatWholeReais } from "@/lib/client/currency";
import { reasonLabel } from "@/lib/client/metric-reasons";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { BlindSpotList } from "@/components/ui/BlindSpotList";
import { Logo } from "@/components/ui/Logo";
import { FireFunnelEvent } from "@/components/analytics/FireFunnelEvent";
import { EstimateBadge } from "./EstimateBadge";
import { ResultDisclaimer } from "./ResultDisclaimer";
import { TopCostGroups } from "./TopCostGroups";
import { OfferBridge } from "./OfferBridge";

interface ResultViewProps {
  formulaVersion: string;
  deliveryType: string | null;
  mainChannel: string | null;
  result: ProfitResult;
}

function unavailableNote(metric: Metric<unknown>): string | undefined {
  return metric.status === "unavailable" ? `Indisponível: ${reasonLabel(metric.reason)}.` : undefined;
}

export function ResultView({ result }: ResultViewProps) {
  const profitAvailable = result.profit.status === "available";
  const profitValue = result.profit.status === "available" ? result.profit.value : null;

  return (
    <div className="flex min-h-full flex-col bg-white">
      <FireFunnelEvent
        event={{
          eventName: "result_viewed",
          metadata: { resultMode: profitAvailable ? "available" : "partial" },
        }}
      />

      <header className="border-b border-blue-light px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <Logo className="h-7 w-auto" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
        {profitAvailable ? (
          <AvailableHeadline profitCents={profitValue as Cents} takeHome={result.takeHomePer100Cents} />
        ) : (
          <PartialHeadline result={result} />
        )}

        {result.hasEstimatedInputs && <EstimateBadge estimatedGroups={result.estimatedGroups} />}

        {profitAvailable && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard
              label="Lucro mensal estimado"
              value={formatCurrencyDisplay(profitValue as number)}
              emphasis
            />
            <MetricCard
              label="Margem estimada"
              value={
                result.marginBps.status === "available"
                  ? `${(result.marginBps.value / 100).toFixed(2).replace(".", ",")}%`
                  : "Indisponível"
              }
              hint={unavailableNote(result.marginBps)}
            />
            <MetricCard
              label="Lucro médio por pedido"
              value={
                result.profitPerOrder.status === "available"
                  ? formatCurrencyDisplay(result.profitPerOrder.value)
                  : "Indisponível"
              }
              hint={unavailableNote(result.profitPerOrder)}
            />
            <MetricCard
              label="Sobra por R$100 vendidos"
              value={
                result.takeHomePer100Cents.status === "available"
                  ? formatCurrencyDisplay(result.takeHomePer100Cents.value)
                  : "Indisponível"
              }
              hint={unavailableNote(result.takeHomePer100Cents)}
            />
            <MetricCard
              label="Ponto de equilíbrio em vendas"
              value={
                result.breakEvenRevenue.status === "available"
                  ? formatCurrencyDisplay(result.breakEvenRevenue.value)
                  : "Indisponível"
              }
              hint={unavailableNote(result.breakEvenRevenue)}
            />
            <MetricCard
              label="Ponto de equilíbrio em pedidos"
              value={
                result.breakEvenOrders.status === "available"
                  ? `${result.breakEvenOrders.value.toLocaleString("pt-BR")} pedidos`
                  : "Indisponível"
              }
              hint={unavailableNote(result.breakEvenOrders)}
            />
          </div>
        )}

        {profitAvailable && <GoalCard gapToGoal={result.gapToGoal} />}

        <TopCostGroups groups={result.topCostGroups} />

        {result.blindSpots.length > 0 && (
          <Card>
            <BlindSpotList blindSpots={result.blindSpots} />
          </Card>
        )}

        <ResultDisclaimer />

        <OfferBridge />
      </main>
    </div>
  );
}

function AvailableHeadline({ profitCents, takeHome }: { profitCents: Cents; takeHome: Metric<number> }) {
  if (profitCents < 0) {
    return (
      <h1 className="text-2xl font-semibold text-navy sm:text-3xl">
        Seu delivery teve um resultado negativo estimado de{" "}
        {formatCurrencyDisplay(Math.abs(profitCents))} no período.
      </h1>
    );
  }

  const takeHomeText = takeHome.status === "available" ? formatWholeReais(takeHome.value) : "?";

  return (
    <h1 className="text-2xl font-semibold text-navy sm:text-3xl">
      De cada R$100 vendidos, aproximadamente {takeHomeText} ficam no seu delivery.
    </h1>
  );
}

function PartialHeadline({ result }: { result: ProfitResult }) {
  const balance = result.balanceBeforeUnknownCosts;
  const beforeTaxes = result.profitBeforeTaxes;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-navy sm:text-3xl">
        Ainda não dá para estimar seu lucro com segurança.
      </h1>

      {beforeTaxes.status === "available" && (
        <Card className="border-blue-primary/40">
          <p className="text-sm text-navy/60">Resultado antes dos impostos</p>
          <p className="mt-1 text-2xl font-semibold text-navy">
            {formatCurrencyDisplay(beforeTaxes.value)}
          </p>
          <p className="mt-1 text-xs text-navy/50">
            Este valor ainda não desconta impostos e nunca deve ser lido como lucro final.
          </p>
        </Card>
      )}

      <Card>
        <p className="text-sm text-navy/60">Saldo antes dos custos não informados</p>
        <p className="mt-1 text-2xl font-semibold text-navy">
          {balance.status === "available" ? formatCurrencyDisplay(balance.value) : "Indisponível"}
        </p>
        {balance.status === "unavailable" && (
          <p className="mt-1 text-xs text-navy/50">{unavailableNote(balance)}</p>
        )}
      </Card>
    </div>
  );
}

function GoalCard({ gapToGoal }: { gapToGoal: Metric<Cents> }) {
  if (gapToGoal.status === "unavailable") {
    return (
      <Card>
        <p className="text-sm text-navy/60">Distância para a meta</p>
        <p className="mt-1 text-navy">{unavailableNote(gapToGoal)}</p>
      </Card>
    );
  }

  const gap = gapToGoal.value;
  return (
    <Card>
      <p className="text-sm text-navy/60">Meta</p>
      <p className="mt-1 text-xl font-semibold text-navy">
        {gap < 0
          ? `Você superou sua meta em ${formatCurrencyDisplay(Math.abs(gap))}.`
          : `Faltam ${formatCurrencyDisplay(gap)} para atingir sua meta.`}
      </p>
    </Card>
  );
}
