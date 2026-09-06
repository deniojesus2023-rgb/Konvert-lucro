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
