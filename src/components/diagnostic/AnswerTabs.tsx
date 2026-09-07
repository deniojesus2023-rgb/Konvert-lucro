"use client";

interface AnswerTabsProps<T extends string> {
  legend: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Extra options appended to the same pill row (e.g. "Não sei informar"). */
  links?: readonly { value: T; label: string }[];
}

/** One radiogroup of pill buttons — matches the prototype's `.response-types` row. */
export function AnswerTabs<T extends string>({ legend, name, options, value, onChange, links }: AnswerTabsProps<T>) {
  const all = links ? [...options, ...links] : options;
  return (
    <div className="response-types" role="radiogroup" aria-label={legend}>
      {all.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            name={name}
            className={`response-type ${selected ? "selected" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
