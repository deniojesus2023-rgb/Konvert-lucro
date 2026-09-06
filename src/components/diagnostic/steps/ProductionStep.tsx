import type { Cents } from "@/domain/money/cents";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import { MonetaryAnswer } from "../MonetaryAnswer";

interface ProductionStepProps {
  value: ResponseState<Cents> | null;
  onChange: (state: ResponseState<Cents> | null) => void;
}

export function ProductionStep({ value, onChange }: ProductionStepProps) {
  return (
    <MonetaryAnswer
      id="cost_production"
      label="Quanto você gastou com produção?"
      description="Some ingredientes e embalagens usados aproximadamente nas vendas dos últimos 30 dias."
      note="Use como aproximação o que foi consumido no período, não necessariamente tudo o que foi comprado para estoque."
      zeroLabel="Não tenho esse custo"
      value={value ?? undefined}
      onChange={onChange}
    />
  );
}

export const PRODUCTION_STEP_META = {
  title: "Quanto você gastou com produção?",
};
