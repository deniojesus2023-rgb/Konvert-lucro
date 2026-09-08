"use client";

import { useDashboard } from "../DashboardContext";
import { DatePickerButton, FilterButton, SearchIcon, TabGroup } from "../shared";
import { vendas, vendasPaginas } from "../data";

export function Vendas({ isActive }: { isActive: boolean }) {
  const { goTo, toast } = useDashboard();

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-vendas">
      <div className="page-head">
        <div>
          <h1>Vendas</h1>
          <p>Acompanhe todas as suas vendas e pedidos.</p>
        </div>
        <div className="head-actions">
          <DatePickerButton />
          <button className="btn" onClick={() => toast("Exportando vendas… (demonstração)")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 15V3" />
              <path d="M7 8l5-5 5 5" />
              <path d="M4 21h16" />
            </svg>
            Exportar
          </button>
          <button className="btn btn-primary" onClick={() => toast("Registrar venda — disponível na versão completa")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Registrar venda
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="label">Total em vendas</div>
          <div className="value">R$ 50.000,00</div>
          <div className="delta up">
            ▲ +12% <span className="sub">vs. período anterior</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Total de pedidos</div>
          <div className="value">1.000</div>
          <div className="delta up">
            ▲ +8% <span className="sub">vs. período anterior</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Ticket médio</div>
          <div className="value">R$ 50,00</div>
          <div className="delta up">
            ▲ +4% <span className="sub">vs. período anterior</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Pedidos cancelados</div>
          <div className="value">20</div>
          <div className="delta down">
            ▼ -5% <span className="sub">vs. período anterior</span>
          </div>
        </div>
      </div>

      <div className="card section-block">
        <TabGroup id="vendas-tabs" tabs={["Todos", "Delivery", "Balcão", "Retirada"]} />
        <div className="search-row">
          <div className="search-box">
            <SearchIcon />
            <input type="text" placeholder="Buscar por cliente, pedido ou valor..." id="vendas-search" />
          </div>
          <FilterButton />
        </div>
        <div className="table-wrap">
          <table id="vendas-table">
            <tbody>
              <tr>
                <th>Pedido</th>
                <th>Data e hora</th>
                <th>Cliente</th>
                <th>Canal</th>
                <th>Itens</th>
                <th>Valor</th>
                <th>Status</th>
                <th></th>
              </tr>
              {vendas.map((v) => (
                <tr key={v.pedido}>
                  <td style={{ fontWeight: 600 }}>{v.pedido}</td>
                  <td>{v.dataHora}</td>
                  <td>{v.cliente}</td>
                  <td>{v.canal}</td>
                  <td>{v.itens}</td>
                  <td style={{ fontWeight: 600 }}>{v.valor}</td>
                  <td>
                    <span className={`badge ${v.status === "Entregue" ? "badge-green" : "badge-red"}`}>{v.status}</span>
                  </td>
                  <td className="row-link" onClick={() => toast("Detalhes do pedido (demonstração)")}>
                    ⋯
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <div className="pg-buttons" id="vendas-pg">
            {vendasPaginas.map((p, i) => (
              <div key={`${p}-${i}`} className={`pg-btn${i === 0 ? " active" : ""}`} onClick={() => toast(`Página ${p} (demonstração)`)}>
                {p}
              </div>
            ))}
          </div>
          <div className="pg-count">Mostrando 8 de 1.000 pedidos</div>
        </div>
      </div>

      <div className="banner" style={{ background: "var(--primary-light)", borderColor: "#D6E1FB", color: "var(--primary-dark)", marginTop: 20 }}>
        <span>📈 Suas vendas cresceram 12% em relação ao período anterior.</span>
        <span className="link" style={{ color: "var(--primary-dark)" }} onClick={() => goTo("resultados")}>
          Ver mais detalhes →
        </span>
      </div>
    </section>
  );
}
