import { formatCurrencyDisplay } from "@/lib/client/currency";
import { fieldLabel } from "@/lib/client/field-labels";
import type { CostBucket } from "@/domain/diagnostic/types";

interface TopCostGroupsProps {
  groups: readonly CostBucket[];
}

/** Only resolved groups ever get ranked here — an unknown cost never enters this list. */
export function TopCostGroups({ groups }: TopCostGroupsProps) {
  if (groups.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium tracking-wide text-blue-primary">Maiores custos</p>
      <ul className="mt-3 flex flex-col divide-y divide-line border-t border-line">
        {groups.map((group) => (
          <li key={group.group} className="flex items-baseline justify-between gap-4 py-3">
            <span className="text-ink">
              {fieldLabel(group.group)}
              {group.isEstimated && <span className="ml-2 text-xs text-blue-primary">(estimado)</span>}
            </span>
            <span className="font-semibold text-ink">{formatCurrencyDisplay(group.totalCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
