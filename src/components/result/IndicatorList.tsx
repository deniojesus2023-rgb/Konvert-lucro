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
    <section>
      <h2>{title}</h2>
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className="statement-row">
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </section>
  );
}
