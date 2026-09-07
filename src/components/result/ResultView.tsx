import type { Cents } from "@/domain/money/cents";
import type { ProfitResult } from "@/domain/diagnostic/types";
import { formatCurrencyDisplay, formatWholeReais } from "@/lib/client/currency";
import { fieldLabel } from "@/lib/client/field-labels";
import { FireFunnelEvent } from "@/components/analytics/FireFunnelEvent";
import { ResultHeader } from "./ResultHeader";
import { EstimateBadge } from "./EstimateBadge";
import { ResultDisclaimer } from "./ResultDisclaimer";
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
    <>
      <FireFunnelEvent
        event={{
          eventName: "result_viewed",
          metadata: { resultMode: profitAvailable ? "available" : "partial" },
        }}
      />

      <ResultHeader />

      {profitAvailable ? <AvailableResult result={result} /> : <PartialResult result={result} />}
    </>
  );
}

function AvailableResult({ result }: { result: ProfitResult }) {
  const profitValue = result.profit.status === "available" ? result.profit.value : (0 as Cents);
  const takeHome = result.takeHomePer100Cents;
  const takeHomeText = takeHome.status === "available" ? formatWholeReais(takeHome.value) : "?";

  const goalCents = result.gapToGoal.status === "available" ? profitValue + result.gapToGoal.value : null;

  const indicatorRows = [
    {
      label: "Lucro por pedido",
      value: result.profitPerOrder.status === "available" ? formatCurrencyDisplay(result.profitPerOrder.value) : "Indisponível",
    },
    {
      label: "Ponto de equilíbrio",
      value:
        result.breakEvenRevenue.status === "available" ? formatCurrencyDisplay(result.breakEvenRevenue.value) : "Indisponível",
    },
    {
      label: "Ponto de equilíbrio",
      value:
        result.breakEvenOrders.status === "available"
          ? `${result.breakEvenOrders.value.toLocaleString("pt-BR")} pedidos`
          : "Indisponível",
    },
    ...(goalCents !== null ? [{ label: "Meta mensal", value: formatCurrencyDisplay(goalCents) }] : []),
    {
      label: result.gapToGoal.status === "available" && result.gapToGoal.value < 0 ? "Superou a meta em" : "Faltam para a meta",
      value: result.gapToGoal.status === "available" ? formatCurrencyDisplay(Math.abs(result.gapToGoal.value)) : "Indisponível",
    },
  ];

  const topGroup = result.topCostGroups[0];
  const insight =
    topGroup && result.revenue.status === "available" && result.revenue.value > 0
      ? `Seu maior custo é ${fieldLabel(topGroup.group)}: ele representa ${Math.round(
          (topGroup.totalCents / result.revenue.value) * 100,
        )}% do faturamento.`
      : null;

  return (
    <div className="result-page">
      <div className="result-top">
        <div>
          <p className="eyebrow">Seu Raio-X do Lucro</p>
          <h1>
            {profitValue < 0 ? (
              <>Seu delivery teve um resultado negativo estimado de {formatCurrencyDisplay(Math.abs(profitValue))} no período.</>
            ) : (
              <>
                De cada R$100 vendidos,
                <br />
                {takeHomeText} ficaram no seu delivery.
              </>
            )}
          </h1>
        </div>
        <div className="result-primary">
          <span>Lucro mensal estimado</span>
          <strong>{formatCurrencyDisplay(profitValue)}</strong>
          {result.marginBps.status === "available" && (
            <small>
              <span>{(result.marginBps.value / 100).toFixed(2).replace(".", ",")}%</span> de margem
            </small>
          )}
        </div>
      </div>

      {result.hasEstimatedInputs && <EstimateBadge estimatedGroups={result.estimatedGroups} />}

      <div className="result-columns">
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

      {insight && <div className="insight-line">{insight}</div>}

      <OfferBridge knownCostsTotalCents={result.knownCostsTotalCents} />
      <ResultDisclaimer />
    </div>
  );
}

function PartialResult({ result }: { result: ProfitResult }) {
  const balance = result.balanceBeforeUnknownCosts;
  const knownGroups = result.allCostGroups ?? [];
  const missingCoreFields = result.blindSpots.filter((spot) => spot.field !== "orders" && spot.field !== "goal");
  const missingLabel = missingCoreFields.map((spot) => fieldLabel(spot.field).toLowerCase()).join(" e ");

  return (
    <div className="result-page">
      <div className="result-top partial-top">
        <div>
          <p className="eyebrow">Seu Raio-X do Lucro</p>
          <h1>Ainda não dá para estimar seu lucro com segurança.</h1>
          {missingLabel && (
            <p className="hero-lede">
              Você informou vendas e os principais custos, mas {missingLabel} ainda{" "}
              {missingCoreFields.length > 1 ? "são pontos cegos" : "é um ponto cego"}.
            </p>
          )}
        </div>
        <div className="result-primary">
          <span>Saldo antes dos custos não informados</span>
          <strong>{balance.status === "available" ? formatCurrencyDisplay(balance.value) : "—"}</strong>
          <small>Este valor ainda não é lucro.</small>
        </div>
      </div>

      {result.hasEstimatedInputs && <EstimateBadge estimatedGroups={result.estimatedGroups} />}

      {result.profitBeforeTaxes.status === "available" && (
        <div className="insight-line">
          <p className="eyebrow muted">Resultado antes dos impostos</p>
          <p>{formatCurrencyDisplay(result.profitBeforeTaxes.value)}</p>
          <p className="help-text">Este valor ainda não desconta impostos e nunca deve ser lido como lucro final.</p>
        </div>
      )}

      <div className="result-columns">
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

      <PartialCtaBand />
      <ResultDisclaimer />
    </div>
  );
}
