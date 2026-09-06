import { Card } from "./Card";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}

export function MetricCard({ label, value, hint, emphasis }: MetricCardProps) {
  return (
    <Card>
      <p className="text-sm text-navy/60">{label}</p>
      <p
        className={`mt-1 font-semibold text-navy ${emphasis ? "text-3xl" : "text-2xl"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-navy/50">{hint}</p>}
    </Card>
  );
}
