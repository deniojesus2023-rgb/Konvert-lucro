"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./dashboard.css";
import { DashboardContext, type ViewName } from "./DashboardContext";
import { DashboardDataProvider } from "./DashboardDataContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Overview } from "./views/Overview";
import { Vendas } from "./views/Vendas";
import { Custos } from "./views/Custos";
import { Resultados } from "./views/Resultados";
import { Metas } from "./views/Metas";
import { Importacoes } from "./views/Importacoes";
import { Integracoes } from "./views/Integracoes";
import { Configuracoes } from "./views/Configuracoes";
import { Ajuda } from "./views/Ajuda";
import { Perfil } from "./views/Perfil";

/**
 * Mirrors the prototype's SPA navigation: every view stays mounted in the
 * DOM (matching its `.view`/`.view.active` display:none toggle) instead of
 * unmounting on switch, so in-view state (search inputs, open FAQ items,
 * tab selection) survives moving to another section and back — exactly
 * like the original, which never removed a section from the document.
 */
export interface DashboardAppProps {
  establishmentId: string;
  establishmentName: string;
  timezone: string;
}

export function DashboardApp({ establishmentId, establishmentName, timezone }: DashboardAppProps) {
  const [activeView, setActiveView] = useState<ViewName>("overview");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((view: ViewName) => {
    setActiveView(view);
    window.scrollTo(0, 0);
  }, []);

  const toast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <DashboardContext.Provider value={{ goTo, toast }}>
      <DashboardDataProvider establishmentId={establishmentId} establishmentName={establishmentName} timezone={timezone}>
        <div className="konvert-dashboard">
          <div className="app">
            <Sidebar activeView={activeView} />
            <div className="main">
              <TopBar activeView={activeView} />
              <div className="content">
                <Overview isActive={activeView === "overview"} />
                <Vendas isActive={activeView === "vendas"} />
                <Custos isActive={activeView === "custos"} />
                <Resultados isActive={activeView === "resultados"} />
                <Metas isActive={activeView === "metas"} />
                <Importacoes isActive={activeView === "importacoes"} />
                <Integracoes isActive={activeView === "integracoes"} />
                <Configuracoes isActive={activeView === "configuracoes"} />
                <Ajuda isActive={activeView === "ajuda"} />
                <Perfil isActive={activeView === "perfil"} />
              </div>
            </div>
          </div>
          <div className={`toast${toastMessage ? " show" : ""}`}>{toastMessage}</div>
        </div>
      </DashboardDataProvider>
    </DashboardContext.Provider>
  );
}
