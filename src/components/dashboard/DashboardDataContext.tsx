"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  vendas as initialVendas,
  custos as initialCustos,
  metas as initialMetas,
  integList as initialIntegList,
  type VendaRow,
  type CustoRow,
  type MetaRow,
  type IntegracaoItem,
} from "./data";

/**
 * The app's mock "backend": everything here is in-memory React state, but
 * the shape (list + add/remove/toggle) is exactly what a real API-backed
 * version would expose. Swapping this provider's internals for real
 * `fetch` calls to the Fases 0-5 endpoints — without touching a single
 * view component — is the intended migration path once the database is
 * wired in.
 */
export interface DashboardDataContextValue {
  vendas: VendaRow[];
  addVenda: (input: Omit<VendaRow, "pedido">) => void;
  removeVenda: (pedido: string) => void;

  custos: CustoRow[];
  addCusto: (input: CustoRow) => void;
  removeCusto: (index: number) => void;

  metas: MetaRow[];
  addMeta: (input: MetaRow) => void;
  removeMeta: (nome: string) => void;

  integList: IntegracaoItem[];
  toggleIntegracao: (name: string) => void;
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

let vendaCounter = initialVendas.length;

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const [vendas, setVendas] = useState<VendaRow[]>(initialVendas);
  const [custos, setCustos] = useState<CustoRow[]>(initialCustos);
  const [metas, setMetas] = useState<MetaRow[]>(initialMetas);
  const [integList, setIntegList] = useState<IntegracaoItem[]>(initialIntegList);

  const addVenda = useCallback((input: Omit<VendaRow, "pedido">) => {
    vendaCounter += 1;
    const pedido = `#${String(1000 + vendaCounter).padStart(4, "0")}`;
    setVendas((prev) => [{ ...input, pedido }, ...prev]);
  }, []);

  const removeVenda = useCallback((pedido: string) => {
    setVendas((prev) => prev.filter((v) => v.pedido !== pedido));
  }, []);

  const addCusto = useCallback((input: CustoRow) => {
    setCustos((prev) => [input, ...prev]);
  }, []);

  const removeCusto = useCallback((index: number) => {
    setCustos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addMeta = useCallback((input: MetaRow) => {
    setMetas((prev) => [...prev, input]);
  }, []);

  const removeMeta = useCallback((nome: string) => {
    setMetas((prev) => prev.filter((m) => m.nome !== nome));
  }, []);

  const toggleIntegracao = useCallback((name: string) => {
    setIntegList((prev) => prev.map((it) => (it.name === name ? { ...it, on: !it.on } : it)));
  }, []);

  const value = useMemo(
    () => ({ vendas, addVenda, removeVenda, custos, addCusto, removeCusto, metas, addMeta, removeMeta, integList, toggleIntegracao }),
    [vendas, addVenda, removeVenda, custos, addCusto, removeCusto, metas, addMeta, removeMeta, integList, toggleIntegracao],
  );

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData(): DashboardDataContextValue {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error("useDashboardData must be used within the dashboard shell");
  return ctx;
}
