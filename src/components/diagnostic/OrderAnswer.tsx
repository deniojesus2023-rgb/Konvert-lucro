"use client";

import { useEffect, useState } from "react";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import { emptyOrderUiState, orderUiToResponseState, responseStateToOrderUi } from "@/lib/client/order-answer";
import { AnswerTabs } from "./AnswerTabs";

interface OrderAnswerProps {
  id: string;
  label: string;
  note?: string;
  /** e.g. "Ticket médio estimado · R$50,00" — a read-only derived hint. */
  hint?: string;
  value: ResponseState<number> | undefined;
  onChange: (state: ResponseState<number> | null) => void;
}

export function OrderAnswer({ id, label, note, hint, value, onChange }: OrderAnswerProps) {
  const [ui, setUi] = useState(() => responseStateToOrderUi(value));

  useEffect(() => {
    onChange(orderUiToResponseState(ui));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui]);

  return (
    <>
      <AnswerTabs
        legend="Como você quer responder?"
        name={`${id}-mode`}
        value={ui.mode}
        onChange={(mode) => setUi((prev) => (prev.mode === mode ? prev : emptyOrderUiState(mode)))}
        options={[
          { value: "exact", label: "Quantidade exata" },
          { value: "unknown", label: "Não sei" },
          { value: "zero", label: "Não tive pedidos" },
        ]}
      />

      {ui.mode === "exact" && (
        <div className="input-group">
          <label htmlFor={id} className="field-label">
            {label}
          </label>
          <input
            id={id}
            name={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={ui.value}
            onChange={(event) => setUi((prev) => ({ ...prev, value: event.target.value }))}
            placeholder="0"
            className="line-input"
          />
        </div>
      )}

      {ui.mode === "unknown" && (
        <p className="help-text">O lucro por pedido ficará indisponível, mas as demais métricas poderão ser calculadas.</p>
      )}
      {ui.mode === "zero" && <p className="help-text">Você confirmou que não houve pedidos no período.</p>}

      {note && <p className="help-text">{note}</p>}
      {hint && ui.mode === "exact" && <p className="help-text">{hint}</p>}
    </>
  );
}
