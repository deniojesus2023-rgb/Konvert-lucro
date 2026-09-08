"use client";

import { useState } from "react";
import { useDashboardData, parseCurrencyInput } from "../DashboardDataContext";
import { useDashboard } from "../DashboardContext";
import { Modal } from "../Modal";

const CATEGORIAS = ["Produção e embalagens", "Taxas das vendas", "Entregas", "Estrutura e impostos", "Outros"];

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

interface CustoFormProps {
  open: boolean;
  onClose: () => void;
}

export function CustoForm({ open, onClose }: CustoFormProps) {
  const { addCusto } = useDashboardData();
  const { toast } = useDashboard();

  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [valor, setValor] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setDescricao("");
    setCategoria(CATEGORIAS[0]);
    setValor("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = parseCurrencyInput(valor);
    if (amountCents === null) return;

    setSaving(true);
    try {
      await addCusto({
        costDate: todayIso(),
        categoryName: categoria,
        amountCents,
        note: descricao.trim() || null,
      });
      toast("Despesa adicionada.");
      reset();
      onClose();
    } catch {
      toast("Não foi possível salvar a despesa agora.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Adicionar despesa" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="field-label">Descrição (opcional)</label>
        <input className="field-input" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Compra de ingredientes" />

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
        <input className="field-input" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex.: 250,00" required />

        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} disabled={saving}>
          {saving ? "Salvando…" : "Adicionar despesa"}
        </button>
      </form>
    </Modal>
  );
}
