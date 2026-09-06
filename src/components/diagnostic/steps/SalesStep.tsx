import type { Cents } from "@/domain/money/cents";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import { MonetaryAnswer } from "../MonetaryAnswer";
import { OrderAnswer } from "../OrderAnswer";

interface SalesStepProps {
  revenue: ResponseState<Cents> | null;
  orders: ResponseState<number> | null;
  onRevenueChange: (state: ResponseState<Cents> | null) => void;
  onOrdersChange: (state: ResponseState<number> | null) => void;
}

export function SalesStep({ revenue, orders, onRevenueChange, onOrdersChange }: SalesStepProps) {
  return (
    <div className="flex flex-col gap-8">
      <MonetaryAnswer
        id="revenue"
        label="Quanto seu delivery vendeu nos últimos 30 dias?"
        description="Informe o valor total cobrado dos clientes, antes das taxas e descontos do aplicativo. Não use somente o valor líquido que caiu na conta."
        zeroLabel="Não tive vendas no período"
        value={revenue ?? undefined}
        onChange={onRevenueChange}
      />
      <OrderAnswer
        id="orders"
        label="Quantos pedidos você teve no período?"
        value={orders ?? undefined}
        onChange={onOrdersChange}
      />
    </div>
  );
}

export const SALES_STEP_META = {
  title: "Quanto seu delivery vendeu nos últimos 30 dias?",
};
