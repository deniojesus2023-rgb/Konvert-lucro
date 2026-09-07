"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { upsertGoal } from "@/lib/client/api";
import { formatCentsForInput, parseCurrencyInput } from "@/lib/client/currency";

interface GoalFormProps {
  establishmentId: string;
  monthStart: string;
  initialProfitGoalCents: number | null;
}

export function GoalForm({ establishmentId, monthStart, initialProfitGoalCents }: GoalFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState(
    initialProfitGoalCents === null ? formatCentsForInput(0) : formatCentsForInput(initialProfitGoalCents),
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);

    const profitGoalCents = parseCurrencyInput(amount);
    if (profitGoalCents === null) {
      setError("Confira o valor da meta.");
      setSending(false);
      return;
    }

    try {
      await upsertGoal(establishmentId, { periodStart: monthStart, profitGoalCents });
      setSaved(true);
      router.refresh();
    } catch {
      setError("Não foi possível salvar a meta agora.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CurrencyInput id="goalProfit" label="Meta de lucro do mês" value={amount} onChange={setAmount} />
      {error && (
        <p className="question-error" role="alert">
          {error}
        </p>
      )}
      {saved && !error && <p className="help-text">Meta salva.</p>}
      <Button type="submit" fullWidth disabled={sending}>
        {sending ? "Salvando…" : "Salvar meta"}
      </Button>
    </form>
  );
}
