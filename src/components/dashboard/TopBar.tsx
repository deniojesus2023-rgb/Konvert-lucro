"use client";

import { useDashboard, type ViewName } from "./DashboardContext";

const titles: Record<ViewName, string> = {
  overview: "Visão geral",
  vendas: "Vendas",
  custos: "Custos e despesas",
  resultados: "Resultados",
  metas: "Metas",
  importacoes: "Importações",
  integracoes: "Integrações",
  configuracoes: "Configurações",
  ajuda: "Ajuda",
  perfil: "Perfil",
};

interface TopBarProps {
  activeView: ViewName;
}

export function TopBar({ activeView }: TopBarProps) {
  const { goTo } = useDashboard();

  return (
    <div className="topbar">
      <div className="breadcrumb">
        Meu delivery / <b>{titles[activeView]}</b>
      </div>
      <div className="topbar-right">
        <span className="demo-badge">Dados de demonstração</span>
        <div className="icon-btn" title="Ajuda" onClick={() => goTo("ajuda")}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <div className="avatar sm" style={{ cursor: "pointer" }} onClick={() => goTo("perfil")}>
          MC
        </div>
      </div>
    </div>
  );
}
