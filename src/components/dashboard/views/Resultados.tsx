"use client";

import { useDashboard } from "../DashboardContext";
import { DatePickerButton } from "../shared";
import { ProfitChart } from "../ProfitChart";

export function Resultados({ isActive }: { isActive: boolean }) {
  const { goTo } = useDashboard();

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-resultados">
      <div className="page-head">
        <div>
          <h1>Resultados</h1>
          <p>Veja o desempenho do seu delivery em detalhes.</p>
        </div>
        <div className="head-actions">
          <DatePickerButton />
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="label">Receita total</div>
          <div className="value">R$ 50.000,00</div>
          <div className="delta up">
            ▲ +12% <span className="sub">vs. período anterior</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Custos totais</div>
          <div className="value">R$ 40.000,00</div>
          <div className="delta up">
            ▲ +8% <span className="sub">vs. período anterior</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Lucro estimado</div>
          <div className="value blue">R$ 10.000,00</div>
          <div className="delta up">
            ▲ +25% <span className="sub">vs. período anterior</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Margem de lucro</div>
          <div className="value">20%</div>
          <div className="delta up">
            ▲ +5 p.p. <span className="sub">vs. período anterior</span>
          </div>
        </div>
      </div>

      <div className="card section-block" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div className="section-title">Evolução do lucro</div>
          <select className="date-picker" style={{ border: "1px solid var(--border)", cursor: "pointer" }}>
            <option>Diário</option>
            <option>Semanal</option>
            <option>Mensal</option>
          </select>
        </div>
        <div className="chart-legend" style={{ marginTop: 10 }}>
          <span className="item">
            <span className="sw" style={{ background: "#AFC7FA" }}></span>Receita
          </span>
          <span className="item">
            <span className="sw" style={{ background: "#C7CEDC" }}></span>Custos
          </span>
          <span className="item">
            <span className="line-sw"></span>Lucro
          </span>
        </div>
        <ProfitChart />
      </div>

      <div className="grid grid-4">
        <div className="card stat-card">
          <div className="label">Total de pedidos</div>
          <div className="value" style={{ fontSize: 20 }}>
            1.000
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Ticket médio</div>
          <div className="value" style={{ fontSize: 20 }}>
            R$ 50,00
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Custo por pedido</div>
          <div className="value" style={{ fontSize: 20 }}>
            R$ 40,00
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Lucro por pedido</div>
          <div className="value" style={{ fontSize: 20 }}>
            R$ 10,00
          </div>
        </div>
      </div>

      <div className="banner" style={{ background: "var(--primary-light)", borderColor: "#D6E1FB", color: "var(--primary-dark)", marginTop: 20 }}>
        <div>
          <div style={{ fontWeight: 700 }}>Seu lucro cresceu 25% em relação ao período anterior.</div>
          <div style={{ fontWeight: 500 }}>Continue acompanhando e mantenha o foco nas suas metas.</div>
        </div>
        <span className="link" style={{ color: "var(--primary-dark)" }} onClick={() => goTo("metas")}>
          Ver mais análises →
        </span>
      </div>
    </section>
  );
}
