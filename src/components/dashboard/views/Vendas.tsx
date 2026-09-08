"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { useDashboardData } from "../DashboardDataContext";
import { DatePickerButton, FilterButton, SearchIcon, TabGroup } from "../shared";
import { RowMenu } from "../RowMenu";
import { VendaForm, type VendaFormEditTarget } from "../forms/VendaForm";
import { downloadCsv } from "../csv";
import { formatCurrencyDisplay } from "@/lib/client/currency";

const TABS = ["Todos", "iFood", "WhatsApp", "Balcão", "Delivery próprio"];

export function Vendas({ isActive }: { isActive: boolean }) {
  const { toast } = useDashboard();
  const { vendas, summary } = useDashboardData();
  const [tab, setTab] = useState(TABS[0]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VendaFormEditTarget | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return vendas.filter((v) => {
      if (tab !== "Todos" && v.canal !== tab) return false;
      if (!term) return true;
      return v.canal.toLowerCase().includes(term) || v.data.includes(term);
    });
  }, [vendas, tab, search]);

  const totalPedidos = vendas.reduce((sum, v) => sum + v.pedidos, 0);
  const ticketMedioGeral = summary && summary.netRevenueCents > 0 && totalPedidos > 0 ? formatCurrencyDisplay(Math.round(summary.netRevenueCents / totalPedidos)) : "—";

  function openNewForm() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEditForm(entryDate: string, canal: string, entriesVersion: number) {
    setEditTarget({ entryDate, canal, entriesVersion });
    setFormOpen(true);
  }

  function handleExport() {
    downloadCsv(
      "vendas.csv",
      ["Data", "Canal", "Faturamento", "Pedidos", "Ticket médio"],
      filtered.map((v) => [v.data, v.canal, v.faturamento, String(v.pedidos), v.ticketMedio]),
    );
    toast("Vendas exportadas.");
  }

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-vendas">
      <VendaForm open={formOpen} onClose={() => setFormOpen(false)} editTarget={editTarget} />
      <div className="page-head">
        <div>
          <h1>Vendas</h1>
          <p>Lançamentos diários de vendas, por canal.</p>
        </div>
        <div className="head-actions">
          <DatePickerButton />
          <button className="btn" onClick={handleExport}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 15V3" />
              <path d="M7 8l5-5 5 5" />
              <path d="M4 21h16" />
            </svg>
            Exportar
          </button>
          <button className="btn btn-primary" onClick={openNewForm}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Lançar vendas do dia
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="label">Total em vendas (mês)</div>
          <div className="value">{summary ? formatCurrencyDisplay(summary.netRevenueCents) : "—"}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Total de pedidos (mês)</div>
          <div className="value">{totalPedidos.toLocaleString("pt-BR")}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Ticket médio (mês)</div>
          <div className="value">{ticketMedioGeral}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Lucro do mês</div>
          <div className="value">{summary && summary.profit.status === "available" ? formatCurrencyDisplay(summary.profit.value) : "—"}</div>
        </div>
      </div>

      <div className="card section-block">
        <TabGroup id="vendas-tabs" tabs={TABS} active={tab} onChange={setTab} />
        <div className="search-row">
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="Buscar por canal ou data..."
              id="vendas-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <FilterButton />
        </div>
        <div className="table-wrap">
          <table id="vendas-table">
            <tbody>
              <tr>
                <th>Data</th>
                <th>Canal</th>
                <th>Faturamento</th>
                <th>Pedidos</th>
                <th>Ticket médio</th>
                <th></th>
              </tr>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600 }}>{v.data}</td>
                  <td>{v.canal}</td>
                  <td style={{ fontWeight: 600 }}>{v.faturamento}</td>
                  <td>{v.pedidos}</td>
                  <td>{v.ticketMedio}</td>
                  <td>
                    <RowMenu onEdit={() => openEditForm(v.entryDate, v.canal, v.entriesVersion)} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    Nenhum lançamento encontrado neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <div className="pg-count">Mostrando {filtered.length} de {vendas.length} lançamentos deste mês</div>
        </div>
      </div>
    </section>
  );
}
