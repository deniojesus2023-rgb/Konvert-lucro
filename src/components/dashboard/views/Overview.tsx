"use client";

import { useState } from "react";
import { useDashboard } from "../DashboardContext";
import { useDashboardData } from "../DashboardDataContext";
import { DatePickerButton } from "../shared";
import { VendaForm } from "../forms/VendaForm";
import { formatCurrencyDisplay } from "@/lib/client/currency";

function parseValor(valor: string): number {
  const digits = valor.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(digits) || 0;
}

function deltaLabel(current: number, previous: number): { text: string; up: boolean } | null {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { text: `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)}%`, up: pct >= 0 };
}

export function Overview({ isActive }: { isActive: boolean }) {
  const { goTo } = useDashboard();
  const { summary, previousSummary, vendas, custos, metas, profitGoalCents } = useDashboardData();
  const [formOpen, setFormOpen] = useState(false);

  const totalPedidos = vendas.reduce((sum, v) => sum + v.pedidos, 0);
  const lucro = summary?.profit.status === "available" ? summary.profit.value : 0;
  const lucroPorPedido = summary?.profitPerOrder.status === "available" ? summary.profitPerOrder.value : null;
  const margemPct = summary?.marginBps.status === "available" ? (summary.marginBps.value / 100).toFixed(0) : "—";
  const meta = metas[0];

  const revenueDelta = previousSummary ? deltaLabel(summary?.netRevenueCents ?? 0, previousSummary.netRevenueCents) : null;
  const previousLucro = previousSummary?.profit.status === "available" ? previousSummary.profit.value : 0;
  const lucroDelta = previousSummary ? deltaLabel(lucro, previousLucro) : null;

  const takeHomePct = summary?.takeHomePer100Cents.status === "available" ? summary.takeHomePer100Cents.value / 100 : null;
  const custosPct = takeHomePct !== null ? 100 - takeHomePct : null;

  const porCategoria = (() => {
    const totals = new Map<string, number>();
    for (const c of custos) totals.set(c.categoria, (totals.get(c.categoria) ?? 0) + parseValor(c.valor));
    return [...totals.entries()].map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total).slice(0, 4);
  })();
  const netRevenue = summary ? summary.netRevenueCents / 100 : 0;
  const maiorCategoria = porCategoria[0];

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
          <b>Mês corrente</b> · {vendas.length} lançamento{vendas.length === 1 ? "" : "s"} registrados até hoje.
        </span>
        <span className="link" onClick={() => goTo("vendas")}>
          Ver lançamentos →
        </span>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="label">Vendas informadas</div>
          <div className="value">{summary ? formatCurrencyDisplay(summary.netRevenueCents) : "—"}</div>
          {revenueDelta ? (
            <div className={revenueDelta.up ? "delta up" : "delta down"}>
              {revenueDelta.text} <span className="sub">vs. mês anterior</span>
            </div>
          ) : (
            <div className="sub" style={{ fontSize: 12.5 }}>
              {totalPedidos.toLocaleString("pt-BR")} pedidos
            </div>
          )}
        </div>
        <div className="card stat-card">
          <div className="label">Custos informados</div>
          <div className="value">{summary ? formatCurrencyDisplay(summary.totalCostsCents) : "—"}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Lucro estimado</div>
          <div className="value blue">{summary?.profit.status === "available" ? formatCurrencyDisplay(lucro) : "Indisponível"}</div>
          {lucroDelta ? (
            <div className={lucroDelta.up ? "delta up" : "delta down"}>
              {lucroDelta.text} <span className="sub">vs. mês anterior</span>
            </div>
          ) : (
            <div className="sub" style={{ fontSize: 12.5 }}>
              Margem de {margemPct === "—" ? "—" : `${margemPct}%`}
            </div>
          )}
        </div>
        <div className="card stat-card">
          <div className="label">Lucro por pedido</div>
          <div className="value">{lucroPorPedido !== null ? formatCurrencyDisplay(lucroPorPedido) : "Indisponível"}</div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            Média do mês
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card section-block">
          <div className="section-title">Como suas vendas se dividem</div>
          <div className="section-sub">A cada R$100 vendidos</div>
          {custosPct !== null && takeHomePct !== null ? (
            <>
              <div className="split-bar">
                <div className="seg-a" style={{ width: `${custosPct}%` }}>
                  {Math.round(custosPct)}%
                </div>
                <div className="seg-b" style={{ width: `${takeHomePct}%` }}>
                  {Math.round(takeHomePct)}%
                </div>
              </div>
              <div className="legend-row">
                <div className="legend-item">
                  <span className="sw" style={{ background: "var(--gray-bar)" }}></span>Custos <span className="amt">R${custosPct.toFixed(0)}</span>
                </div>
                <div className="legend-item">
                  <span className="sw" style={{ background: "var(--primary)" }}></span>Lucro estimado <span className="amt">R${takeHomePct.toFixed(0)}</span>
                </div>
              </div>
              <div className="divider-line"></div>
              <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 2 }}>
                R${takeHomePct.toFixed(0)} ficam no delivery a cada R$100 vendidos.
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Com base nos custos informados.</div>
            </>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginTop: 10 }}>
              Lance vendas neste mês para ver essa divisão.
            </p>
          )}
        </div>

        <div className="card section-block">
          <div className="section-title">Meta de lucro</div>
          <div style={{ fontSize: 22, fontWeight: 700, margin: "14px 0 4px" }}>
            {formatCurrencyDisplay(lucro)}{" "}
            {profitGoalCents !== null && (
              <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 15 }}>de {formatCurrencyDisplay(profitGoalCents)}</span>
            )}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${meta.progresso}%` }}></div>
          </div>
          <div className="progress-row">
            <span>
              {profitGoalCents === null
                ? "Nenhuma meta definida ainda."
                : profitGoalCents - lucro > 0
                  ? `Faltam ${formatCurrencyDisplay(profitGoalCents - lucro)} para a meta.`
                  : "Meta atingida!"}
            </span>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>{meta.progresso}%</span>
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
              {porCategoria.map((row) => {
                const pctVendas = netRevenue > 0 ? Math.round((row.total / netRevenue) * 100) : 0;
                return (
                  <div className="mini-bar-row" key={row.categoria}>
                    <div className="cat">{row.categoria}</div>
                    <div className="val">R$ {row.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="mini-bar-track">
                      <div className="mini-bar-fill" style={{ width: `${Math.min(100, pctVendas)}%` }}></div>
                    </div>
                    <div className="mini-bar-pct">{pctVendas}%</div>
                  </div>
                );
              })}
              {porCategoria.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13.5 }}>Nenhuma despesa lançada neste mês.</p>}
            </div>
          </div>
        </div>

        <div className="card callout-card">
          <div className="section-title" style={{ marginBottom: 14 }}>
            Onde olhar primeiro
          </div>
          <h4>
            <span className="callout-dot"></span>
            {maiorCategoria?.categoria ?? "Sem despesas ainda"}
          </h4>
          <p>
            {maiorCategoria
              ? "É o maior custo informado no período. Confira os valores e procure oportunidades de redução."
              : "Lance suas despesas para ver onde olhar primeiro."}
          </p>
          <span className="link" onClick={() => goTo("custos")}>
            Revisar custos →
          </span>
        </div>
      </div>

      <div className="empty-note">Resultado estimado com base nas vendas e nos custos informados.</div>
    </section>
  );
}
