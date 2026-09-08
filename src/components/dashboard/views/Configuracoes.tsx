"use client";

import { useState } from "react";
import { useDashboard } from "../DashboardContext";
import { TabGroup } from "../shared";

function ToggleSwitch({ defaultOn = true }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return <div className={`toggle${on ? " on" : ""}`} onClick={() => setOn((v) => !v)}></div>;
}

export function Configuracoes({ isActive }: { isActive: boolean }) {
  const { goTo, toast } = useDashboard();

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-configuracoes">
      <div className="page-head">
        <div>
          <h1>Configurações</h1>
          <p>Ajuste as preferências do seu delivery e personalize o sistema de acordo com a sua operação.</p>
        </div>
      </div>

      <TabGroup tabs={["Geral", "Notificações", "Usuários", "Plano e cobrança", "Preferências"]} />

      <div className="grid grid-4">
        <div className="card section-block">
          <div className="section-title">Dados da empresa</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            Configure as informações do seu delivery que serão exibidas no sistema e em relatórios.
          </p>
          <label className="field-label" style={{ marginTop: 14 }}>
            Nome do delivery
          </label>
          <input className="field-input" defaultValue="Burger da Vila" />
          <label className="field-label" style={{ marginTop: 12 }}>
            CNPJ (opcional)
          </label>
          <input className="field-input" placeholder="00.000.000/0000-00" />
          <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} onClick={() => toast("Dados atualizados (demonstração)")}>
            Editar dados
          </button>
        </div>

        <div className="card section-block">
          <div className="section-title">Região e moeda</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Defina a moeda, fuso horário e outras configurações regionais.</p>
          <label className="field-label" style={{ marginTop: 14 }}>
            Moeda
          </label>
          <select className="field-input">
            <option>Real (R$)</option>
          </select>
          <label className="field-label" style={{ marginTop: 12 }}>
            Fuso horário
          </label>
          <select className="field-input">
            <option>Brasília (GMT-3)</option>
          </select>
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
            onClick={() => toast("Alterações salvas (demonstração)")}
          >
            Salvar alterações
          </button>
        </div>

        <div className="card section-block">
          <div className="section-title">Notificações</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Escolha como e quando deseja receber alertas sobre o seu delivery.</p>
          <div style={{ marginTop: 10 }}>
            <div className="toggle-row">
              <div>
                <div className="tname">Novas vendas</div>
                <div className="tdesc">Receba um alerta a cada nova venda</div>
              </div>
              <ToggleSwitch />
            </div>
            <div className="toggle-row">
              <div>
                <div className="tname">Relatório diário</div>
                <div className="tdesc">Receba o resumo das vendas por e-mail</div>
              </div>
              <ToggleSwitch />
            </div>
            <div className="toggle-row">
              <div>
                <div className="tname">Metas</div>
                <div className="tdesc">Seja notificado sobre o progresso das metas</div>
              </div>
              <ToggleSwitch />
            </div>
          </div>
          <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} onClick={() => goTo("ajuda")}>
            Configurar notificações
          </button>
        </div>

        <div className="card section-block">
          <div className="section-title">Usuários e equipe</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Gerencie quem pode acessar o sistema e defina os níveis de permissão.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <div className="avatar sm">MC</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                Mariana Costa <span className="badge badge-green">Administrador</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>proprietaria@burgerdavila.com</div>
            </div>
          </div>
          <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} onClick={() => toast("Gerenciar usuários (demonstração)")}>
            Gerenciar usuários
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
        <div className="card section-block">
          <div className="section-title">Plano e cobrança</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Visualize seu plano atual, gerencie a cobrança e atualize sua assinatura.</p>
          <div style={{ background: "var(--primary-light)", borderRadius: "var(--radius-sm)", padding: 16, marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>Profissional</div>
              <span className="badge badge-green">Ativo</span>
            </div>
            <div style={{ color: "var(--primary-dark)", fontWeight: 700, fontSize: 18, margin: "4px 0 10px" }}>R$ 79,90/mês</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 4 }}>
              <span>✓ Todas as funcionalidades</span>
              <span>✓ Relatórios avançados</span>
              <span>✓ Suporte prioritário</span>
            </div>
          </div>
          <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} onClick={() => toast("Gerenciar plano (demonstração)")}>
            Gerenciar plano
          </button>
        </div>
        <div className="card section-block">
          <div className="section-title">Preferências do sistema</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Personalize o funcionamento do sistema de acordo com a sua operação.</p>
          <div style={{ marginTop: 10 }}>
            <div className="toggle-row">
              <div>
                <div className="tname">Mostrar ticket médio no dashboard</div>
              </div>
              <ToggleSwitch />
            </div>
            <div className="toggle-row">
              <div>
                <div className="tname">Agrupar produtos por categoria</div>
              </div>
              <ToggleSwitch />
            </div>
            <div className="toggle-row">
              <div>
                <div className="tname">Exibir valores com centavos</div>
              </div>
              <ToggleSwitch defaultOn={false} />
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
            onClick={() => toast("Preferências salvas (demonstração)")}
          >
            Salvar preferências
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13.5 }}>
          🛈 <b>Precisa de ajuda?</b> Acesse nossa central de ajuda ou fale com o nosso suporte para configurar o seu delivery.
        </div>
        <button className="btn btn-outline" onClick={() => goTo("ajuda")}>
          Central de ajuda ↗
        </button>
      </div>
    </section>
  );
}
