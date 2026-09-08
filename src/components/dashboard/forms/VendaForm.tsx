"use client";

import { useEffect, useState } from "react";
import { useDashboardData, parseCurrencyInput } from "../DashboardDataContext";
import { useDashboard } from "../DashboardContext";
import { Modal } from "../Modal";

const CANAIS = ["iFood", "WhatsApp", "Balcão", "Delivery próprio"];

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export interface VendaFormEditTarget {
  entryDate: string;
  canal: string;
  entriesVersion: number;
}

interface VendaFormProps {
  open: boolean;
  onClose: () => void;
  /** Present when reopening the form on an existing day/channel entry to edit it. */
  editTarget?: VendaFormEditTarget | null;
}

export function VendaForm({ open, onClose, editTarget }: VendaFormProps) {
  const { addVenda } = useDashboardData();
  const { toast } = useDashboard();

  const [entryDate, setEntryDate] = useState(todayIso());
  const [canal, setCanal] = useState(CANAIS[0]);
  const [faturamento, setFaturamento] = useState("");
  const [pedidos, setPedidos] = useState("1");
  const [descontos, setDescontos] = useState("");
  const [cancelamentos, setCancelamentos] = useState("");
  const [taxas, setTaxas] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    void Promise.resolve().then(() => {
      if (editTarget) {
        setEntryDate(editTarget.entryDate);
        setCanal(editTarget.canal);
      } else {
        setEntryDate(todayIso());
        setCanal(CANAIS[0]);
        setFaturamento("");
        setPedidos("1");
        setDescontos("");
        setCancelamentos("");
        setTaxas("");
      }
    });
  }, [open, editTarget]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const grossRevenueCents = parseCurrencyInput(faturamento);
    if (grossRevenueCents === null) return;

    setSaving(true);
    try {
      await addVenda({
        entryDate,
        channelName: canal,
        grossRevenueCents,
        ordersCount: Math.max(0, Number(pedidos) || 0),
        discountsCents: parseCurrencyInput(descontos || "0") ?? 0,
        cancellationsCents: parseCurrencyInput(cancelamentos || "0") ?? 0,
        knownFeesCents: parseCurrencyInput(taxas || "0") ?? 0,
        expectedVersion: editTarget?.entriesVersion,
      });
      toast(editTarget ? "Lançamento atualizado." : "Venda do dia registrada.");
      onClose();
    } catch {
      toast("Não foi possível salvar agora. Recarregue e tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title={editTarget ? "Editar lançamento" : "Lançar vendas do dia"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="field-label">Data</label>
        <input className="field-input" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required disabled={!!editTarget} />

        <label className="field-label" style={{ marginTop: 12 }}>
          Canal
        </label>
        <select className="field-input" value={canal} onChange={(e) => setCanal(e.target.value)} disabled={!!editTarget}>
          {CANAIS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="field-label" style={{ marginTop: 12 }}>
          Faturamento bruto
        </label>
        <input className="field-input" value={faturamento} onChange={(e) => setFaturamento(e.target.value)} placeholder="Ex.: 450,00" required />

        <label className="field-label" style={{ marginTop: 12 }}>
          Quantidade de pedidos
        </label>
        <input className="field-input" type="number" min={0} value={pedidos} onChange={(e) => setPedidos(e.target.value)} />

        <label className="field-label" style={{ marginTop: 12 }}>
          Descontos
        </label>
        <input className="field-input" value={descontos} onChange={(e) => setDescontos(e.target.value)} placeholder="Ex.: 20,00" />

        <label className="field-label" style={{ marginTop: 12 }}>
          Cancelamentos
        </label>
        <input className="field-input" value={cancelamentos} onChange={(e) => setCancelamentos(e.target.value)} placeholder="Ex.: 0,00" />

        <label className="field-label" style={{ marginTop: 12 }}>
          Taxas conhecidas (ex.: taxa do canal)
        </label>
        <input className="field-input" value={taxas} onChange={(e) => setTaxas(e.target.value)} placeholder="Ex.: 45,00" />

        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} disabled={saving}>
          {saving ? "Salvando…" : editTarget ? "Salvar alterações" : "Registrar venda do dia"}
        </button>
      </form>
    </Modal>
  );
}
