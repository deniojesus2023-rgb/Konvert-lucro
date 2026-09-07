"use client";

import { ApiRequestError, type ApiErrorBody } from "./api";

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorBody: ApiErrorBody = { code: "unknown_error", message: "Erro desconhecido" };
    try {
      const parsed = (await response.json()) as { error?: ApiErrorBody };
      if (parsed.error) errorBody = parsed.error;
    } catch {
      // No JSON body — keep the generic message.
    }
    throw new ApiRequestError(response.status, errorBody);
  }

  return (await response.json()) as T;
}

export interface RequestLinkResponse {
  message: string;
  devVerifyUrl?: string;
}

export function requestMagicLink(email: string): Promise<RequestLinkResponse> {
  return request("/api/auth/request-link", { email });
}

export function verifyMagicLink(token: string): Promise<{ ok: true }> {
  return request("/api/auth/verify", { token });
}
