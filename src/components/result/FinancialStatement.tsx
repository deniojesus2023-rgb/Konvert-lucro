import { formatCurrencyDisplay } from "@/lib/client/currency";

export interface StatementLine {
  label: string;
  cents: number;
  /** A cost line — rendered with a leading "−" before the label. Revenue and totals omit it. */
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
    <section>
      <h2>{title}</h2>
      {lines.map((line) => (
        <div key={line.label} className="statement-row">
          <span>
            {line.negative && "− "}
            {line.label}
          </span>
          <strong>{formatCurrencyDisplay(line.cents)}</strong>
        </div>
      ))}
      <div className="statement-row total">
        <span>{totalLabel}</span>
        <strong>{formatCurrencyDisplay(totalCents)}</strong>
      </div>
    </section>
  );
}
