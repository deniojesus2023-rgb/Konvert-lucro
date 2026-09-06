import type { Cents } from "@/domain/money/cents";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { MonetaryAnswer } from "../MonetaryAnswer";
import { taxesNeedClassification, type TaxClassification } from "../wizard-types";

const CLASSIFICATION_LABELS: Record<TaxClassification, string> = {
  variable: "Sim, varia com as vendas",
  fixed: "Não, é um valor fixo",
  unclassified: "Não sei classificar",
};

interface StructureStepProps {
  fixedStructure: ResponseState<Cents> | null;
  taxes: ResponseState<Cents> | null;
  taxClassification: TaxClassification | null;
  onFixedStructureChange: (state: ResponseState<Cents> | null) => void;
  onTaxesChange: (state: ResponseState<Cents> | null) => void;
  onTaxClassificationChange: (value: TaxClassification) => void;
}

export function StructureStep({
  fixedStructure,
  taxes,
  taxClassification,
  onFixedStructureChange,
  onTaxesChange,
  onTaxClassificationChange,
}: StructureStepProps) {
  const needsClassification = taxesNeedClassification(taxes);

  return (
    <div className="flex flex-col gap-8">
      <MonetaryAnswer
        id="cost_fixed_structure"
        label="Quanto custa manter seu delivery funcionando?"
        description="Some aluguel, folha e pró-labore formal, água, energia, internet, sistemas, anúncios e outros custos fixos."
        zeroLabel="Não tenho esse custo"
        value={fixedStructure ?? undefined}
        onChange={onFixedStructureChange}
      />

      <MonetaryAnswer
        id="taxes"
        label="Quanto você pagou de impostos no período?"
        note="Nunca estimamos imposto por alíquota — use o valor que você realmente pagou."
        zeroLabel="Não paguei imposto no período"
        value={taxes ?? undefined}
        onChange={onTaxesChange}
      />

      {needsClassification && (
        <ChoiceGroup
          name="taxClassification"
          label="Esse imposto varia conforme o valor vendido?"
          options={Object.values(CLASSIFICATION_LABELS)}
          value={taxClassification ? CLASSIFICATION_LABELS[taxClassification] : null}
          onChange={(label) => {
            const entry = (Object.entries(CLASSIFICATION_LABELS) as [TaxClassification, string][]).find(
              ([, text]) => text === label,
            );
            if (entry) onTaxClassificationChange(entry[0]);
          }}
        />
      )}
    </div>
  );
}

export const STRUCTURE_STEP_META = {
  title: "Quanto custa manter seu delivery funcionando?",
};
