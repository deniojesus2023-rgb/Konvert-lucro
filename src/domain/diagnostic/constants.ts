/**
 * Bumped whenever the calculation logic in this module changes in a way
 * that could produce different numbers for the same input. Persisted
 * alongside every stored result so historical results stay explainable
 * even after the formula evolves.
 */
export const FORMULA_VERSION = "1.1.0";

/** The four cost groups that must all be resolved for a confirmed profit. */
export const REQUIRED_COST_GROUPS = [
  "production",
  "fees",
  "delivery",
  "fixedStructure",
] as const;

export type CostGroupKey = (typeof REQUIRED_COST_GROUPS)[number];

export const TAX_CLASSIFICATIONS = ["fixed", "variable", "unclassified"] as const;
export type TaxClassification = (typeof TAX_CLASSIFICATIONS)[number];

/**
 * What this estimate does and does not account for. Reused verbatim as
 * help text on the result screen — kept here so the domain module and the
 * UI never drift apart.
 */
export const ESTIMATE_SCOPE_NOTES = {
  revenueDefinition:
    "Receita é o faturamento bruto de vendas (o valor cobrado do cliente), não o repasse líquido que cai na conta depois dos descontos do aplicativo.",
  singleDeduction:
    "Comissões, taxas de pagamento, cupons subsidiados e estornos são descontados uma única vez, dentro do grupo de taxas — nunca em outro grupo.",
  taxes:
    "Impostos são o valor informado pelo usuário; nenhuma alíquota é presumida.",
  proLabore:
    "Pró-labore, quando pago, é tratado como parte da folha (custo fixo) — o lucro calculado é o resultado do negócio antes de qualquer distribuição adicional ao dono.",
  ingredients:
    "O custo de ingredientes e embalagens é tratado como aproximação do que foi consumido nas vendas do período, não do que foi comprado — não há controle de estoque nesta fase.",
  disclaimer:
    "Todo resultado é uma estimativa autodeclarada a partir das respostas do usuário, não uma auditoria contábil.",
} as const;
