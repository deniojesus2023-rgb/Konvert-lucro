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
      <p className="font-medium text-navy">Maiores custos</p>
      <ul className="mt-2 flex flex-col gap-2">
        {groups.map((group) => (
          <li
            key={group.group}
            className="flex items-center justify-between rounded-xl border border-blue-light bg-white px-4 py-3"
          >
            <span className="text-navy/80">
              {fieldLabel(group.group)}
              {group.isEstimated && <span className="ml-2 text-xs text-blue-primary">(estimado)</span>}
            </span>
            <span className="font-semibold text-navy">{formatCurrencyDisplay(group.totalCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
