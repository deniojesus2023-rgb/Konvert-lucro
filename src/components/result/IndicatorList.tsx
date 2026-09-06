export interface IndicatorRow {
  label: string;
  value: string;
}

interface IndicatorListProps {
  title: string;
  rows: readonly IndicatorRow[];
}

export function IndicatorList({ title, rows }: IndicatorListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <dl className="mt-4 flex flex-col">
        {rows.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            className="flex items-baseline justify-between gap-4 border-b border-line py-3"
          >
            <dt className="text-ink-soft">{row.label}</dt>
            <dd className="text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
