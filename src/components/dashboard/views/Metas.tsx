"use client";

import { useState } from "react";
import { DatePickerButton } from "../shared";
import { useDashboardData } from "../DashboardDataContext";
import { RowMenu } from "../RowMenu";
import { MetaForm } from "../forms/MetaForm";

export function Metas({ isActive }: { isActive: boolean }) {
  const { metas, removeMeta } = useDashboardData();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-metas">
      <MetaForm open={formOpen} onClose={() => setFormOpen(false)} />
      <div className="page-head">
        <div>
          <h1>Metas</h1>
          <p>Defina seus objetivos e acompanhe seu progresso.</p>
        </div>
        <div className="head-actions">
          <DatePickerButton />
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nova meta
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="label">Meta de receita</div>
          <div className="value">R$ 60.000,00</div>
          <div className="progress-track" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: "80%" }}></div>
          </div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            80% concluída
          </div>
          <div className="sub" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            R$ 48.000 de R$ 60.000
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Meta de pedidos</div>
          <div className="value">1.200</div>
          <div className="progress-track" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: "67%" }}></div>
          </div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            67% concluída
          </div>
          <div className="sub" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            800 de 1.200
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Ticket médio</div>
          <div className="value">R$ 55,00</div>
          <div className="progress-track" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: "91%" }}></div>
          </div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            91% concluída
          </div>
          <div className="sub" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            R$ 50,00 de R$ 55,00
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Margem de lucro</div>
          <div className="value">25%</div>
          <div className="progress-track" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: "60%" }}></div>
          </div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            60% concluída
          </div>
          <div className="sub" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            20% de 25%
          </div>
        </div>
      </div>

      <div className="card section-block" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="section-title">Suas metas no período</div>
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table id="metas-table">
            <tbody>
              <tr>
                <th>Meta</th>
                <th>Tipo</th>
                <th>Valor da meta</th>
                <th>Valor atual</th>
                <th>Progresso</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
              {metas.map((m) => (
                <tr key={m.nome}>
                  <td style={{ fontWeight: 600 }}>{m.nome}</td>
                  <td>{m.tipo}</td>
                  <td>{m.valorMeta}</td>
                  <td>{m.valorAtual}</td>
                  <td style={{ minWidth: 160 }}>
                    <div className="progress-track" style={{ margin: 0 }}>
                      <div className="progress-fill" style={{ width: `${m.progresso}%` }}></div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue">Em andamento</span>
                  </td>
                  <td>
                    <RowMenu onDelete={() => removeMeta(m.nome)} />
                  </td>
                </tr>
              ))}
              {metas.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    Nenhuma meta cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card section-block">
          <div className="section-title">Evolução da receita</div>
          <div className="bars-compare" style={{ height: 150, marginTop: 20 }}>
            <div className="bar-col">
              <div className="bar" style={{ height: 65 }}></div>
              <div className="bval">Sem 1</div>
            </div>
            <div className="bar-col">
              <div className="bar" style={{ height: 68 }}></div>
              <div className="bval">Sem 2</div>
            </div>
            <div className="bar-col">
              <div className="bar" style={{ height: 80 }}></div>
              <div className="bval">Sem 3</div>
            </div>
            <div className="bar-col current">
              <div className="bar" style={{ height: 100 }}></div>
              <div className="bval">Sem 4</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
            <div className="legend-item">
              <span className="sw" style={{ background: "var(--primary)" }}></span>Receita atual
            </div>
            <div className="legend-item">
              <span style={{ width: 14, height: 2, background: "var(--primary)", borderTop: "2px dashed var(--primary)", display: "inline-block" }}></span>Meta do
              período
            </div>
          </div>
        </div>
        <div className="card callout-card" style={{ textAlign: "left" }}>
          <div style={{ fontSize: 34, marginBottom: 6 }}>🏆</div>
          <h4>Você está no caminho certo!</h4>
          <p>Faltam R$ 12.000,00 para atingir sua meta de receita. Mantenha o ritmo e continue evoluindo.</p>
        </div>
      </div>
    </section>
  );
}
