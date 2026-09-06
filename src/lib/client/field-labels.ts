/** Human labels for the domain's field/group keys, shared across result components. */
export const FIELD_LABELS: Record<string, string> = {
  revenue: "Faturamento",
  production: "Produção (ingredientes e embalagens)",
  fees: "Taxas das vendas",
  delivery: "Entregas",
  fixedStructure: "Estrutura e impostos",
  taxes: "Impostos",
  orders: "Pedidos",
  goal: "Meta",
};

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}
