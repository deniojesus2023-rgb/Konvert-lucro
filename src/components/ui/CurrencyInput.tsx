"use client";

interface CurrencyInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  /** Large editorial numeral style (the primary answer field). Defaults to true. */
  large?: boolean;
}

/**
 * A pt-BR currency field. `inputMode="decimal"` brings up the numeric
 * keypad on mobile; parsing/formatting itself lives in
 * `src/lib/client/currency.ts` (which wraps the domain's money module) —
 * this component only carries the raw string the user is typing.
 */
export function CurrencyInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  large = true,
}: CurrencyInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-ink-soft">
        {label}
      </label>
      <div
        className={`flex items-baseline gap-2 border-b pb-2 transition-colors focus-within:border-blue-primary ${
          error ? "border-red-400" : "border-line-strong"
        }`}
      >
        <span className={`text-ink-faint ${large ? "text-2xl" : "text-base"}`}>R$</span>
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
          className={`min-w-0 flex-1 bg-transparent font-semibold text-ink outline-none placeholder:text-ink-faint placeholder:font-normal ${
            large ? "text-4xl sm:text-5xl" : "text-xl"
          }`}
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
