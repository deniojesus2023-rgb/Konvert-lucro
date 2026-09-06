"use client";

import { useEffect, useState } from "react";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import {
  emptyOrderUiState,
  orderUiToResponseState,
  responseStateToOrderUi,
} from "@/lib/client/order-answer";
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
    <div className="flex flex-col gap-6">
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
        <div className="flex flex-col gap-2">
          <label htmlFor={id} className="text-sm text-ink-soft">
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
            className="border-b border-line-strong bg-transparent pb-2 text-4xl font-semibold text-ink outline-none placeholder:font-normal placeholder:text-ink-faint transition-colors focus:border-blue-primary sm:text-5xl"
          />
        </div>
      )}

      {note && <p className="text-sm text-ink-soft">{note}</p>}
      {hint && ui.mode === "exact" && <p className="text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}
