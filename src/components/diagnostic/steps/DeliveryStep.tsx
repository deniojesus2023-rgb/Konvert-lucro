import type { Cents } from "@/domain/money/cents";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import { MonetaryAnswer } from "../MonetaryAnswer";

interface DeliveryStepProps {
  value: ResponseState<Cents> | null;
  onChange: (state: ResponseState<Cents> | null) => void;
}

export function DeliveryStep({ value, onChange }: DeliveryStepProps) {
  return (
    <MonetaryAnswer
      id="cost_delivery"
      label="Quanto você gastou para entregar os pedidos?"
      description="Some motoboys e taxas de entrega pagas pelo estabelecimento."
      zeroLabel="Não tenho esse custo"
      value={value ?? undefined}
      onChange={onChange}
    />
  );
}

export const DELIVERY_STEP_META = {
  title: "Quanto você gastou para entregar os pedidos?",
};
