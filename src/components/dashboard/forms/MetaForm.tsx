"use client";

import { useState } from "react";
import { useDashboardData, parseCurrencyInput } from "../DashboardDataContext";
import { useDashboard } from "../DashboardContext";
import { Modal } from "../Modal";

interface MetaFormProps {
  open: boolean;
  onClose: () => void;
}

export function MetaForm({ open, onClose }: MetaFormProps) {
  const { profitGoalCents, setProfitGoal } = useDashboardData();
  const { toast } = useDashboard();

  const [valor, setValor] = useState(() => (profitGoalCents !== null ? String(profitGoalCents / 100).replace(".", ",") : ""));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = parseCurrencyInput(valor);
    if (cents === null) return;
    setSaving(true);
    try {
      await setProfitGoal(cents);
      toast("Meta atualizada.");
      onClose();
    } catch {
      toast("Não foi possível salvar a meta agora.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Meta de lucro do mês" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="field-label">Quanto de lucro você quer ter neste mês?</label>
        <input className="field-input" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex.: 12.000,00" required />

        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} disabled={saving}>
          {saving ? "Salvando…" : "Salvar meta"}
        </button>
      </form>
    </Modal>
  );
}
