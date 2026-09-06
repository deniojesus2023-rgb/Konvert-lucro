"use client";

interface ChoiceGroupProps {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string) => void;
  name: string;
}

function letterFor(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * A single-select list of lettered rows (A, B, C…) — real radio inputs so
 * keyboard and screen-reader behavior comes from the browser, not custom
 * ARIA. Selection reads by a left accent bar, bold label and a checkmark,
 * never by color alone.
 */
export function ChoiceGroup({ label, options, value, onChange, name }: ChoiceGroupProps) {
  return (
    <fieldset>
      <legend className="text-base text-ink">{label}</legend>
      <div className="mt-4 flex flex-col divide-y divide-line border-t border-line">
        {options.map((option, index) => {
          const selected = value === option;
          const id = `${name}-${option}`;
          return (
            <label
              key={option}
              htmlFor={id}
              className={`relative flex min-h-[44px] cursor-pointer items-center gap-4 border-l-2 py-4 pl-4 pr-2 outline-offset-2 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-primary ${
                selected ? "border-l-blue-primary" : "border-l-transparent hover:border-l-line-strong"
              }`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
              />
              <span
                aria-hidden="true"
                className={`w-5 shrink-0 text-sm ${selected ? "text-blue-primary" : "text-ink-faint"}`}
              >
                {letterFor(index)}
              </span>
              <span className={`flex-1 text-base ${selected ? "font-semibold text-ink" : "text-ink"}`}>
                {option}
              </span>
              {selected && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-5 w-5 shrink-0 text-blue-primary"
                  fill="none"
                >
                  <path
                    d="M4 10.5l3.5 3.5L16 5.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
