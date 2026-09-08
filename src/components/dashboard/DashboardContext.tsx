"use client";

import { createContext, useContext } from "react";

export type ViewName =
  | "overview"
  | "vendas"
  | "custos"
  | "resultados"
  | "metas"
  | "importacoes"
  | "integracoes"
  | "configuracoes"
  | "ajuda"
  | "perfil";

export interface DashboardContextValue {
  goTo: (view: ViewName) => void;
  toast: (message: string) => void;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

/** Mirrors the prototype's global `goTo`/`toast` functions, scoped to the dashboard tree. */
export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within the dashboard shell");
  return ctx;
}
