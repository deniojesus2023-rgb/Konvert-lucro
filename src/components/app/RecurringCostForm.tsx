"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { createRecurringCost } from "@/lib/client/api";
import { formatCentsForInput, parseCurrencyInput } from "@/lib/client/currency";

interface RecurringCostFormProps {
  establishmentId: string;
}

const EMPTY_MONEY = formatCentsForInput(0);

export function RecurringCostForm({ establishmentId }: RecurringCostFormProps) {
  const router = useRouter();
  const [categoryName, setCategoryName] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(EMPTY_MONEY);
  const [frequency, setFrequency] = useState<"monthly" | "weekly">("monthly");
  const [startDate, setStartDate] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);

    const amountCents = parseCurrencyInput(amount);
    if (amountCents === null || !startDate) {
      setError("Confira os valores preenchidos.");
      setSending(false);
      return;
    }

    try {
      await createRecurringCost(establishmentId, {
        categoryName: categoryName.trim() || "Outros",
        name,
        amountCents,
        frequency,
        startDate,
      });
      setName("");
      setAmount(EMPTY_MONEY);
      router.refresh();
    } catch {
      setError("Não foi possível salvar este custo recorrente agora.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-group">
        <label htmlFor="rcName" className="field-label">
          Nome
        </label>
        <input
          id="rcName"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Aluguel da cozinha"
          className="line-input small"
        />
      </div>
      <div className="input-group">
        <label htmlFor="rcCategory" className="field-label">
          Categoria
        </label>
        <input
          id="rcCategory"
          type="text"
          value={categoryName}
          onChange={(event) => setCategoryName(event.target.value)}
          placeholder="Ex.: Aluguel, Folha, Assinaturas"
          className="line-input small"
        />
      </div>
      <CurrencyInput id="rcAmount" label="Valor" value={amount} onChange={setAmount} />
      <div className="input-group">
        <label htmlFor="rcFrequency" className="field-label">
          Frequência
        </label>
        <select
          id="rcFrequency"
          value={frequency}
          onChange={(event) => setFrequency(event.target.value as "monthly" | "weekly")}
          className="line-input small"
        >
          <option value="monthly">Mensal</option>
          <option value="weekly">Semanal</option>
        </select>
      </div>
      <div className="input-group">
        <label htmlFor="rcStartDate" className="field-label">
          Começa em
        </label>
        <input
          id="rcStartDate"
          type="date"
          required
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="line-input small"
        />
      </div>
      {error && (
        <p className="question-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth disabled={sending}>
        {sending ? "Salvando…" : "Adicionar custo recorrente"}
      </Button>
    </form>
  );
}
