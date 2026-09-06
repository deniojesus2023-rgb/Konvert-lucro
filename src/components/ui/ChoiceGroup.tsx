"use client";

interface ChoiceGroupProps {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string) => void;
  name: string;
}

/** A single-select group of pill buttons — used for profile/classification questions. */
export function ChoiceGroup({ label, options, value, onChange, name }: ChoiceGroupProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-base font-semibold text-navy">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              data-testid={`${name}-${option}`}
              onClick={() => onChange(option)}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border-blue-primary bg-blue-light text-navy"
                  : "border-blue-light bg-white text-navy/70 hover:border-blue-primary"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
