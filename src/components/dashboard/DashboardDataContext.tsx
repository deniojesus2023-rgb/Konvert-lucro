"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getPeriodSummary,
  getGoalProgress,
  listDailyEntries,
  listVariableCosts,
  listRecurringCosts,
  upsertDailyEntry,
  upsertGoal,
  createVariableCost,
  createRecurringCost,
  deactivateRecurringCost as apiDeactivateRecurringCost,
  deleteVariableCost as apiDeleteVariableCost,
  type DailyEntryView,
  type VariableCostView,
  type RecurringCostView,
  type PeriodSummary,
} from "@/lib/client/api";
import { formatCurrencyDisplay, parseCurrencyInput } from "@/lib/client/currency";
import { startOfMonth, todayInTimezone, previousMonthRange } from "@/lib/dates/period-bounds";
import { integList as initialIntegList, type IntegracaoItem } from "./data";

function formatDateBR(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/** A day/channel revenue line — the shape the real ledger actually stores (see `daily_entries`). */
export interface VendaRow {
  id: string;
  entryDate: string;
  entriesVersion: number;
  canal: string;
  data: string;
  faturamento: string;
  pedidos: number;
  ticketMedio: string;
}

function toVendaRow(entry: DailyEntryView): VendaRow {
  const ticketMedio = entry.ordersCount > 0 ? Math.round(entry.grossRevenueCents / entry.ordersCount) : 0;
  return {
    id: entry.id,
    entryDate: entry.entryDate,
    entriesVersion: entry.entriesVersion,
    canal: entry.channelName ?? "Sem canal",
    data: formatDateBR(entry.entryDate),
    faturamento: formatCurrencyDisplay(entry.grossRevenueCents),
    pedidos: entry.ordersCount,
    ticketMedio: formatCurrencyDisplay(ticketMedio),
  };
}

export interface CustoRow {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  valor: string;
}

function toCustoRow(cost: VariableCostView): CustoRow {
  return {
    id: cost.id,
    data: formatDateBR(cost.costDate),
    descricao: cost.note && cost.note.trim().length > 0 ? cost.note : cost.categoryName,
    categoria: cost.categoryName,
    valor: formatCurrencyDisplay(cost.amountCents),
  };
}

export interface MetaRow {
  nome: string;
  tipo: string;
  valorMeta: string;
  valorAtual: string;
  progresso: number;
}

export interface RecurringCostRow {
  id: string;
  nome: string;
  valor: string;
  frequencia: "monthly" | "weekly";
  inicio: string;
  ativo: boolean;
}

function toRecurringCostRow(cost: RecurringCostView & { active?: boolean }): RecurringCostRow {
  return {
    id: cost.id,
    nome: cost.name,
    valor: formatCurrencyDisplay(cost.amountCents),
    frequencia: cost.frequency,
    inicio: formatDateBR(cost.startDate),
    ativo: cost.active ?? true,
  };
}

export interface DashboardDataContextValue {
  loading: boolean;
  error: string | null;
  summary: PeriodSummary | null;
  previousSummary: PeriodSummary | null;

  vendas: VendaRow[];
  addVenda: (input: {
    entryDate: string;
    channelName: string;
    grossRevenueCents: number;
    ordersCount: number;
    discountsCents: number;
    cancellationsCents: number;
    knownFeesCents: number;
    expectedVersion?: number;
  }) => Promise<void>;

  custos: CustoRow[];
  addCusto: (input: { costDate: string; categoryName: string; amountCents: number; note?: string | null }) => Promise<void>;
  removeCusto: (id: string) => Promise<void>;

  recurringCosts: RecurringCostRow[];
  addRecurringCost: (input: {
    categoryName: string;
    name: string;
    amountCents: number;
    frequency: "monthly" | "weekly";
    startDate: string;
  }) => Promise<void>;
  removeRecurringCost: (id: string) => Promise<void>;

  metas: MetaRow[];
  profitGoalCents: number | null;
  setProfitGoal: (amountCents: number | null) => Promise<void>;

  integList: IntegracaoItem[];
  toggleIntegracao: (name: string) => void;
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

export interface DashboardDataProviderProps {
  establishmentId: string;
  establishmentName: string;
  timezone: string;
  children: React.ReactNode;
}

/**
 * Real data layer: fetches this month's daily entries, variable costs and
 * profit-goal progress from the Fases 0-5 API and exposes them in the
 * same list+mutate shape the view components already expect. Integrations
 * (`integList`) stay local/mock — there's no real iFood/WhatsApp
 * connection to reflect yet (Fase 6, out of scope).
 */
export function DashboardDataProvider({ establishmentId, timezone, children }: DashboardDataProviderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendas, setVendas] = useState<VendaRow[]>([]);
  const [custos, setCustos] = useState<CustoRow[]>([]);
  const [recurringCosts, setRecurringCosts] = useState<RecurringCostRow[]>([]);
  const [profitGoalCents, setProfitGoalCents] = useState<number | null>(null);
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [previousSummary, setPreviousSummary] = useState<PeriodSummary | null>(null);
  const [integList, setIntegList] = useState<IntegracaoItem[]>(initialIntegList);

  const today = todayInTimezone(timezone);
  const monthStart = startOfMonth(today);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const previousMonth = previousMonthRange(monthStart);
      const [entriesRes, costsRes, recurringRes, goalRes, summaryRes, previousSummaryRes] = await Promise.all([
        listDailyEntries(establishmentId, { from: monthStart, to: today }),
        listVariableCosts(establishmentId, { from: monthStart, to: today }),
        listRecurringCosts(establishmentId),
        getGoalProgress(establishmentId, monthStart),
        getPeriodSummary(establishmentId, { from: monthStart, to: today }),
        getPeriodSummary(establishmentId, { from: previousMonth.fromDate, to: previousMonth.toDate }),
      ]);
      setVendas(entriesRes.entries.map(toVendaRow).sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1)));
      setCustos(costsRes.variableCosts.map(toCustoRow).sort((a, b) => (a.data < b.data ? 1 : -1)));
      setRecurringCosts(recurringRes.recurringCosts.filter((c) => c.active).map(toRecurringCostRow));
      setProfitGoalCents(goalRes.progress.profitGoalCents);
      setSummary(summaryRes.summary);
      setPreviousSummary(previousSummaryRes.summary);
    } catch {
      setError("Não foi possível carregar os dados do painel agora. Tente recarregar a página.");
    } finally {
      setLoading(false);
    }
  }, [establishmentId, monthStart, today]);

  useEffect(() => {
    void Promise.resolve().then(() => reload());
  }, [reload]);

  const addVenda = useCallback(
    async (input: {
      entryDate: string;
      channelName: string;
      grossRevenueCents: number;
      ordersCount: number;
      discountsCents: number;
      cancellationsCents: number;
      knownFeesCents: number;
      expectedVersion?: number;
    }) => {
      await upsertDailyEntry(establishmentId, input);
      await reload();
    },
    [establishmentId, reload],
  );

  const addCusto = useCallback(
    async (input: { costDate: string; categoryName: string; amountCents: number; note?: string | null }) => {
      await createVariableCost(establishmentId, input);
      await reload();
    },
    [establishmentId, reload],
  );

  const removeCusto = useCallback(
    async (id: string) => {
      await apiDeleteVariableCost(establishmentId, id);
      await reload();
    },
    [establishmentId, reload],
  );

  const addRecurringCost = useCallback(
    async (input: { categoryName: string; name: string; amountCents: number; frequency: "monthly" | "weekly"; startDate: string }) => {
      await createRecurringCost(establishmentId, input);
      await reload();
    },
    [establishmentId, reload],
  );

  const removeRecurringCost = useCallback(
    async (id: string) => {
      await apiDeactivateRecurringCost(establishmentId, id);
      await reload();
    },
    [establishmentId, reload],
  );

  const setProfitGoal = useCallback(
    async (amountCents: number | null) => {
      await upsertGoal(establishmentId, { periodStart: monthStart, profitGoalCents: amountCents });
      await reload();
    },
    [establishmentId, monthStart, reload],
  );

  const toggleIntegracao = useCallback((name: string) => {
    setIntegList((prev) => prev.map((it) => (it.name === name ? { ...it, on: !it.on } : it)));
  }, []);

  const currentProfitCents = summary?.profit.status === "available" ? summary.profit.value : 0;

  const metas = useMemo<MetaRow[]>(() => {
    const progresso = profitGoalCents && profitGoalCents > 0 ? Math.max(0, Math.min(100, Math.round((currentProfitCents / profitGoalCents) * 100))) : 0;
    return [
      {
        nome: "Lucro do mês",
        tipo: "Financeira",
        valorMeta: profitGoalCents !== null ? formatCurrencyDisplay(profitGoalCents) : "Não definida",
        valorAtual: formatCurrencyDisplay(currentProfitCents),
        progresso,
      },
    ];
  }, [profitGoalCents, currentProfitCents]);

  const value = useMemo<DashboardDataContextValue>(
    () => ({
      loading,
      error,
      summary,
      previousSummary,
      vendas,
      addVenda,
      custos,
      addCusto,
      removeCusto,
      recurringCosts,
      addRecurringCost,
      removeRecurringCost,
      metas,
      profitGoalCents,
      setProfitGoal,
      integList,
      toggleIntegracao,
    }),
    [
      loading,
      error,
      summary,
      previousSummary,
      vendas,
      addVenda,
      custos,
      addCusto,
      removeCusto,
      recurringCosts,
      addRecurringCost,
      removeRecurringCost,
      metas,
      profitGoalCents,
      setProfitGoal,
      integList,
      toggleIntegracao,
    ],
  );

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData(): DashboardDataContextValue {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error("useDashboardData must be used within the dashboard shell");
  return ctx;
}

/** Re-exported so callers don't need to know `parseCurrencyInput` lives in the currency module. */
export { parseCurrencyInput };
