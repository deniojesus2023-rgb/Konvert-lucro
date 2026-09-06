import { formatCurrencyDisplay } from "@/lib/client/currency";

export interface StatementLine {
  label: string;
  cents: number;
  /** Rendered with a leading "−" — every cost line. Revenue and totals omit it. */
  negative?: boolean;
}

interface FinancialStatementProps {
  title: string;
  lines: readonly StatementLine[];
  totalLabel: string;
  totalCents: number;
}

/** A revenue-minus-costs statement: thin rows, a rule before the total, the total in bold. */
export function FinancialStatement({ title, lines, totalLabel, totalCents }: FinancialStatementProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <dl className="mt-4 flex flex-col">
        {lines.map((line) => (
          <div key={line.label} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
            <dt className="text-ink-soft">{line.label}</dt>
            <dd className="text-ink">
              {line.negative ? `-${formatCurrencyDisplay(line.cents)}` : formatCurrencyDisplay(line.cents)}
            </dd>
          </div>
        ))}
        <div className="mt-1 flex items-baseline justify-between gap-4 border-b-2 border-ink py-3">
          <dt className="font-semibold text-ink">{totalLabel}</dt>
          <dd className="font-semibold text-ink">{formatCurrencyDisplay(totalCents)}</dd>
        </div>
      </dl>
    </div>
  );
}
