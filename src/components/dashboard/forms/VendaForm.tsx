"use client";

import { useState } from "react";
import { useDashboardData } from "../DashboardDataContext";
import { useDashboard } from "../DashboardContext";
import { Modal } from "../Modal";

const CANAIS = ["iFood", "WhatsApp", "Balcão", "Delivery próprio"];

function nowLabel(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}`;
}

interface VendaFormProps {
  open: boolean;
  onClose: () => void;
}

export function VendaForm({ open, onClose }: VendaFormProps) {
  const { addVenda } = useDashboardData();
  const { toast } = useDashboard();

  const [cliente, setCliente] = useState("");
  const [canal, setCanal] = useState(CANAIS[0]);
  const [itens, setItens] = useState("1");
  const [valor, setValor] = useState("");

  function reset() {
    setCliente("");
    setCanal(CANAIS[0]);
    setItens("1");
    setValor("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente.trim() || !valor.trim()) return;

    const itensNum = Math.max(1, Number(itens) || 1);
    addVenda({
      dataHora: nowLabel(),
      cliente: cliente.trim(),
      canal,
      itens: `${itensNum} ${itensNum === 1 ? "item" : "itens"}`,
      valor: valor.trim().startsWith("R$") ? valor.trim() : `R$ ${valor.trim()}`,
      status: "Entregue",
    });
    toast("Venda registrada.");
    reset();
    onClose();
  }

  return (
    <Modal open={open} title="Registrar venda" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="field-label">Cliente</label>
        <input className="field-input" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome do cliente" required />

        <label className="field-label" style={{ marginTop: 12 }}>
          Canal
        </label>
        <select className="field-input" value={canal} onChange={(e) => setCanal(e.target.value)}>
          {CANAIS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="field-label" style={{ marginTop: 12 }}>
          Quantidade de itens
        </label>
        <input className="field-input" type="number" min={1} value={itens} onChange={(e) => setItens(e.target.value)} />

        <label className="field-label" style={{ marginTop: 12 }}>
          Valor
        </label>
        <input className="field-input" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex.: 45,00" required />

        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
          Registrar venda
        </button>
      </form>
    </Modal>
  );
}
