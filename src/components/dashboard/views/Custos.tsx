"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { useDashboardData } from "../DashboardDataContext";
import { formatCurrencyDisplay } from "@/lib/client/currency";
import { DatePickerButton, FilterButton, SearchIcon, TabGroup } from "../shared";
import { RowMenu } from "../RowMenu";
import { CustoForm } from "../forms/CustoForm";
import { RecurringCostForm } from "../forms/RecurringCostForm";

const TABS = ["Despesas", "Categorias", "Recorrentes"];
const DONUT_COLORS = ["#2E5FF2", "#8FB0F7", "#1BA24E", "#E8930C", "#C7CEDC", "#B18CF2", "#F2708C"];

/** Parses "R$ 2.500,00" into a plain number for the Categorias rollup. */
function parseValor(valor: string): number {
  const digits = valor.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(digits) || 0;
}

function deltaLabel(current: number, previous: number): { text: string; up: boolean } | null {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { text: `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)}%`, up: pct >= 0 };
}

export function Custos({ isActive }: { isActive: boolean }) {
  const { goTo } = useDashboard();
  const { custos, removeCusto, recurringCosts, removeRecurringCost, summary, previousSummary, vendas } = useDashboardData();
  const totalCustosCents = summary?.totalCostsCents ?? 0;
  const totalCustos = formatCurrencyDisplay(totalCustosCents);
  const custosDelta = previousSummary ? deltaLabel(totalCustosCents, previousSummary.totalCostsCents) : null;

  const totalPedidos = vendas.reduce((sum, v) => sum + v.pedidos, 0);
  const custoPorPedido = totalPedidos > 0 ? formatCurrencyDisplay(Math.round(totalCustosCents / totalPedidos)) : "—";

  const pctCustosNasVendas = summary && summary.netRevenueCents > 0 ? Math.round((totalCustosCents / summary.netRevenueCents) * 100) : null;

  const [tab, setTab] = useState(TABS[0]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [recurringFormOpen, setRecurringFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return custos;
    return custos.filter((c) => c.descricao.toLowerCase().includes(term) || c.categoria.toLowerCase().includes(term));
  }, [custos, search]);

  const porCategoria = useMemo(() => {
    const totals = new Map<string, number>();
    for (const c of custos) {
      totals.set(c.categoria, (totals.get(c.categoria) ?? 0) + parseValor(c.valor));
    }
    const grandTotal = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
    return [...totals.entries()]
      .map(([categoria, total]) => ({ categoria, total, pct: Math.round((total / grandTotal) * 100) }))
      .sort((a, b) => b.total - a.total);
  }, [custos]);

  const maiorCategoria = porCategoria[0];

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-custos">
      <CustoForm open={formOpen} onClose={() => setFormOpen(false)} />
      <RecurringCostForm open={recurringFormOpen} onClose={() => setRecurringFormOpen(false)} />
      <div className="page-head">
        <div>
          <h1>Custos e despesas</h1>
          <p>Acompanhe todos os seus custos e mantenha seu delivery saudável.</p>
        </div>
        <div className="head-actions">
          <DatePickerButton />
          <button className="btn" onClick={() => setRecurringFormOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Custo recorrente
          </button>
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Adicionar despesa
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="label">Total de custos (mês)</div>
          <div className="value">{totalCustos}</div>
          {custosDelta ? (
            <div className={custosDelta.up ? "delta down" : "delta up"} style={custosDelta.up ? { color: "var(--red)" } : undefined}>
              {custosDelta.text} <span className="sub">vs. mês anterior</span>
            </div>
          ) : (
            <div className="sub" style={{ fontSize: 12.5 }}>
              Inclui custos variáveis e recorrentes prorateados
            </div>
          )}
        </div>
        <div className="card stat-card">
          <div className="label">Custo por pedido</div>
          <div className="value">{custoPorPedido}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Maiores custos</div>
          <div className="value" style={{ fontSize: 17 }}>
            {maiorCategoria?.categoria ?? "—"}
          </div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            {maiorCategoria ? `${maiorCategoria.pct}% do total de despesas` : "Nenhuma despesa lançada ainda"}
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">% dos custos nas vendas</div>
          <div className="value">{pctCustosNasVendas !== null ? `${pctCustosNasVendas}%` : "—"}</div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            Ideal: até 70%
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card section-block">
          <TabGroup id="custos-tabs" tabs={TABS} active={tab} onChange={setTab} />

          {tab === "Despesas" && (
            <>
              <div className="search-row">
                <div className="search-box">
                  <SearchIcon />
                  <input type="text" placeholder="Buscar despesa..." id="custos-search" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <FilterButton />
              </div>
              <div className="table-wrap">
                <table id="custos-table">
                  <tbody>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Valor</th>
                      <th></th>
                    </tr>
                    {filtered.map((c, i) => (
                      <tr key={`${c.descricao}-${c.data}-${i}`}>
                        <td>{c.data}</td>
                        <td>{c.descricao}</td>
                        <td>{c.categoria}</td>
                        <td style={{ fontWeight: 600 }}>{c.valor}</td>
                        <td>
                          <RowMenu onDelete={() => void removeCusto(c.id)} />
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                          Nenhuma despesa encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "Categorias" && (
            <div style={{ marginTop: 6 }}>
              {porCategoria.map((row) => (
                <div className="mini-bar-row" key={row.categoria}>
                  <div className="cat">{row.categoria}</div>
                  <div className="val">
                    R$ {row.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="mini-bar-track">
                    <div className="mini-bar-fill" style={{ width: `${row.pct}%` }}></div>
                  </div>
                  <div className="mini-bar-pct">{row.pct}%</div>
                </div>
              ))}
              {porCategoria.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13.5 }}>Nenhuma despesa lançada neste mês.</p>}
            </div>
          )}

          {tab === "Recorrentes" && (
            <div className="table-wrap">
              <table id="recorrentes-table">
                <tbody>
                  <tr>
                    <th>Nome</th>
                    <th>Frequência</th>
                    <th>Começa em</th>
                    <th>Valor</th>
                    <th></th>
                  </tr>
                  {recurringCosts.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.nome}</td>
                      <td>{r.frequencia === "monthly" ? "Mensal" : "Semanal"}</td>
                      <td>{r.inicio}</td>
                      <td style={{ fontWeight: 600 }}>{r.valor}</td>
                      <td>
                        <RowMenu onDelete={() => void removeRecurringCost(r.id)} deleteLabel="Desativar" />
                      </td>
                    </tr>
                  ))}
                  {recurringCosts.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        Nenhum custo recorrente cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card section-block">
            <div className="section-title" style={{ marginBottom: 10 }}>
              Distribuição dos custos
            </div>
            <div className="donut-center" style={{ textAlign: "center", marginBottom: 10 }}>
              <div className="amt">{totalCustos}</div>
              <div className="lbl">Total de despesas lançadas (mês)</div>
            </div>
            <div className="donut-legend">
              {porCategoria.map((row, i) => (
                <div className="item" key={row.categoria}>
                  <span className="left">
                    <span className="sw" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}></span>
                    {row.categoria}
                  </span>
                  <span className="pct">{row.pct}%</span>
                </div>
              ))}
              {porCategoria.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13.5 }}>Sem despesas ainda.</p>}
            </div>
          </div>

          <div className="card section-block">
            <div className="section-title" style={{ marginBottom: 4 }}>
              Comparativo mensal
            </div>
            <div className="section-sub" style={{ marginBottom: 0 }}>
              Total de custos
            </div>
            <div className="bars-compare">
              <div className="bar-col">
                <div className="bar" style={{ height: previousSummary ? Math.max(6, Math.min(100, Math.round((previousSummary.totalCostsCents / Math.max(totalCustosCents, previousSummary.totalCostsCents, 1)) * 100))) : 6 }}></div>
                <div className="bval">{previousSummary ? formatCurrencyDisplay(previousSummary.totalCostsCents) : "—"}</div>
                <div className="blabel">Mês anterior</div>
              </div>
              <div className="bar-col current">
                <div className="bar" style={{ height: Math.max(6, Math.min(100, Math.round((totalCustosCents / Math.max(totalCustosCents, previousSummary?.totalCostsCents ?? 0, 1)) * 100))) }}></div>
                <div className="bval">{totalCustos}</div>
                <div className="blabel">Este mês</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="banner" style={{ background: "var(--primary-light)", borderColor: "#D6E1FB", color: "var(--primary-dark)", marginTop: 20 }}>
        <span>
          📊{" "}
          {custosDelta
            ? `Seus custos ${custosDelta.up ? "aumentaram" : "diminuíram"} ${custosDelta.text.replace(/[▲▼]\s?/, "")} em relação ao mês anterior.`
            : "Ainda não há dados suficientes para comparar com o mês anterior."}
        </span>
        <span className="link" style={{ color: "var(--primary-dark)" }} onClick={() => goTo("resultados")}>
          Ver análise completa →
        </span>
      </div>
    </section>
  );
}
