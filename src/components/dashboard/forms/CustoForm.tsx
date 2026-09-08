"use client";

import { useState } from "react";
import { useDashboardData } from "../DashboardDataContext";
import { useDashboard } from "../DashboardContext";
import { Modal } from "../Modal";

const CATEGORIAS = ["Produção e embalagens", "Taxas das vendas", "Entregas", "Estrutura e impostos", "Outros"];

function todayLabel(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${now.getFullYear()}`;
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

  function reset() {
    setDescricao("");
    setCategoria(CATEGORIAS[0]);
    setValor("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || !valor.trim()) return;

    addCusto({
      data: todayLabel(),
      descricao: descricao.trim(),
      categoria,
      valor: valor.trim().startsWith("R$") ? valor.trim() : `R$ ${valor.trim()}`,
    });
    toast("Despesa adicionada.");
    reset();
    onClose();
  }

  return (
    <Modal open={open} title="Adicionar despesa" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="field-label">Descrição</label>
        <input className="field-input" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Compra de ingredientes" required />

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

        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
          Adicionar despesa
        </button>
      </form>
    </Modal>
  );
}
