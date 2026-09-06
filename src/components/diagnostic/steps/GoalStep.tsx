import type { Cents } from "@/domain/money/cents";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import { MonetaryAnswer } from "../MonetaryAnswer";

interface GoalStepProps {
  value: ResponseState<Cents> | null;
  onChange: (state: ResponseState<Cents> | null) => void;
}

export function GoalStep({ value, onChange }: GoalStepProps) {
  return (
    <MonetaryAnswer
      id="goal"
      label="Quanto você gostaria que sobrasse no mês?"
      description="Essa meta será comparada com o resultado estimado do delivery."
      zeroLabel="Não tenho uma meta definida"
      value={value ?? undefined}
      onChange={onChange}
    />
  );
}

export const GOAL_STEP_META = {
  title: "Quanto você gostaria que sobrasse no mês?",
};
