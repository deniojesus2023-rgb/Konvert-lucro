import type { Cents } from "@/domain/money/cents";
import type { ProfitResult } from "@/domain/diagnostic/types";
import { formatCurrencyDisplay, formatWholeReais } from "@/lib/client/currency";
import { fieldLabel } from "@/lib/client/field-labels";
import { Logo } from "@/components/ui/Logo";
import { FireFunnelEvent } from "@/components/analytics/FireFunnelEvent";
import { EstimateBadge } from "./EstimateBadge";
import { ResultDisclaimer } from "./ResultDisclaimer";
import { ResultNav } from "./ResultNav";
import { FinancialStatement, type StatementLine } from "./FinancialStatement";
import { IndicatorList } from "./IndicatorList";
import { BlindSpotList } from "./BlindSpotList";
import { OfferBridge } from "./OfferBridge";
import { PartialCtaBand } from "./PartialCtaBand";

interface ResultViewProps {
  formulaVersion: string;
  deliveryType: string | null;
  mainChannel: string | null;
  result: ProfitResult;
}

function costLines(result: ProfitResult): StatementLine[] {
  const groups = result.allCostGroups ?? result.topCostGroups;
  return groups.map((group) => ({
    label: fieldLabel(group.group),
    cents: group.totalCents,
    negative: true,
  }));
}

export function ResultView({ result }: ResultViewProps) {
  const profitAvailable = result.profit.status === "available";

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <FireFunnelEvent
        event={{
          eventName: "result_viewed",
          metadata: { resultMode: profitAvailable ? "available" : "partial" },
        }}
      />

      <header className="border-b border-line px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-auto" />
            <span className="hidden text-ink-faint sm:inline">/</span>
            <span className="hidden text-sm text-ink-soft sm:inline">Raio-X do Lucro</span>
          </div>
          <ResultNav knownCostsTotalCents={result.knownCostsTotalCents} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-10 sm:py-14">
        {profitAvailable ? <AvailableResult result={result} /> : <PartialResult result={result} />}

        <ResultDisclaimer />
      </main>

      <div className="px-6">
        <div className="mx-auto max-w-5xl">
          {profitAvailable ? <OfferBridge /> : <PartialCtaBand />}
        </div>
      </div>
    </div>
  );
}

function AvailableResult({ result }: { result: ProfitResult }) {
  const profitValue = result.profit.status === "available" ? result.profit.value : (0 as Cents);
  const takeHome = result.takeHomePer100Cents;
  const takeHomeText = takeHome.status === "available" ? formatWholeReais(takeHome.value) : "?";

  const goalCents =
    result.gapToGoal.status === "available" ? profitValue + result.gapToGoal.value : null;

  const indicatorRows = [
    {
      label: "Lucro por pedido",
      value:
        result.profitPerOrder.status === "available"
          ? formatCurrencyDisplay(result.profitPerOrder.value)
          : "Indisponível",
    },
    {
      label: "Ponto de equilíbrio",
      value:
        result.breakEvenRevenue.status === "available"
          ? formatCurrencyDisplay(result.breakEvenRevenue.value)
          : "Indisponível",
    },
    {
      label: "Ponto de equilíbrio",
      value:
        result.breakEvenOrders.status === "available"
          ? `${result.breakEvenOrders.value.toLocaleString("pt-BR")} pedidos`
          : "Indisponível",
    },
    ...(goalCents !== null
      ? [{ label: "Meta mensal", value: formatCurrencyDisplay(goalCents) }]
      : []),
    {
      label: result.gapToGoal.status === "available" && result.gapToGoal.value < 0 ? "Superou a meta em" : "Faltam para a meta",
      value:
        result.gapToGoal.status === "available"
          ? formatCurrencyDisplay(Math.abs(result.gapToGoal.value))
          : "Indisponível",
    },
  ];

  const topGroup = result.topCostGroups[0];
  const insight =
    topGroup && result.revenue.status === "available" && result.revenue.value > 0
      ? `Seu maior custo é ${fieldLabel(topGroup.group)}: representa ${Math.round(
          (topGroup.totalCents / result.revenue.value) * 100,
        )}% do faturamento.`
      : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-8 border-b border-line pb-10 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-16">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-blue-primary">SEU RAIO-X DO LUCRO</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            {profitValue < 0 ? (
              <>
                Seu delivery teve um resultado negativo estimado de{" "}
                {formatCurrencyDisplay(Math.abs(profitValue))} no período.
              </>
            ) : (
              <>
                De cada R$100 vendidos, {takeHomeText} ficaram no seu delivery.
              </>
            )}
          </h1>
        </div>
        <div className="lg:w-72 lg:border-l lg:border-line lg:pl-10">
          <p className="text-ink-soft">Lucro mensal estimado</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl text-ink-faint">{profitValue < 0 ? "-R$" : "R$"}</span>
            <span className="text-4xl font-semibold text-ink">
              {formatCurrencyDisplay(Math.abs(profitValue)).replace("R$", "")}
            </span>
          </p>
          {result.marginBps.status === "available" && (
            <p className="mt-1 text-ink-soft">
              <span className="font-semibold text-ink">
                {(result.marginBps.value / 100).toFixed(2).replace(".", ",")}%
              </span>{" "}
              de margem
            </p>
          )}
        </div>
      </div>

      {result.hasEstimatedInputs && <EstimateBadge estimatedGroups={result.estimatedGroups} />}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <FinancialStatement
          title="Como o dinheiro foi distribuído"
          lines={[
            { label: "Faturamento bruto", cents: result.revenue.status === "available" ? result.revenue.value : 0 },
            ...costLines(result),
          ]}
          totalLabel="Lucro estimado"
          totalCents={profitValue}
        />
        <IndicatorList title="Indicadores" rows={indicatorRows} />
      </div>

      {insight && (
        <div className="flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-medium text-ink">{insight}</p>
        </div>
      )}
    </>
  );
}

function PartialResult({ result }: { result: ProfitResult }) {
  const balance = result.balanceBeforeUnknownCosts;
  const knownGroups = result.allCostGroups ?? [];
  const missingCoreFields = result.blindSpots.filter((spot) => spot.field !== "orders" && spot.field !== "goal");
  const missingLabel = missingCoreFields.map((spot) => fieldLabel(spot.field).toLowerCase()).join(" e ");

  return (
    <>
      <div className="grid grid-cols-1 gap-8 border-b border-line pb-10 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-16">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-blue-primary">SEU RAIO-X DO LUCRO</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Ainda não dá para estimar seu lucro com segurança.
          </h1>
          {missingLabel && (
            <p className="text-lg text-ink-soft">
              Você informou vendas e os principais custos, mas {missingLabel} ainda{" "}
              {missingCoreFields.length > 1 ? "são pontos cegos" : "é um ponto cego"}.
            </p>
          )}
        </div>
        <div className="lg:w-72 lg:border-l lg:border-line lg:pl-10">
          <p className="text-ink-soft">Saldo antes dos custos não informados</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl text-ink-faint">
              {balance.status === "available" && balance.value < 0 ? "-R$" : "R$"}
            </span>
            <span className="text-4xl font-semibold text-ink">
              {balance.status === "available"
                ? formatCurrencyDisplay(Math.abs(balance.value)).replace("R$", "")
                : "—"}
            </span>
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            Este é o resultado parcial com base nos dados informados.
          </p>
        </div>
      </div>

      {result.hasEstimatedInputs && <EstimateBadge estimatedGroups={result.estimatedGroups} />}

      {result.profitBeforeTaxes.status === "available" && (
        <div className="border-l-2 border-blue-primary pl-4">
          <p className="text-ink-soft">Resultado antes dos impostos</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {formatCurrencyDisplay(result.profitBeforeTaxes.value)}
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            Este valor ainda não desconta impostos e nunca deve ser lido como lucro final.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <FinancialStatement
          title="O que já sabemos"
          lines={[
            { label: "Faturamento bruto", cents: result.revenue.status === "available" ? result.revenue.value : 0 },
            ...knownGroups.map((group) => ({
              label: fieldLabel(group.group),
              cents: group.totalCents,
              negative: true,
            })),
          ]}
          totalLabel="Subtotal"
          totalCents={balance.status === "available" ? balance.value : 0}
        />
        <BlindSpotList blindSpots={result.blindSpots} />
      </div>
    </>
  );
}
