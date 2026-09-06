interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}

/** One statement row: label left, value right, a thin line beneath — no card, no shadow. */
export function MetricCard({ label, value, hint, emphasis }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <p className="text-ink-soft">{label}</p>
      <div className="flex flex-col items-start gap-0.5 sm:items-end">
        <p className={`font-semibold text-ink ${emphasis ? "text-3xl" : "text-xl"}`}>{value}</p>
        {hint && <p className="text-xs text-ink-faint">{hint}</p>}
      </div>
    </div>
  );
}
