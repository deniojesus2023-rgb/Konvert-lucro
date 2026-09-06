import { fieldLabel } from "@/lib/client/field-labels";

interface BlindSpotListProps {
  blindSpots: readonly { field: string; kind: string }[];
}

/**
 * Lists the fields that came back unknown/unanswered/an open range —
 * never treated as zero, never folded into the cost ranking. This is the
 * only place they're shown.
 */
export function BlindSpotList({ blindSpots }: BlindSpotListProps) {
  if (blindSpots.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium tracking-wide text-blue-primary">Pontos cegos</p>
      <ul className="mt-3 flex flex-col divide-y divide-line border-t border-line">
        {blindSpots.map((spot) => (
          <li key={spot.field} className="py-3 text-ink">
            {fieldLabel(spot.field)}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-faint">
        Esses custos precisam ser informados para completar a estimativa.
      </p>
    </div>
  );
}
