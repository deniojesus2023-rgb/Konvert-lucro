"use client";

import { useState } from "react";
import { useDashboardData } from "../DashboardDataContext";
import { useDashboard } from "../DashboardContext";
import { Modal } from "../Modal";

const TIPOS = ["Financeira", "Operacional"];

interface MetaFormProps {
  open: boolean;
  onClose: () => void;
}

export function MetaForm({ open, onClose }: MetaFormProps) {
  const { addMeta } = useDashboardData();
  const { toast } = useDashboard();

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [valorMeta, setValorMeta] = useState("");
  const [valorAtual, setValorAtual] = useState("");

  function reset() {
    setNome("");
    setTipo(TIPOS[0]);
    setValorMeta("");
    setValorAtual("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !valorMeta.trim()) return;

    const metaNum = parseFloat(valorMeta.replace(/\./g, "").replace(",", "."));
    const atualNum = parseFloat((valorAtual || "0").replace(/\./g, "").replace(",", "."));
    const progresso = metaNum > 0 ? Math.max(0, Math.min(100, Math.round((atualNum / metaNum) * 100))) : 0;

    addMeta({
      nome: nome.trim(),
      tipo,
      valorMeta: valorMeta.trim(),
      valorAtual: valorAtual.trim() || "0",
      progresso,
    });
    toast("Meta criada.");
    reset();
    onClose();
  }

  return (
    <Modal open={open} title="Nova meta" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="field-label">Nome da meta</label>
        <input className="field-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Receita mensal" required />

        <label className="field-label" style={{ marginTop: 12 }}>
          Tipo
        </label>
        <select className="field-input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label className="field-label" style={{ marginTop: 12 }}>
          Valor da meta
        </label>
        <input className="field-input" value={valorMeta} onChange={(e) => setValorMeta(e.target.value)} placeholder="Ex.: 60.000,00 ou 25%" required />

        <label className="field-label" style={{ marginTop: 12 }}>
          Valor atual
        </label>
        <input className="field-input" value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} placeholder="Ex.: 0" />

        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
          Criar meta
        </button>
      </form>
    </Modal>
  );
}
