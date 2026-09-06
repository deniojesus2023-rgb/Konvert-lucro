import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { diagnostics } from "@/server/db/schema";
import { db } from "./setup";
import {
  idempotencyKey,
  seedCompletedAnswers,
  TestClient,
  VALID_CONTACT,
} from "./client";

async function finalizeOne(): Promise<{ id: string; token: string }> {
  const client = new TestClient();
  const { id, answersVersion } = await seedCompletedAnswers(client);
  const response = await client.finalize(id, {
    expectedVersion: answersVersion,
    idempotencyKey: idempotencyKey("publico"),
    contact: VALID_CONTACT,
  });
  return { id, token: response.body.resultToken as string };
}

describe("GET /api/raio-x/resultado/[token]", () => {
  it("14. returns the result without a single piece of personal data", async () => {
    const { token } = await finalizeOne();

    const anonymous = new TestClient(); // no cookie at all
    const response = await anonymous.publicResult(token);

    expect(response.status).toBe(200);

    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain(VALID_CONTACT.name);
    expect(serialized).not.toContain("11988887777");
    expect(serialized).not.toContain("98888");
    expect(serialized).not.toMatch(/leadId|lead_id/);
    expect(serialized).not.toMatch(/consent/i);
    expect(serialized).not.toMatch(/whatsapp/i);
    // Not even the diagnostic's own UUID, which would tie the public link
    // back to the private edit endpoints.
    expect(serialized).not.toMatch(/diagnosticId|draftSessionHash/);
  });

  it("carries the full ProfitResult and the self-reported disclaimer", async () => {
    const { token } = await finalizeOne();
    const response = await new TestClient().publicResult(token);

    expect(response.body).toMatchObject({
      formulaVersion: "1.1.0",
      result: {
        selfReportedDisclaimer: true,
        profit: { status: "available", value: 1_000_000 },
        marginBps: { status: "available", value: 2000 },
        takeHomePer100Cents: { status: "available", value: 2000 },
        breakEvenRevenue: { status: "available", value: 2_500_000 },
        breakEvenOrders: { status: "available", value: 500 },
      },
    });
  });

  it("is never cached by a shared cache", async () => {
    const { token } = await finalizeOne();
    const response = await new TestClient().publicResult(token);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("15. returns 404 for a nonexistent token", async () => {
    const response = await new TestClient().publicResult("z".repeat(43));
    expect(response.status).toBe(404);
  });

  it("15. returns 404 for a malformed token, exactly like an unknown one", async () => {
    const malformed = await new TestClient().publicResult("curto-demais");
    const unknown = await new TestClient().publicResult("z".repeat(43));

    expect(malformed.status).toBe(404);
    expect(malformed.body).toEqual(unknown.body);
  });

  it("15. returns 404 for a revoked token", async () => {
    const { id, token } = await finalizeOne();

    await db
      .update(diagnostics)
      .set({ resultTokenRevokedAt: new Date() })
      .where(eq(diagnostics.id, id));

    expect((await new TestClient().publicResult(token)).status).toBe(404);
  });

  it("15. returns 404 for an expired token", async () => {
    const { id, token } = await finalizeOne();

    await db
      .update(diagnostics)
      .set({ resultTokenExpiresAt: new Date(Date.now() - 1000) })
      .where(eq(diagnostics.id, id));

    expect((await new TestClient().publicResult(token)).status).toBe(404);
  });

  it("still serves a token whose expiry is in the future", async () => {
    const { id, token } = await finalizeOne();

    await db
      .update(diagnostics)
      .set({ resultTokenExpiresAt: new Date(Date.now() + 60_000) })
      .where(eq(diagnostics.id, id));

    expect((await new TestClient().publicResult(token)).status).toBe(200);
  });

  it("grants no write access — the public token is read-only", async () => {
    const { id, token } = await finalizeOne();

    const holder = new TestClient();
    holder.setSessionCookie(token); // token used where a secret is expected

    // The token hashes to nothing the diagnostic recognizes, so both the
    // private read and the write are refused exactly like an unknown id.
    expect((await holder.getDraft(id)).status).toBe(404);
    expect(
      (
        await holder.patchAnswers(id, {
          expectedVersion: 1,
          answers: { revenue: { kind: "informed", value: 1 } },
        })
      ).status,
    ).toBe(404);
  });
});
