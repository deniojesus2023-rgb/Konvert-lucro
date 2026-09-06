"use client";

import { useEffect, useState } from "react";
import type { Cents } from "@/domain/money/cents";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import {
  emptyMonetaryUiState,
  monetaryUiToResponseState,
  responseStateToMonetaryUi,
  type MonetaryUiMode,
} from "@/lib/client/monetary-answer";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

const MODE_LABELS: Record<Exclude<MonetaryUiMode, "zero">, string> = {
  exact: "Valor exato",
  approximate: "Valor aproximado",
  range: "Informar uma faixa",
  unknown: "Não sei",
};

interface MonetaryAnswerProps {
  id: string;
  label: string;
  description?: string;
  note?: string;
  /** e.g. "Não tenho esse custo" / "Não tive vendas no período" / "Não tive pedidos". */
  zeroLabel: string;
  value: ResponseState<Cents> | undefined;
  onChange: (state: ResponseState<Cents> | null) => void;
}

/**
 * The reusable monetary-answer widget: five visible choices (exact,
 * approximate, range, unknown, zero), each mapping to one of the six
 * `ResponseState` shapes via `src/lib/client/monetary-answer.ts`. An
 * incomplete field reports `null` to the parent rather than a guessed
 * value, so "Continuar" can stay disabled until there's a real answer.
 */
export function MonetaryAnswer({
  id,
  label,
  description,
  note,
  zeroLabel,
  value,
  onChange,
}: MonetaryAnswerProps) {
  const [ui, setUi] = useState(() => responseStateToMonetaryUi(value));

  useEffect(() => {
    onChange(monetaryUiToResponseState(ui));
    // Only re-derive when the widget's own state changes — `onChange` is a
    // fresh closure every render and must not retrigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui]);

  const modes: MonetaryUiMode[] = ["exact", "approximate", "range", "unknown", "zero"];

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-lg font-semibold text-navy">{label}</legend>
      {description && <p className="text-sm text-navy/70">{description}</p>}

      <div
        role="radiogroup"
        aria-label={`Como você quer responder: ${label}`}
        className="flex flex-wrap gap-2"
      >
        {modes.map((mode) => {
          const selected = ui.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setUi((prev) => (prev.mode === mode ? prev : emptyMonetaryUiState(mode)))}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border-blue-primary bg-blue-light text-navy"
                  : "border-blue-light bg-white text-navy/70 hover:border-blue-primary"
              }`}
            >
              {mode === "zero" ? zeroLabel : MODE_LABELS[mode]}
            </button>
          );
        })}
      </div>

      {ui.mode === "exact" && (
        <CurrencyInput
          id={`${id}-exact`}
          label="Valor"
          value={ui.exactValue}
          onChange={(exactValue) => setUi((prev) => ({ ...prev, exactValue }))}
        />
      )}

      {ui.mode === "approximate" && (
        <CurrencyInput
          id={`${id}-approx`}
          label="Valor aproximado"
          value={ui.approximateValue}
          onChange={(approximateValue) => setUi((prev) => ({ ...prev, approximateValue }))}
        />
      )}

      {ui.mode === "range" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CurrencyInput
            id={`${id}-min`}
            label="De"
            value={ui.rangeMin}
            onChange={(rangeMin) => setUi((prev) => ({ ...prev, rangeMin }))}
          />
          <CurrencyInput
            id={`${id}-max`}
            label="Até (deixe em branco se não tiver um teto)"
            value={ui.rangeMax}
            onChange={(rangeMax) => setUi((prev) => ({ ...prev, rangeMax }))}
            placeholder="Sem limite"
          />
        </div>
      )}

      {note && <p className="text-xs text-navy/60">{note}</p>}
    </fieldset>
  );
}
