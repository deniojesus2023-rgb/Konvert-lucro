"use client";

import { useState } from "react";
import { useDashboard } from "../DashboardContext";
import { DatePickerButton } from "../shared";
import { VendaForm } from "../forms/VendaForm";

export function Overview({ isActive }: { isActive: boolean }) {
  const { goTo } = useDashboard();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-overview">
      <VendaForm open={formOpen} onClose={() => setFormOpen(false)} />
      <div className="page-head">
        <div>
          <h1>Visão geral</h1>
          <p>Veja o que entrou, o que saiu e o que sobrou.</p>
        </div>
        <div className="head-actions">
          <DatePickerButton />
          <button className="btn" onClick={() => goTo("importacoes")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 3v12" />
              <path d="M7 10l5 5 5-5" />
              <path d="M4 21h16" />
            </svg>
            Importar vendas
          </button>
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Registrar venda
          </button>
        </div>
      </div>

      <div className="card section-block" style={{ marginBottom: 20 }}>
        <div className="section-title">Conecte seus canais</div>
        <div className="section-sub">Organize as entradas de pedidos do seu delivery.</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div className="channels-row">
            <div className="channel">
              <div className="ico ico-ifood">if</div>
              <div>
                <div className="cname">iFood</div>
                <div className="cstatus">
                  <span className="dot"></span>Não conectado
                </div>
              </div>
            </div>
            <div className="channel">
              <div className="ico ico-anota">A</div>
              <div>
                <div className="cname">Anota Aí</div>
                <div className="cstatus">
                  <span className="dot"></span>Não conectado
                </div>
              </div>
            </div>
            <div className="channel">
              <div className="ico ico-whats">W</div>
              <div>
                <div className="cname">WhatsApp</div>
                <div className="cstatus">
                  <span className="dot"></span>Não conectado
                </div>
              </div>
            </div>
          </div>
          <span className="link" onClick={() => goTo("integracoes")}>
            Configurar integrações →
          </span>
        </div>
      </div>

      <div className="banner">
        <span>
          <b>Dados informados até 28 jun.</b> · Confira os últimos 2 dias.
        </span>
        <span className="link" onClick={() => goTo("importacoes")}>
          Atualizar dados →
        </span>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="label">Vendas informadas</div>
          <div className="value">R$ 50.000,00</div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            1.000 pedidos
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Custos informados</div>
          <div className="value">R$ 40.000,00</div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            80% das vendas
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Lucro estimado</div>
          <div className="value blue">R$ 10.000,00</div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            Margem de 20%
          </div>
        </div>
        <div className="card stat-card">
          <div className="label">Lucro por pedido</div>
          <div className="value">R$ 10,00</div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            Média do período
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card section-block">
          <div className="section-title">Como suas vendas se dividem</div>
          <div className="section-sub">A cada R$100 vendidos</div>
          <div className="split-bar">
            <div className="seg-a" style={{ width: "80%" }}>
              80%
            </div>
            <div className="seg-b" style={{ width: "20%" }}>
              20%
            </div>
          </div>
          <div className="legend-row">
            <div className="legend-item">
              <span className="sw" style={{ background: "var(--gray-bar)" }}></span>Custos <span className="amt">R$80</span>
            </div>
            <div className="legend-item">
              <span className="sw" style={{ background: "var(--primary)" }}></span>Lucro estimado <span className="amt">R$20</span>
            </div>
          </div>
          <div className="divider-line"></div>
          <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 2 }}>R$20 ficam no delivery a cada R$100 vendidos.</div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Com base nos custos informados.</div>
        </div>

        <div className="card section-block">
          <div className="section-title">Meta de lucro</div>
          <div style={{ fontSize: 22, fontWeight: 700, margin: "14px 0 4px" }}>
            R$10.000 <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 15 }}>de R$12.000</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "83%" }}></div>
          </div>
          <div className="progress-row">
            <span>Faltam R$2.000,00 para a meta.</span>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>83%</span>
          </div>
          <div className="divider-line"></div>
          <span className="link" onClick={() => goTo("metas")}>
            Editar meta →
          </span>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card section-block">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="section-title">Maiores custos</div>
            </div>
            <span className="link" onClick={() => goTo("custos")}>
              Ver despesas →
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <table>
              <tbody>
                <tr>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>% das vendas</th>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: 6 }}>
              <div className="mini-bar-row">
                <div className="cat">Produção e embalagens</div>
                <div className="val">R$ 18.000,00</div>
                <div className="mini-bar-track">
                  <div className="mini-bar-fill" style={{ width: "36%" }}></div>
                </div>
                <div className="mini-bar-pct">36%</div>
              </div>
              <div className="mini-bar-row">
                <div className="cat">Taxas das vendas</div>
                <div className="val">R$ 8.000,00</div>
                <div className="mini-bar-track">
                  <div className="mini-bar-fill" style={{ width: "16%" }}></div>
                </div>
                <div className="mini-bar-pct">16%</div>
              </div>
              <div className="mini-bar-row">
                <div className="cat">Entregas</div>
                <div className="val">R$ 6.000,00</div>
                <div className="mini-bar-track">
                  <div className="mini-bar-fill" style={{ width: "12%" }}></div>
                </div>
                <div className="mini-bar-pct">12%</div>
              </div>
              <div className="mini-bar-row">
                <div className="cat">Estrutura e impostos</div>
                <div className="val">R$ 8.000,00</div>
                <div className="mini-bar-track">
                  <div className="mini-bar-fill" style={{ width: "16%" }}></div>
                </div>
                <div className="mini-bar-pct">16%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card callout-card">
          <div className="section-title" style={{ marginBottom: 14 }}>
            Onde olhar primeiro
          </div>
          <h4>
            <span className="callout-dot"></span>Produção e embalagens
          </h4>
          <p>É o maior custo informado no período. Confira os valores e procure oportunidades de redução.</p>
          <span className="link" onClick={() => goTo("custos")}>
            Revisar custos →
          </span>
        </div>
      </div>

      <div className="empty-note">Resultado estimado com base nas vendas e nos custos informados.</div>
    </section>
  );
}
