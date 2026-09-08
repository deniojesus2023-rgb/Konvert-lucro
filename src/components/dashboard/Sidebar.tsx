"use client";

import { useDashboard, type ViewName } from "./DashboardContext";

interface NavItemDef {
  view: ViewName;
  label: string;
  icon: React.ReactNode;
}

const mainItems: NavItemDef[] = [
  {
    view: "overview",
    label: "Visão geral",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    view: "vendas",
    label: "Vendas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20V10" />
        <path d="M12 20V4" />
        <path d="M20 20v-7" />
      </svg>
    ),
  },
  {
    view: "custos",
    label: "Custos e despesas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    view: "resultados",
    label: "Resultados",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    ),
  },
  {
    view: "metas",
    label: "Metas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </svg>
    ),
  },
  {
    view: "importacoes",
    label: "Importações",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4" />
        <path d="M7 9l5-5 5 5" />
        <path d="M4 16v4h16v-4" />
      </svg>
    ),
  },
  {
    view: "integracoes",
    label: "Integrações",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3v4" />
        <path d="M15 3v4" />
        <path d="M6 7h12l-1 5a5 5 0 0 1-10 0L6 7Z" />
        <path d="M10 16v2a2 2 0 0 0 4 0v-2" />
      </svg>
    ),
  },
];

const footerNavItems: NavItemDef[] = [
  {
    view: "configuracoes",
    label: "Configurações",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h0a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v0a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
      </svg>
    ),
  },
  {
    view: "ajuda",
    label: "Ajuda",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
];

interface SidebarProps {
  activeView: ViewName;
}

export function Sidebar({ activeView }: SidebarProps) {
  const { goTo } = useDashboard();

  function renderItem(item: NavItemDef) {
    return (
      <div
        key={item.view}
        className={`nav-item${activeView === item.view ? " active" : ""}`}
        onClick={() => goTo(item.view)}
      >
        {item.icon}
        {item.label}
      </div>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        {/* The prototype's own asset ("assets/logo.jpeg") isn't part of
            this repo — using the real Konvert logo already shipped at
            `public/brand/`, same height the prototype specified inline. */}
        <img src="/brand/konvert-logo-transparent.png" alt="Konvert" style={{ height: 26 }} />
      </div>

      <div className="store-switcher">
        <div className="store-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l1-5h16l1 5" />
            <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
            <path d="M4 9v10h16V9" />
          </svg>
        </div>
        <div className="store-info">
          <div className="name">Burger da Vila</div>
          <div className="sub">Meu delivery</div>
        </div>
        <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      <nav className="nav">
        {mainItems.map(renderItem)}
        <div className="nav-divider" />
        {footerNavItems.map(renderItem)}
      </nav>

      <div className="sidebar-footer">
        <div className="user-row" onClick={() => goTo("perfil")}>
          <div className="avatar sm">MC</div>
          <div className="uname">Mariana Costa</div>
          <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </aside>
  );
}
