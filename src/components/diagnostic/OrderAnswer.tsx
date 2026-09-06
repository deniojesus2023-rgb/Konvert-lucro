"use client";

import { useEffect, useState } from "react";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import {
  emptyOrderUiState,
  orderUiToResponseState,
  responseStateToOrderUi,
  type OrderUiMode,
} from "@/lib/client/order-answer";

const MODE_LABELS: Record<OrderUiMode, string> = {
  exact: "Quantidade exata",
  unknown: "Não sei",
  zero: "Não tive pedidos",
};

interface OrderAnswerProps {
  id: string;
  label: string;
  value: ResponseState<number> | undefined;
  onChange: (state: ResponseState<number> | null) => void;
}

export function OrderAnswer({ id, label, value, onChange }: OrderAnswerProps) {
  const [ui, setUi] = useState(() => responseStateToOrderUi(value));

  useEffect(() => {
    onChange(orderUiToResponseState(ui));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui]);

  const modes: OrderUiMode[] = ["exact", "unknown", "zero"];

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-base font-semibold text-navy">{label}</legend>

      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {modes.map((mode) => {
          const selected = ui.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setUi((prev) => (prev.mode === mode ? prev : emptyOrderUiState(mode)))}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border-blue-primary bg-blue-light text-navy"
                  : "border-blue-light bg-white text-navy/70 hover:border-blue-primary"
              }`}
            >
              {MODE_LABELS[mode]}
            </button>
          );
        })}
      </div>

      {ui.mode === "exact" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-medium text-navy">
            Número de pedidos
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
            className="min-h-[44px] w-full rounded-xl border border-blue-light bg-white px-4 py-3 text-base text-navy outline-none focus:border-blue-primary"
          />
        </div>
      )}
    </fieldset>
  );
}
