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
    <div>
      <h2 className="text-lg font-semibold text-ink">O que falta informar</h2>
      <dl className="mt-4 flex flex-col">
        {blindSpots.map((spot) => (
          <div key={spot.field} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
            <dt className="text-ink">{fieldLabel(spot.field)}</dt>
            <dd className="text-right text-ink-soft">{BLIND_SPOT_HINTS[spot.field] ?? ""}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-ink-soft">
        Sem esses valores, margem, lucro e ponto de equilíbrio ficam indisponíveis.
      </p>
    </div>
  );
}
