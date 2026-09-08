"use client";

import { useState } from "react";
import { useDashboardData, parseCurrencyInput } from "../DashboardDataContext";
import { useDashboard } from "../DashboardContext";
import { Modal } from "../Modal";

const CATEGORIAS = ["Aluguel", "Folha de pagamento", "Assinaturas", "Estrutura e impostos", "Outros"];

interface RecurringCostFormProps {
  open: boolean;
  onClose: () => void;
}

export function RecurringCostForm({ open, onClose }: RecurringCostFormProps) {
  const { addRecurringCost } = useDashboardData();
  const { toast } = useDashboard();

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [valor, setValor] = useState("");
  const [frequencia, setFrequencia] = useState<"monthly" | "weekly">("monthly");
  const [inicio, setInicio] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setNome("");
    setCategoria(CATEGORIAS[0]);
    setValor("");
    setFrequencia("monthly");
    setInicio("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = parseCurrencyInput(valor);
    if (amountCents === null || !nome.trim() || !inicio) return;

    setSaving(true);
    try {
      await addRecurringCost({
        categoryName: categoria,
        name: nome.trim(),
        amountCents,
        frequency: frequencia,
        startDate: inicio,
      });
      toast("Custo recorrente adicionado.");
      reset();
      onClose();
    } catch {
      toast("Não foi possível salvar agora.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Adicionar custo recorrente" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="field-label">Nome</label>
        <input className="field-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Aluguel da cozinha" required />

        <label className="field-label" style={{ marginTop: 12 }}>
          Categoria
        </label>
        <select className="field-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="field-label" style={{ marginTop: 12 }}>
          Valor
        </label>
        <input className="field-input" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex.: 3.100,00" required />

        <label className="field-label" style={{ marginTop: 12 }}>
          Frequência
        </label>
        <select className="field-input" value={frequencia} onChange={(e) => setFrequencia(e.target.value as "monthly" | "weekly")}>
          <option value="monthly">Mensal</option>
          <option value="weekly">Semanal</option>
        </select>

        <label className="field-label" style={{ marginTop: 12 }}>
          Começa em
        </label>
        <input className="field-input" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />

        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} disabled={saving}>
          {saving ? "Salvando…" : "Adicionar custo recorrente"}
        </button>
      </form>
    </Modal>
  );
}
