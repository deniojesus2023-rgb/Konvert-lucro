/** Human copy for each `UnavailableReason` from the domain, used only for display. */
const REASON_LABELS: Record<string, string> = {
  missing_revenue: "falta informar o faturamento",
  missing_required_costs: "falta informar algum custo obrigatório",
  missing_taxes: "falta informar os impostos",
  missing_orders: "quantidade de pedidos desconhecida",
  missing_goal: "meta não informada",
  unclassified_taxes: "não sabemos se esse imposto é fixo ou variável",
  non_positive_contribution_margin: "os custos variáveis consomem toda a receita",
  zero_revenue: "faturamento igual a zero",
  zero_orders: "nenhum pedido no período",
  exceeds_safe_range: "o valor calculado é grande demais para exibir com segurança",
};

export function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? "dado insuficiente";
}
