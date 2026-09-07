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
    <>
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
          label={`Valor aproximado`}
          value={ui.approximateValue}
          onChange={(approximateValue) => setUi((prev) => ({ ...prev, approximateValue }))}
        />
      )}

      {ui.mode === "range" && (
        <div className="range-grid">
          <CurrencyInput
            id={`${id}-min`}
            label="Valor mínimo"
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

      {ui.mode === "unknown" && (
        <p className="help-text">
          Tudo bem não saber. Essa informação aparecerá como ponto cego no resultado e nunca será
          transformada em zero.
        </p>
      )}

      {ui.mode === "zero" && <p className="help-text">Você confirmou que esse valor foi zero no período.</p>}

      {note && <p className="help-text">{note}</p>}

      {simplified && (
        <div className="response-types">
          <button
            type="button"
            role="radio"
            aria-checked={ui.mode === "zero"}
            className={`response-type ${ui.mode === "zero" ? "selected" : ""}`}
            onClick={() => setUi((prev) => (prev.mode === "zero" ? prev : emptyMonetaryUiState("zero")))}
          >
            {zeroLabel}
          </button>
          {ui.mode === "zero" && (
            <button type="button" className="text-link" onClick={() => setUi(emptyMonetaryUiState("exact"))}>
              Informar um valor
            </button>
          )}
        </div>
      )}
    </>
  );
}
