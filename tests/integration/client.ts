import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "./setup";
import { POST as createDraft } from "@/app/api/raio-x/route";
import { GET as getDraftRoute } from "@/app/api/raio-x/[id]/route";
import { PATCH as patchAnswersRoute } from "@/app/api/raio-x/[id]/answers/route";
import { POST as finalizeRoute } from "@/app/api/raio-x/[id]/finalize/route";
import { POST as reviseRoute } from "@/app/api/raio-x/[id]/revise/route";
import { GET as publicResultRoute } from "@/app/api/raio-x/resultado/[token]/route";
import { POST as eventsRoute } from "@/app/api/raio-x/events/route";
import { SESSION_COOKIE_NAME } from "@/server/security/session-cookie";
import { FUNNEL_COOKIE_NAME } from "@/server/security/funnel-cookie";
import { APP_SESSION_COOKIE_NAME } from "@/server/security/app-session-cookie";
import { POST as requestLinkRoute } from "@/app/api/auth/request-link/route";
import { POST as verifyRoute } from "@/app/api/auth/verify/route";
import { POST as activateAccountRoute } from "@/app/api/raio-x/[id]/activate-account/route";
import {
  GET as listDailyEntriesRoute,
  POST as postDailyEntryRoute,
} from "@/app/api/app/establishments/[establishmentId]/daily-entries/route";
import { GET as getSummaryRoute } from "@/app/api/app/establishments/[establishmentId]/summary/route";
import {
  GET as listRecurringCostsRoute,
  POST as postRecurringCostRoute,
} from "@/app/api/app/establishments/[establishmentId]/recurring-costs/route";
import {
  GET as getGoalRoute,
  POST as postGoalRoute,
} from "@/app/api/app/establishments/[establishmentId]/goals/route";
import {
  GET as listVariableCostsRoute,
  POST as postVariableCostRoute,
} from "@/app/api/app/establishments/[establishmentId]/variable-costs/route";
import { DELETE as deleteVariableCostRoute } from "@/app/api/app/establishments/[establishmentId]/variable-costs/[costId]/route";
import { POST as postEstablishmentRoute } from "@/app/api/app/establishments/route";
import { POST as checkoutRoute } from "@/app/api/app/establishments/[establishmentId]/billing/checkout/route";
import { POST as portalRoute } from "@/app/api/app/establishments/[establishmentId]/billing/portal/route";
import { GET as getSubscriptionRoute } from "@/app/api/app/establishments/[establishmentId]/subscription/route";
import { POST as webhookRoute } from "@/app/api/billing/webhook/route";

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
  private funnelCookie: string | null = null;
  private appCookie: string | null = null;

  /** Lets a test observe (or forge) the session cookie. */
  getSessionCookie(): string | null {
    return this.cookie;
  }

  setSessionCookie(value: string | null): void {
    this.cookie = value;
  }

  getFunnelCookie(): string | null {
    return this.funnelCookie;
  }

  getAppSessionCookie(): string | null {
    return this.appCookie;
  }

  setAppSessionCookie(value: string | null): void {
    this.appCookie = value;
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
    const cookies: string[] = [];
    if (this.cookie) cookies.push(`${SESSION_COOKIE_NAME}=${this.cookie}`);
    if (this.funnelCookie) cookies.push(`${FUNNEL_COOKIE_NAME}=${this.funnelCookie}`);
    if (this.appCookie) cookies.push(`${APP_SESSION_COOKIE_NAME}=${this.appCookie}`);
    if (cookies.length > 0) headers.set("cookie", cookies.join("; "));

    return new NextRequest(`${ORIGIN}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  }

  private async capture<T>(response: Response): Promise<ApiResponse<T>> {
    const setCookie = response.headers.getSetCookie?.() ?? [];
    for (const raw of setCookie) {
      const sessionMatch = raw.match(new RegExp(`^${SESSION_COOKIE_NAME}=([^;]*)`));
      if (sessionMatch) this.cookie = sessionMatch[1];
      const funnelMatch = raw.match(new RegExp(`^${FUNNEL_COOKIE_NAME}=([^;]*)`));
      if (funnelMatch) this.funnelCookie = funnelMatch[1];
      const appMatch = raw.match(new RegExp(`^${APP_SESSION_COOKIE_NAME}=([^;]*)`));
      if (appMatch) this.appCookie = appMatch[1];
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

  async sendEvent(body: unknown): Promise<ApiResponse<{ error?: unknown }>> {
    const request = this.buildRequest("POST", "/api/raio-x/events", { body });
    return this.capture(await eventsRoute(request));
  }

  async requestMagicLink(
    email: string,
  ): Promise<ApiResponse<{ message?: string; devVerifyUrl?: string; error?: unknown }>> {
    const request = this.buildRequest("POST", "/api/auth/request-link", { body: { email } });
    return this.capture(await requestLinkRoute(request));
  }

  async verifyMagicLink(token: string): Promise<ApiResponse<{ ok?: boolean; error?: unknown }>> {
    const request = this.buildRequest("POST", "/api/auth/verify", { body: { token } });
    return this.capture(await verifyRoute(request));
  }

  async activateAccount(
    id: string,
    body: { email: string; establishmentName: string },
  ): Promise<ApiResponse<{ message?: string; devVerifyUrl?: string; error?: unknown }>> {
    const request = this.buildRequest("POST", `/api/raio-x/${id}/activate-account`, { body });
    return this.capture(await activateAccountRoute(request, { params: Promise.resolve({ id }) }));
  }

  async postDailyEntry(
    establishmentId: string,
    body: unknown,
  ): Promise<ApiResponse<{ entry?: Record<string, unknown>; error?: unknown }>> {
    const request = this.buildRequest("POST", `/api/app/establishments/${establishmentId}/daily-entries`, {
      body,
    });
    return this.capture(
      await postDailyEntryRoute(request, { params: Promise.resolve({ establishmentId }) }),
    );
  }

  async listDailyEntries(
    establishmentId: string,
    range: { from: string; to: string },
  ): Promise<ApiResponse<{ entries?: Record<string, unknown>[]; error?: unknown }>> {
    const request = this.buildRequest(
      "GET",
      `/api/app/establishments/${establishmentId}/daily-entries?from=${range.from}&to=${range.to}`,
    );
    return this.capture(
      await listDailyEntriesRoute(request, { params: Promise.resolve({ establishmentId }) }),
    );
  }

  async getSummary(
    establishmentId: string,
    range: { from: string; to: string },
  ): Promise<ApiResponse<{ summary?: Record<string, unknown>; error?: unknown }>> {
    const request = this.buildRequest(
      "GET",
      `/api/app/establishments/${establishmentId}/summary?from=${range.from}&to=${range.to}`,
    );
    return this.capture(await getSummaryRoute(request, { params: Promise.resolve({ establishmentId }) }));
  }

  async postRecurringCost(
    establishmentId: string,
    body: unknown,
  ): Promise<ApiResponse<{ recurringCost?: Record<string, unknown>; error?: unknown }>> {
    const request = this.buildRequest("POST", `/api/app/establishments/${establishmentId}/recurring-costs`, {
      body,
    });
    return this.capture(
      await postRecurringCostRoute(request, { params: Promise.resolve({ establishmentId }) }),
    );
  }

  async listRecurringCosts(
    establishmentId: string,
  ): Promise<ApiResponse<{ recurringCosts?: Record<string, unknown>[]; error?: unknown }>> {
    const request = this.buildRequest("GET", `/api/app/establishments/${establishmentId}/recurring-costs`);
    return this.capture(
      await listRecurringCostsRoute(request, { params: Promise.resolve({ establishmentId }) }),
    );
  }

  async postGoal(
    establishmentId: string,
    body: unknown,
  ): Promise<ApiResponse<{ goal?: Record<string, unknown>; error?: unknown }>> {
    const request = this.buildRequest("POST", `/api/app/establishments/${establishmentId}/goals`, { body });
    return this.capture(await postGoalRoute(request, { params: Promise.resolve({ establishmentId }) }));
  }

  async getGoalProgress(
    establishmentId: string,
    month: string,
  ): Promise<ApiResponse<{ progress?: Record<string, unknown>; error?: unknown }>> {
    const request = this.buildRequest(
      "GET",
      `/api/app/establishments/${establishmentId}/goals?month=${month}`,
    );
    return this.capture(await getGoalRoute(request, { params: Promise.resolve({ establishmentId }) }));
  }

  async postVariableCost(
    establishmentId: string,
    body: unknown,
  ): Promise<ApiResponse<{ variableCost?: Record<string, unknown>; error?: unknown }>> {
    const request = this.buildRequest("POST", `/api/app/establishments/${establishmentId}/variable-costs`, {
      body,
    });
    return this.capture(
      await postVariableCostRoute(request, { params: Promise.resolve({ establishmentId }) }),
    );
  }

  async listVariableCosts(
    establishmentId: string,
    range: { from: string; to: string },
  ): Promise<ApiResponse<{ variableCosts?: Record<string, unknown>[]; error?: unknown }>> {
    const request = this.buildRequest(
      "GET",
      `/api/app/establishments/${establishmentId}/variable-costs?from=${range.from}&to=${range.to}`,
    );
    return this.capture(
      await listVariableCostsRoute(request, { params: Promise.resolve({ establishmentId }) }),
    );
  }

  async deleteVariableCost(
    establishmentId: string,
    costId: string,
  ): Promise<ApiResponse<{ ok?: boolean; error?: unknown }>> {
    const request = this.buildRequest("DELETE", `/api/app/establishments/${establishmentId}/variable-costs/${costId}`);
    return this.capture(
      await deleteVariableCostRoute(request, { params: Promise.resolve({ establishmentId, costId }) }),
    );
  }

  async postEstablishment(
    body: unknown,
  ): Promise<ApiResponse<{ establishment?: Record<string, unknown>; error?: unknown }>> {
    const request = this.buildRequest("POST", "/api/app/establishments", { body });
    return this.capture(await postEstablishmentRoute(request));
  }

  async postCheckoutSession(
    establishmentId: string,
  ): Promise<ApiResponse<{ url?: string; error?: { code: string; message: string } }>> {
    const request = this.buildRequest("POST", `/api/app/establishments/${establishmentId}/billing/checkout`);
    return this.capture(await checkoutRoute(request, { params: Promise.resolve({ establishmentId }) }));
  }

  async postPortalSession(
    establishmentId: string,
  ): Promise<ApiResponse<{ url?: string; error?: { code: string; message: string } }>> {
    const request = this.buildRequest("POST", `/api/app/establishments/${establishmentId}/billing/portal`);
    return this.capture(await portalRoute(request, { params: Promise.resolve({ establishmentId }) }));
  }

  async getSubscriptionStatus(
    establishmentId: string,
  ): Promise<ApiResponse<{ subscription?: Record<string, unknown>; error?: unknown }>> {
    const request = this.buildRequest("GET", `/api/app/establishments/${establishmentId}/subscription`);
    return this.capture(await getSubscriptionRoute(request, { params: Promise.resolve({ establishmentId }) }));
  }
}

/**
 * Calls the Stripe webhook route directly with a raw (unparsed) body and a
 * `stripe-signature` header — no cookie jar, no `Origin` check, exactly as
 * Stripe itself would call it.
 */
export async function callWebhook(
  rawBody: string,
  signature: string | null,
): Promise<ApiResponse<{ received?: boolean; error?: { code: string; message: string } }>> {
  const headers = new Headers({ "content-type": "application/json" });
  if (signature !== null) headers.set("stripe-signature", signature);

  const request = new NextRequest(`${ORIGIN}/api/billing/webhook`, {
    method: "POST",
    headers,
    body: rawBody,
  });

  const response = await webhookRoute(request);
  const text = await response.text();
  return {
    status: response.status,
    body: (text ? JSON.parse(text) : null) as { received?: boolean; error?: { code: string; message: string } },
    headers: response.headers,
  };
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

/**
 * Walks a brand-new `TestClient` all the way to a logged-in app session
 * that owns one establishment — the setup every tracking-engine
 * integration test needs, built from the same real routes a browser would
 * hit (complete a diagnostic, activate an account, click the magic link).
 */
export async function createLoggedInEstablishment(
  client: TestClient,
  overrides: { email?: string; establishmentName?: string } = {},
): Promise<{ establishmentId: string }> {
  const diagnosticId = await (async () => {
    const { id, answersVersion } = await seedCompletedAnswers(client);
    const finalized = await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey(id),
      contact: VALID_CONTACT,
    });
    if (finalized.status !== 200) throw new Error("Falha ao concluir diagnóstico de teste");
    return id;
  })();

  const email = overrides.email ?? `dono-${diagnosticId}@example.com`;
  const activated = await client.activateAccount(diagnosticId, {
    email,
    establishmentName: overrides.establishmentName ?? "Estabelecimento de Teste",
  });
  if (activated.status !== 200 || !activated.body.devVerifyUrl) {
    throw new Error("Falha ao ativar conta de teste");
  }

  const token = new URL(activated.body.devVerifyUrl, "http://localhost").searchParams.get("token");
  if (!token) throw new Error("Link de verificação de teste sem token");

  const verified = await client.verifyMagicLink(token);
  if (verified.status !== 200) throw new Error("Falha ao verificar link mágico de teste");

  const [row] = await db.execute<{ establishment_id: string }>(
    sql`SELECT establishment_id FROM diagnostics WHERE id = ${diagnosticId}`,
  );
  if (!row?.establishment_id) throw new Error("Diagnóstico de teste sem estabelecimento vinculado");

  return { establishmentId: row.establishment_id };
}

/**
 * Logs a brand-new user in via magic link, with no establishment yet —
 * the direct-signup onboarding path, as opposed to
 * `createLoggedInEstablishment`'s diagnostic-conversion path.
 */
export async function loginNewUser(client: TestClient, email: string): Promise<void> {
  const requested = await client.requestMagicLink(email);
  if (requested.status !== 200 || !requested.body.devVerifyUrl) {
    throw new Error("Falha ao pedir link de login de teste");
  }
  const token = new URL(requested.body.devVerifyUrl, "http://localhost").searchParams.get("token");
  if (!token) throw new Error("Link de login de teste sem token");

  const verified = await client.verifyMagicLink(token);
  if (verified.status !== 200) throw new Error("Falha ao verificar link mágico de teste");
}
