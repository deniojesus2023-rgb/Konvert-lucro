"use client";

interface CurrencyInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  /** Matches the prototype's smaller `.line-input.small` variant used for range fields. */
  large?: boolean;
}

/**
 * A pt-BR currency field. `inputMode="decimal"` brings up the numeric
 * keypad on mobile; parsing/formatting itself lives in
 * `src/lib/client/currency.ts` (which wraps the domain's money module) —
 * this component only carries the raw string the user is typing.
 */
export function CurrencyInput({ id, label, value, onChange, placeholder, error, large = true }: CurrencyInputProps) {
  return (
    <div className="input-group">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="currency-wrap">
        <input
          id={id}
          name={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? "0,00"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`line-input ${large ? "" : "small"}`}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="question-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
