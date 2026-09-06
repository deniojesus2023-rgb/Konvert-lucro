import { fieldLabel } from "@/lib/client/field-labels";

interface EstimateBadgeProps {
  estimatedGroups: readonly string[];
}

/**
 * The stored `ProfitResult` records which fields were estimated
 * (`estimatedGroups`) but not, at this snapshot, whether each one came
 * from a typed guess or a range's midpoint — that distinction lives only
 * in `diagnostic_answers.estimate_origin`, one layer below the public
 * result. This badge is therefore general ("valores aproximados"), not
 * per-origin; showing the origin too would need the public endpoint to
 * expose per-field answer detail, which is out of scope here.
 */
export function EstimateBadge({ estimatedGroups }: EstimateBadgeProps) {
  if (estimatedGroups.length === 0) return null;

  return (
    <div className="rounded-2xl border border-blue-light bg-blue-light/40 p-4">
      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-primary">
        Contém valores aproximados
      </span>
      <p className="mt-2 text-sm text-navy/70">
        Estas respostas foram aproximadas e podem ser revisadas a qualquer momento:{" "}
        {estimatedGroups.map(fieldLabel).join(", ")}.
      </p>
    </div>
  );
}
