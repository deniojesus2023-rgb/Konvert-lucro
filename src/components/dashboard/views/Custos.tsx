"use client";

import { useDashboard } from "../DashboardContext";
import { DatePickerButton, FilterButton, SearchIcon, TabGroup } from "../shared";
import { custos } from "../data";

export function Custos({ isActive }: { isActive: boolean }) {
  const { goTo, toast } = useDashboard();

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-custos">
      <div className="page-head">
        <div>
          <h1>Custos e despesas</h1>
          <p>Acompanhe todos os seus custos e mantenha seu delivery saudável.</p>
        </div>
        <div className="head-actions">
          <DatePickerButton />
          <button className="btn btn-primary" onClick={() => toast("Adicionar despesa — disponível na versão completa")}>
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
          <div className="label">
            % dos custos nas vendas
          </div>
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
          <TabGroup id="custos-tabs" tabs={["Despesas", "Categorias"]} />
          <div className="search-row">
            <div className="search-box">
              <SearchIcon />
              <input type="text" placeholder="Buscar despesa..." id="custos-search" />
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
                {custos.map((c, i) => (
                  <tr key={i}>
                    <td>{c.data}</td>
                    <td>{c.descricao}</td>
                    <td>{c.categoria}</td>
                    <td style={{ fontWeight: 600 }}>{c.valor}</td>
                    <td className="row-link" onClick={() => toast("Editar despesa (demonstração)")}>
                      ⋯
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
