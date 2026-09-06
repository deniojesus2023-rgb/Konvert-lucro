"use client";

interface AnswerTabsProps<T extends string> {
  legend: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Extra options rendered as plain underlined links after the tabs (e.g. "Não sei informar"). */
  links?: readonly { value: T; label: string }[];
}

/**
 * One radiogroup, two visual treatments: the primary ways of answering
 * render as an underlined tab row, the exemption states ("não sei",
 * "não tenho esse custo") render as smaller text links — matching the
 * new visual system while staying one semantic radio group.
 */
export function AnswerTabs<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  links,
}: AnswerTabsProps<T>) {
  return (
    <fieldset>
      <legend className="text-sm text-ink-soft">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="mt-3 flex flex-wrap gap-6">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className="relative cursor-pointer rounded-sm pb-2 outline-offset-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-primary"
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
              />
              <span
                className={`border-b-2 pb-2 text-base transition-colors ${
                  selected
                    ? "border-blue-primary font-semibold text-ink"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      {links && links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-6">
          {links.map((link) => {
            const selected = link.value === value;
            return (
              <label
                key={link.value}
                className="relative cursor-pointer rounded-sm outline-offset-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-primary"
              >
                <input
                  type="radio"
                  name={name}
                  value={link.value}
                  checked={selected}
                  onChange={() => onChange(link.value)}
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                />
                <span
                  className={`text-sm underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink ${
                    selected ? "font-medium text-blue-primary decoration-blue-primary" : "text-ink-soft"
                  }`}
                >
                  {link.label}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
