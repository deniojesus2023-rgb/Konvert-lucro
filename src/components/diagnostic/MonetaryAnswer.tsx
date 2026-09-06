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
import { AnswerTabs } from "./AnswerTabs";

const MODE_LABELS: Record<Exclude<MonetaryUiMode, "zero">, string> = {
  exact: "Valor exato",
  approximate: "Aproximado",
  range: "Uma faixa",
  unknown: "Não sei",
};

interface MonetaryAnswerProps {
  id: string;
  label: string;
  note?: string;
  /** e.g. "Não tenho esse custo" / "Não tive vendas no período" / "Não tive pedidos". */
  zeroLabel: string;
  value: ResponseState<Cents> | undefined;
  onChange: (state: ResponseState<Cents> | null) => void;
  /**
   * Reduced affordance for fields that don't need estimate nuance (the
   * profit goal): only an exact value plus a single opt-out link, no
   * approximate/range/unknown tabs.
   */
  simplified?: boolean;
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
  note,
  zeroLabel,
  value,
  onChange,
  simplified = false,
}: MonetaryAnswerProps) {
  const [ui, setUi] = useState(() => responseStateToMonetaryUi(value));

  useEffect(() => {
    onChange(monetaryUiToResponseState(ui));
    // Only re-derive when the widget's own state changes — `onChange` is a
    // fresh closure every render and must not retrigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui]);

  return (
    <div className="flex flex-col gap-6">
      {!simplified && (
        <AnswerTabs
          legend="Como você quer responder?"
          name={`${id}-mode`}
          value={ui.mode}
          onChange={(mode) => setUi((prev) => (prev.mode === mode ? prev : emptyMonetaryUiState(mode)))}
          options={[
            { value: "exact", label: MODE_LABELS.exact },
            { value: "approximate", label: MODE_LABELS.approximate },
            { value: "range", label: MODE_LABELS.range },
          ]}
          links={[
            { value: "unknown", label: "Não sei informar" },
            { value: "zero", label: zeroLabel },
          ]}
        />
      )}

      {ui.mode === "exact" && (
        <CurrencyInput
          id={`${id}-exact`}
          label={label}
          value={ui.exactValue}
          onChange={(exactValue) => setUi((prev) => ({ ...prev, exactValue }))}
        />
      )}

      {ui.mode === "approximate" && (
        <CurrencyInput
          id={`${id}-approx`}
          label={label}
          value={ui.approximateValue}
          onChange={(approximateValue) => setUi((prev) => ({ ...prev, approximateValue }))}
        />
      )}

      {ui.mode === "range" && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <CurrencyInput
            id={`${id}-min`}
            label="De"
            value={ui.rangeMin}
            onChange={(rangeMin) => setUi((prev) => ({ ...prev, rangeMin }))}
            large={false}
          />
          <CurrencyInput
            id={`${id}-max`}
            label="Até (deixe em branco se não tiver um teto)"
            value={ui.rangeMax}
            onChange={(rangeMax) => setUi((prev) => ({ ...prev, rangeMax }))}
            placeholder="Sem limite"
            large={false}
          />
        </div>
      )}

      {note && <p className="text-sm text-ink-soft">{note}</p>}

      {simplified && (
        <div>
          <label className="relative cursor-pointer rounded-sm outline-offset-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-primary">
            <input
              type="radio"
              name={`${id}-mode`}
              checked={ui.mode === "zero"}
              onChange={() => setUi((prev) => (prev.mode === "zero" ? prev : emptyMonetaryUiState("zero")))}
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
            />
            <span
              className={`text-sm underline decoration-line-strong underline-offset-4 hover:decoration-ink ${
                ui.mode === "zero" ? "font-medium text-blue-primary decoration-blue-primary" : "text-ink-soft"
              }`}
            >
              {zeroLabel}
            </span>
          </label>
          {ui.mode === "zero" && (
            <button
              type="button"
              onClick={() => setUi(emptyMonetaryUiState("exact"))}
              className="ml-4 text-sm text-blue-primary underline underline-offset-4"
            >
              Informar um valor
            </button>
          )}
        </div>
      )}
    </div>
  );
}
