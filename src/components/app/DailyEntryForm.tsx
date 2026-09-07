"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { upsertDailyEntry } from "@/lib/client/api";
import { formatCentsForInput, parseCurrencyInput } from "@/lib/client/currency";
import { todayInTimezone } from "@/lib/dates/period-bounds";

interface DailyEntryFormProps {
  establishmentId: string;
  timezone: string;
}

interface FieldState {
  entryDate: string;
  channelName: string;
  grossRevenue: string;
  orders: string;
  discounts: string;
  cancellations: string;
  knownFees: string;
}

const EMPTY_MONEY = formatCentsForInput(0);

function emptyState(timezone: string): FieldState {
  return {
    entryDate: todayInTimezone(timezone),
    channelName: "",
    grossRevenue: EMPTY_MONEY,
    orders: "0",
    discounts: EMPTY_MONEY,
    cancellations: EMPTY_MONEY,
    knownFees: EMPTY_MONEY,
  };
}

/**
 * The MVP daily-entry form: one submission is one row for
 * (establishment, date, channel). No `expectedVersion` is sent — a second
 * entry for the same date/channel comes back as a 409 telling the owner a
 * lançamento already exists, rather than silently overwriting it.
 */
export function DailyEntryForm({ establishmentId, timezone }: DailyEntryFormProps) {
  const router = useRouter();
  const [fields, setFields] = useState<FieldState>(() => emptyState(timezone));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof FieldState>(key: K, value: FieldState[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);

    const grossRevenueCents = parseCurrencyInput(fields.grossRevenue);
    const discountsCents = parseCurrencyInput(fields.discounts);
    const cancellationsCents = parseCurrencyInput(fields.cancellations);
    const knownFeesCents = parseCurrencyInput(fields.knownFees);
    const ordersCount = Number(fields.orders);

    if (
      grossRevenueCents === null ||
      discountsCents === null ||
      cancellationsCents === null ||
      knownFeesCents === null ||
      !Number.isInteger(ordersCount) ||
      ordersCount < 0
    ) {
      setError("Confira os valores preenchidos.");
      setSending(false);
      return;
    }

    try {
      await upsertDailyEntry(establishmentId, {
        entryDate: fields.entryDate,
        channelName: fields.channelName.trim() ? fields.channelName.trim() : null,
        grossRevenueCents,
        ordersCount,
        discountsCents,
        cancellationsCents,
        knownFeesCents,
      });
      setSaved(true);
      router.refresh();
    } catch {
      setError("Já existe um lançamento para esta data e canal, ou algo deu errado. Confira em Vendas.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-group">
        <label htmlFor="entryDate" className="field-label">
          Data
        </label>
        <input
          id="entryDate"
          type="date"
          required
          value={fields.entryDate}
          onChange={(event) => set("entryDate", event.target.value)}
          className="line-input small"
        />
      </div>
      <div className="input-group">
        <label htmlFor="channelName" className="field-label">
          Canal (opcional)
        </label>
        <input
          id="channelName"
          type="text"
          value={fields.channelName}
          onChange={(event) => set("channelName", event.target.value)}
          placeholder="Ex.: iFood, Balcão, WhatsApp"
          className="line-input small"
        />
      </div>
      <CurrencyInput
        id="grossRevenue"
        label="Faturamento bruto"
        value={fields.grossRevenue}
        onChange={(value) => set("grossRevenue", value)}
      />
      <div className="input-group">
        <label htmlFor="orders" className="field-label">
          Pedidos
        </label>
        <input
          id="orders"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          required
          value={fields.orders}
          onChange={(event) => set("orders", event.target.value)}
          className="line-input small"
        />
      </div>
      <CurrencyInput
        id="discounts"
        label="Descontos"
        value={fields.discounts}
        onChange={(value) => set("discounts", value)}
      />
      <CurrencyInput
        id="cancellations"
        label="Cancelamentos"
        value={fields.cancellations}
        onChange={(value) => set("cancellations", value)}
      />
      <CurrencyInput
        id="knownFees"
        label="Taxas conhecidas (ex.: comissão do app)"
        value={fields.knownFees}
        onChange={(value) => set("knownFees", value)}
      />
      {error && (
        <p className="question-error" role="alert">
          {error}
        </p>
      )}
      {saved && !error && <p className="help-text">Lançamento salvo.</p>}
      <Button type="submit" fullWidth disabled={sending}>
        {sending ? "Salvando…" : "Salvar lançamento"}
      </Button>
    </form>
  );
}
