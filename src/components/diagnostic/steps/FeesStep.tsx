import type { Cents } from "@/domain/money/cents";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import { MonetaryAnswer } from "../MonetaryAnswer";

interface FeesStepProps {
  value: ResponseState<Cents> | null;
  onChange: (state: ResponseState<Cents> | null) => void;
}

export function FeesStep({ value, onChange }: FeesStepProps) {
  return (
    <MonetaryAnswer
      id="cost_fees"
      label="Quanto as vendas consumiram em taxas?"
      description="Some comissões dos aplicativos, taxas de pagamento, cupons pagos pelo delivery, cancelamentos e estornos."
      note="Cada um desses valores entra uma única vez aqui — não repita comissão ou cupom em nenhuma outra etapa."
      zeroLabel="Não tenho esse custo"
      value={value ?? undefined}
      onChange={onChange}
    />
  );
}

export const FEES_STEP_META = {
  title: "Quanto as vendas consumiram em taxas?",
};
