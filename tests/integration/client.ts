import { NextRequest } from "next/server";
import { POST as createDraft } from "@/app/api/raio-x/route";
import { GET as getDraftRoute } from "@/app/api/raio-x/[id]/route";
import { PATCH as patchAnswersRoute } from "@/app/api/raio-x/[id]/answers/route";
import { POST as finalizeRoute } from "@/app/api/raio-x/[id]/finalize/route";
import { POST as reviseRoute } from "@/app/api/raio-x/[id]/revise/route";
import { GET as publicResultRoute } from "@/app/api/raio-x/resultado/[token]/route";
import { SESSION_COOKIE_NAME } from "@/server/security/session-cookie";

const ORIGIN = "http://localhost:3000";

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  headers: Headers;
}

/**
 * A browser-ish client for the integration tests: it calls the real Route
 * Handlers with real `NextRequest` objects and keeps a cookie jar, so
 * session issuing, rotation and isolation are exercised exactly as a
 * browser would exercise them — no mocked auth, no bypassed validation.
 */
export class TestClient {
  private cookie: string | null = null;

  /** Lets a test observe (or forge) the session cookie. */
  getSessionCookie(): string | null {
    return this.cookie;
  }

  setSessionCookie(value: string | null): void {
    this.cookie = value;
  }

  private buildRequest(
    method: string,
    path: string,
    options: { body?: unknown; origin?: string | null; contentType?: string | null } = {},
  ): NextRequest {
    const headers = new Headers();

    if (options.origin !== null) {
      headers.set("origin", options.origin ?? ORIGIN);
    }
    if (options.body !== undefined && options.contentType !== null) {
      headers.set("content-type", options.contentType ?? "application/json");
    }
    if (this.cookie) {
      headers.set("cookie", `${SESSION_COOKIE_NAME}=${this.cookie}`);
    }

    return new NextRequest(`${ORIGIN}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  }

  private async capture<T>(response: Response): Promise<ApiResponse<T>> {
    const setCookie = response.headers.getSetCookie?.() ?? [];
    for (const raw of setCookie) {
      const match = raw.match(new RegExp(`^${SESSION_COOKIE_NAME}=([^;]*)`));
      if (match) this.cookie = match[1];
    }

    const text = await response.text();
    return {
      status: response.status,
      body: (text ? JSON.parse(text) : null) as T,
      headers: response.headers,
    };
  }

  async createDraft(options: { origin?: string | null } = {}): Promise<
    ApiResponse<{ id: string; status: string; answersVersion: number }>
  > {
    const request = this.buildRequest("POST", "/api/raio-x", options);
    return this.capture(await createDraft(request));
  }

  async getDraft(id: string): Promise<ApiResponse<Record<string, unknown>>> {
    const request = this.buildRequest("GET", `/api/raio-x/${id}`);
    return this.capture(
      await getDraftRoute(request, { params: Promise.resolve({ id }) }),
    );
  }

  async patchAnswers(
    id: string,
    body: unknown,
    options: { origin?: string | null; contentType?: string | null } = {},
  ): Promise<ApiResponse<{ answersVersion?: number; error?: unknown }>> {
    const request = this.buildRequest("PATCH", `/api/raio-x/${id}/answers`, {
      body,
      ...options,
    });
    return this.capture(
      await patchAnswersRoute(request, { params: Promise.resolve({ id }) }),
    );
  }

  async finalize(
    id: string,
    body: unknown,
    options: { origin?: string | null } = {},
  ): Promise<ApiResponse<{ resultToken?: string; alreadyFinalized?: boolean; error?: unknown }>> {
    const request = this.buildRequest("POST", `/api/raio-x/${id}/finalize`, {
      body,
      ...options,
    });
    return this.capture(await finalizeRoute(request, { params: Promise.resolve({ id }) }));
  }

  async revise(
    id: string,
  ): Promise<ApiResponse<{ id?: string; answersVersion?: number; sourceDiagnosticId?: string }>> {
    const request = this.buildRequest("POST", `/api/raio-x/${id}/revise`);
    return this.capture(await reviseRoute(request, { params: Promise.resolve({ id }) }));
  }

  async publicResult(token: string): Promise<ApiResponse<Record<string, unknown>>> {
    const request = this.buildRequest("GET", `/api/raio-x/resultado/${token}`);
    return this.capture(
      await publicResultRoute(request, { params: Promise.resolve({ token }) }),
    );
  }
}

/** A complete, valid set of answers for the mandatory base scenario. */
export const BASE_ANSWERS = {
  revenue: { kind: "informed" as const, value: 5_000_000 },
  cost_production: { kind: "informed" as const, value: 1_500_000 },
  cost_fees: { kind: "informed" as const, value: 1_000_000 },
  cost_delivery: { kind: "informed" as const, value: 500_000 },
  cost_fixed_structure: { kind: "informed" as const, value: 1_000_000 },
  taxes: { kind: "zero_confirmed" as const },
  orders: { kind: "informed" as const, value: 1000 },
  goal: { kind: "informed" as const, value: 500_000 },
};

export const VALID_CONTACT = {
  name: "Maria da Silva",
  whatsapp: "(11) 98888-7777",
  contactConsent: true as const,
  marketingOptIn: false,
  consentTextVersion: "test.v1",
};

export function idempotencyKey(seed = "chave"): string {
  return `${seed}-${"0".repeat(Math.max(0, 20 - seed.length))}-integration`;
}

/** Walks a fresh draft all the way to "ready to finalize". */
export async function seedCompletedAnswers(
  client: TestClient,
): Promise<{ id: string; answersVersion: number }> {
  const created = await client.createDraft();
  const id = created.body.id;

  const patched = await client.patchAnswers(id, {
    expectedVersion: 0,
    answers: BASE_ANSWERS,
    taxClassification: "variable",
    profile: { deliveryType: "hamburgueria", mainChannel: "ifood" },
  });

  return { id, answersVersion: patched.body.answersVersion ?? 1 };
}
