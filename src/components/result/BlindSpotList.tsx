import { fieldLabel } from "@/lib/client/field-labels";

const BLIND_SPOT_HINTS: Record<string, string> = {
  revenue: "Quanto o delivery vendeu no período",
  production: "Ingredientes e embalagens",
  fees: "Comissões, pagamentos e cupons",
  delivery: "Motoboys e logística",
  fixedStructure: "Aluguel, folha, sistemas e despesas fixas",
  taxes: "Valor e classificação do imposto",
  orders: "Quantidade de pedidos no período",
  goal: "Meta de lucro mensal",
};

interface BlindSpotListProps {
  blindSpots: readonly { field: string; kind: string }[];
}

/**
 * Lists the fields that came back unknown/unanswered/an open range —
 * never treated as zero, never folded into the cost statement. This is
 * the only place they're shown.
 */
export function BlindSpotList({ blindSpots }: BlindSpotListProps) {
  if (blindSpots.length === 0) return null;

  return (
    <section className="missing-list">
      <h2>O que falta informar</h2>
      {blindSpots.map((spot) => (
        <div key={spot.field} className="statement-row">
          <div>
            <strong>{fieldLabel(spot.field)}</strong>
            <small>{BLIND_SPOT_HINTS[spot.field] ?? ""}</small>
          </div>
          <span>Ponto cego</span>
        </div>
      ))}
      <p className="help-text">Sem esses valores, margem, lucro e ponto de equilíbrio ficam indisponíveis.</p>
    </section>
  );
}
