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
    <div className="legal-note">
      <strong>Contém valores aproximados</strong>
      <p>
        Estas respostas foram aproximadas e podem ser revisadas a qualquer momento:{" "}
        {estimatedGroups.map(fieldLabel).join(", ")}.
      </p>
    </div>
  );
}
