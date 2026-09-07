"use client";

interface ChoiceGroupProps {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string) => void;
  name: string;
}

/** A single-select list of rows — matches the prototype's `.choice-row` exactly. */
export function ChoiceGroup({ label, options, value, onChange, name }: ChoiceGroupProps) {
  return (
    <div className="choice-list" role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            name={name}
            className={`choice-row ${selected ? "selected" : ""}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
