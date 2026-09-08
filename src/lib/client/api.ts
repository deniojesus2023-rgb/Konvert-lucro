"use client";

import type { FunnelEventName } from "@/lib/validation/diagnostic-schemas";

/**
 * Thin fetch wrappers over the Fase 1B API. Every mutating call sends the
 * session cookie automatically (same-origin `fetch` does this by
 * default) — nothing here reads or writes the cookie directly.
 */

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    let body: ApiErrorBody = { code: "unknown_error", message: "Erro desconhecido" };
    try {
      const parsed = (await response.json()) as { error?: ApiErrorBody };
      if (parsed.error) body = parsed.error;
    } catch {
      // Response had no JSON body — keep the generic message.
    }
    throw new ApiRequestError(response.status, body);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface CreateDraftResponse {
  id: string;
  status: "draft";
  answersVersion: number;
}

export function createDraft(): Promise<CreateDraftResponse> {
  return request("/api/raio-x", { method: "POST" });
}

export interface DraftResponse {
  id: string;
  status: "draft" | "completed";
  answersVersion: number;
  deliveryType: string | null;
  mainChannel: string | null;
  taxClassification: string | null;
  sourceDiagnosticId: string | null;
  completedAt: string | null;
  answers: Record<string, unknown>;
  resultPath: string | null;
}

export function getDraft(id: string): Promise<DraftResponse> {
  return request(`/api/raio-x/${id}`, { method: "GET" });
}

export interface PatchAnswersBody {
  expectedVersion: number;
  answers?: Record<string, unknown>;
  profile?: { deliveryType?: string | null; mainChannel?: string | null };
  taxClassification?: "fixed" | "variable" | "unclassified";
}

export function patchAnswers(
  id: string,
  body: PatchAnswersBody,
): Promise<{ answersVersion: number }> {
  return request(`/api/raio-x/${id}/answers`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export interface FinalizeBody {
  expectedVersion: number;
  idempotencyKey: string;
  contact: {
    name: string;
    whatsapp: string;
    contactConsent: true;
    marketingOptIn: boolean;
    consentTextVersion: string;
  };
}

export interface FinalizeResponse {
  resultToken: string;
  resultPath: string;
  alreadyFinalized: boolean;
}

export function finalizeDiagnostic(id: string, body: FinalizeBody): Promise<FinalizeResponse> {
  return request(`/api/raio-x/${id}/finalize`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface ReviseResponse {
  id: string;
  status: "draft";
  answersVersion: number;
  sourceDiagnosticId: string;
}

export function reviseDiagnostic(id: string): Promise<ReviseResponse> {
  return request(`/api/raio-x/${id}/revise`, { method: "POST" });
}

export interface ActivateAccountBody {
  email: string;
  establishmentName: string;
}

export interface ActivateAccountResponse {
  message: string;
  devVerifyUrl?: string;
}

export function activateAccount(id: string, body: ActivateAccountBody): Promise<ActivateAccountResponse> {
  return request(`/api/raio-x/${id}/activate-account`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface DailyEntryPayload {
  entryDate: string;
  channelName?: string | null;
  grossRevenueCents: number;
  ordersCount: number;
  discountsCents: number;
  cancellationsCents: number;
  knownFeesCents: number;
  expectedVersion?: number;
}

export interface DailyEntryView {
  id: string;
  entryDate: string;
  channelId: string | null;
  channelName: string | null;
  grossRevenueCents: number;
  ordersCount: number;
  discountsCents: number;
  cancellationsCents: number;
  knownFeesCents: number;
  entriesVersion: number;
}

export function upsertDailyEntry(
  establishmentId: string,
  body: DailyEntryPayload,
): Promise<{ entry: DailyEntryView }> {
  return request(`/api/app/establishments/${establishmentId}/daily-entries`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listDailyEntries(
  establishmentId: string,
  range: { from: string; to: string },
): Promise<{ entries: DailyEntryView[] }> {
  return request(
    `/api/app/establishments/${establishmentId}/daily-entries?from=${range.from}&to=${range.to}`,
    { method: "GET" },
  );
}

export type TrackingMetric<T> =
  | { status: "available"; value: T }
  | {
      status: "unavailable";
      reason: "exceeds_safe_range" | "zero_orders" | "non_positive_revenue" | "no_goal" | "no_prior_period";
    };

export interface PeriodSummary {
  formulaVersion: string;
  netRevenueCents: number;
  totalCostsCents: number;
  profit: TrackingMetric<number>;
  marginBps: TrackingMetric<number>;
  profitPerOrder: TrackingMetric<number>;
  takeHomePer100Cents: TrackingMetric<number>;
}

export function getPeriodSummary(
  establishmentId: string,
  range: { from: string; to: string },
): Promise<{ summary: PeriodSummary }> {
  return request(`/api/app/establishments/${establishmentId}/summary?from=${range.from}&to=${range.to}`, {
    method: "GET",
  });
}

export interface RecurringCostPayload {
  categoryName: string;
  name: string;
  amountCents: number;
  frequency: "monthly" | "weekly";
  startDate: string;
  endDate?: string | null;
}

export interface RecurringCostView {
  id: string;
  name: string;
  amountCents: number;
  frequency: "monthly" | "weekly";
  startDate: string;
  endDate: string | null;
  active: boolean;
}

export function createRecurringCost(
  establishmentId: string,
  body: RecurringCostPayload,
): Promise<{ recurringCost: RecurringCostView }> {
  return request(`/api/app/establishments/${establishmentId}/recurring-costs`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listRecurringCosts(
  establishmentId: string,
): Promise<{ recurringCosts: RecurringCostView[] }> {
  return request(`/api/app/establishments/${establishmentId}/recurring-costs`, { method: "GET" });
}

export interface GoalPayload {
  periodStart: string;
  profitGoalCents?: number | null;
  revenueGoalCents?: number | null;
  marginGoalBps?: number | null;
}

export interface GoalView {
  periodStart: string;
  profitGoalCents: number | null;
  revenueGoalCents: number | null;
  marginGoalBps: number | null;
}

export function upsertGoal(establishmentId: string, body: GoalPayload): Promise<{ goal: GoalView }> {
  return request(`/api/app/establishments/${establishmentId}/goals`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface GoalProgress {
  summary: PeriodSummary;
  profitGoalCents: number | null;
  gapToGoal: TrackingMetric<number>;
}

export function getGoalProgress(establishmentId: string, month: string): Promise<{ progress: GoalProgress }> {
  return request(`/api/app/establishments/${establishmentId}/goals?month=${month}`, { method: "GET" });
}

export interface SubscriptionStatusView {
  status: "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "none";
  isActive: boolean;
  currentPeriodEnd: string | null;
}

export function getSubscriptionStatus(
  establishmentId: string,
): Promise<{ subscription: SubscriptionStatusView }> {
  return request(`/api/app/establishments/${establishmentId}/subscription`, { method: "GET" });
}

export function startCheckout(establishmentId: string): Promise<{ url: string }> {
  return request(`/api/app/establishments/${establishmentId}/billing/checkout`, { method: "POST" });
}

export function openBillingPortal(establishmentId: string): Promise<{ url: string }> {
  return request(`/api/app/establishments/${establishmentId}/billing/portal`, { method: "POST" });
}

export interface CreateEstablishmentBody {
  name: string;
}

export interface CreateEstablishmentResponse {
  establishment: { id: string; name: string; timezone: string };
}

export function createEstablishment(body: CreateEstablishmentBody): Promise<CreateEstablishmentResponse> {
  return request("/api/app/establishments", { method: "POST", body: JSON.stringify(body) });
}

export interface VariableCostPayload {
  costDate: string;
  categoryName: string;
  amountCents: number;
  note?: string | null;
}

export interface VariableCostView {
  id: string;
  costDate: string;
  categoryName: string;
  amountCents: number;
  note: string | null;
}

export function createVariableCost(
  establishmentId: string,
  body: VariableCostPayload,
): Promise<{ variableCost: VariableCostView }> {
  return request(`/api/app/establishments/${establishmentId}/variable-costs`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listVariableCosts(
  establishmentId: string,
  range: { from: string; to: string },
): Promise<{ variableCosts: VariableCostView[] }> {
  return request(
    `/api/app/establishments/${establishmentId}/variable-costs?from=${range.from}&to=${range.to}`,
    { method: "GET" },
  );
}

export function deleteVariableCost(establishmentId: string, costId: string): Promise<{ ok: true }> {
  return request(`/api/app/establishments/${establishmentId}/variable-costs/${costId}`, { method: "DELETE" });
}

export function deactivateRecurringCost(establishmentId: string, costId: string): Promise<{ ok: true }> {
  return request(`/api/app/establishments/${establishmentId}/recurring-costs/${costId}`, { method: "DELETE" });
}

export interface SendEventBody {
  eventName: FunnelEventName;
  diagnosticId?: string;
  metadata?: {
    step?: number;
    durationMs?: number;
    resultMode?: "available" | "partial";
    source?: string;
  };
}

/** Fire-and-forget: a failed analytics call must never break the funnel. */
export function sendFunnelEvent(body: SendEventBody): void {
  void request("/api/raio-x/events", {
    method: "POST",
    body: JSON.stringify(body),
  }).catch(() => {
    // Analytics is best-effort.
  });
}
