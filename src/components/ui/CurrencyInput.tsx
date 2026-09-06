"use client";

interface CurrencyInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

/**
 * A pt-BR currency field. `inputMode="decimal"` brings up the numeric
 * keypad on mobile; parsing/formatting itself lives in
 * `src/lib/client/currency.ts` (which wraps the domain's money module) —
 * this component only carries the raw string the user is typing.
 */
export function CurrencyInput({ id, label, value, onChange, placeholder, error }: CurrencyInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-navy">
        {label}
      </label>
      <div
        className={`flex min-h-[44px] items-center rounded-xl border bg-white px-4 focus-within:border-blue-primary ${
          error ? "border-red-400" : "border-blue-light"
        }`}
      >
        <span className="mr-1 text-navy/50">R$</span>
        <input
          id={id}
          name={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? "0,00"}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-navy outline-none"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
