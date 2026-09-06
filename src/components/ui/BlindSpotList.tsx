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
      <p className="font-medium text-navy">Pontos cegos</p>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-navy/70">
        {blindSpots.map((spot) => (
          <li key={spot.field} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blue-support" />
            {fieldLabel(spot.field)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-navy/60">
        Esses custos precisam ser informados para completar a estimativa.
      </p>
    </div>
  );
}
