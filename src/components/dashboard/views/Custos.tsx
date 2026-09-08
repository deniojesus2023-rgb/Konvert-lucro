"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { useDashboardData } from "../DashboardDataContext";
import { DatePickerButton, FilterButton, SearchIcon, TabGroup } from "../shared";
import { RowMenu } from "../RowMenu";
import { CustoForm } from "../forms/CustoForm";

const TABS = ["Despesas", "Categorias"];

/** Parses "R$ 2.500,00" into a plain number for the Categorias rollup. */
function parseValor(valor: string): number {
  const digits = valor.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(digits) || 0;
}

export function Custos({ isActive }: { isActive: boolean }) {
  const { goTo } = useDashboard();
  const { custos, removeCusto } = useDashboardData();
  const [tab, setTab] = useState(TABS[0]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

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

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-custos">
      <CustoForm open={formOpen} onClose={() => setFormOpen(false)} />
      <div className="page-head">
        <div>
          <h1>Custos e despesas</h1>
          <p>Acompanhe todos os seus custos e mantenha seu delivery saudável.</p>
        </div>
        <div className="head-actions">
          <DatePickerButton />
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
          <div className="label">Total de custos</div>
          <div className="value">R$ 40.000,00</div>
          <div className="delta down" style={{ color: "var(--red)" }}>
            ▲ +8% <span className="sub">vs. período anterior</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Custo por pedido</div>
          <div className="value">R$ 40,00</div>
          <div className="delta down" style={{ color: "var(--red)" }}>
            ▲ +5% <span className="sub">vs. período anterior</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Maiores custos</div>
          <div className="value" style={{ fontSize: 17 }}>
            Produção e embalagens
          </div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            36% do total
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">% dos custos nas vendas</div>
          <div className="value">
            80% <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>ⓘ</span>
          </div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            Ideal: até 70%
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card section-block">
          <TabGroup id="custos-tabs" tabs={TABS} active={tab} onChange={setTab} />

          {tab === "Despesas" ? (
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
                          <RowMenu onDelete={() => removeCusto(custos.indexOf(c))} />
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
          ) : (
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
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card section-block">
            <div className="section-title" style={{ marginBottom: 10 }}>
              Distribuição dos custos
            </div>
            <div className="donut-wrap">
              <svg width="150" height="150" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#EEF1F7" strokeWidth={6}></circle>
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#2E5FF2" strokeWidth={6} strokeDasharray="36 64" strokeDashoffset="25" transform="rotate(-90 21 21)"></circle>
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#8FB0F7" strokeWidth={6} strokeDasharray="16 84" strokeDashoffset="-11" transform="rotate(-90 21 21)"></circle>
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#1BA24E" strokeWidth={6} strokeDasharray="12 88" strokeDashoffset="-27" transform="rotate(-90 21 21)"></circle>
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#E8930C" strokeWidth={6} strokeDasharray="16 84" strokeDashoffset="-39" transform="rotate(-90 21 21)"></circle>
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#C7CEDC" strokeWidth={6} strokeDasharray="20 80" strokeDashoffset="-55" transform="rotate(-90 21 21)"></circle>
              </svg>
              <div className="donut-center">
                <div className="amt">R$ 40.000,00</div>
                <div className="lbl">Total</div>
              </div>
            </div>
            <div className="donut-legend">
              <div className="item">
                <span className="left">
                  <span className="sw" style={{ background: "#2E5FF2" }}></span>Produção e embalagens
                </span>
                <span className="pct">36%</span>
              </div>
              <div className="item">
                <span className="left">
                  <span className="sw" style={{ background: "#8FB0F7" }}></span>Taxas das vendas
                </span>
                <span className="pct">16%</span>
              </div>
              <div className="item">
                <span className="left">
                  <span className="sw" style={{ background: "#1BA24E" }}></span>Entregas
                </span>
                <span className="pct">12%</span>
              </div>
              <div className="item">
                <span className="left">
                  <span className="sw" style={{ background: "#E8930C" }}></span>Estrutura e impostos
                </span>
                <span className="pct">16%</span>
              </div>
              <div className="item">
                <span className="left">
                  <span className="sw" style={{ background: "#C7CEDC" }}></span>Outros
                </span>
                <span className="pct">20%</span>
              </div>
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
                <div className="bar" style={{ height: 70 }}></div>
                <div className="bval">R$ 32 mil</div>
                <div className="blabel">Abr</div>
              </div>
              <div className="bar-col">
                <div className="bar" style={{ height: 82 }}></div>
                <div className="bval">R$ 37 mil</div>
                <div className="blabel">Mai</div>
              </div>
              <div className="bar-col current">
                <div className="bar" style={{ height: 96 }}></div>
                <div className="bval">R$ 40 mil</div>
                <div className="blabel">Jun</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="banner" style={{ background: "var(--primary-light)", borderColor: "#D6E1FB", color: "var(--primary-dark)", marginTop: 20 }}>
        <span>📊 Seus custos aumentaram 8% em relação ao período anterior.</span>
        <span className="link" style={{ color: "var(--primary-dark)" }} onClick={() => goTo("resultados")}>
          Ver análise completa →
        </span>
      </div>
    </section>
  );
}
