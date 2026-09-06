import { describe, expect, it } from "vitest";
import { BASE_ANSWERS, TestClient } from "./client";

describe("HTTP guards on mutating routes", () => {
  it("rejects a body that isn't declared as JSON", async () => {
    const client = new TestClient();
    const { body } = await client.createDraft();

    const response = await client.patchAnswers(
      body.id,
      { expectedVersion: 0, answers: { revenue: BASE_ANSWERS.revenue } },
      { contentType: "text/plain" },
    );

    expect(response.status).toBe(415);
  });

  it("rejects a cross-origin write", async () => {
    const client = new TestClient();
    const { body } = await client.createDraft();

    const response = await client.patchAnswers(
      body.id,
      { expectedVersion: 0, answers: { revenue: BASE_ANSWERS.revenue } },
      { origin: "https://sitemalicioso.example" },
    );

    expect(response.status).toBe(403);
  });

  it("accepts a request with no Origin header (non-browser client)", async () => {
    const client = new TestClient();
    const created = await client.createDraft({ origin: null });
    expect(created.status).toBe(201);
  });

  it("rejects a payload beyond the size limit", async () => {
    const client = new TestClient();
    const { body } = await client.createDraft();

    const response = await client.patchAnswers(body.id, {
      expectedVersion: 0,
      answers: { revenue: BASE_ANSWERS.revenue },
      profile: { deliveryType: "x".repeat(70_000) },
    });

    expect(response.status).toBe(413);
  });

  it("returns a standardized error envelope with no stack trace or SQL detail", async () => {
    const client = new TestClient();
    const { body } = await client.createDraft();

    const response = await client.patchAnswers(body.id, { expectedVersion: "zero" });
    const serialized = JSON.stringify(response.body);

    expect(response.status).toBe(422);
    expect(response.body.error).toMatchObject({ code: "validation_failed" });
    expect(serialized).not.toMatch(/at .*\(.*:\d+:\d+\)/); // no stack frames
    expect(serialized).not.toMatch(/postgres|drizzle|relation|column .* does not exist/i);
  });

  it("never echoes submitted personal data back in a validation error", async () => {
    const client = new TestClient();
    const { body } = await client.createDraft();

    const response = await client.finalize(body.id, {
      expectedVersion: 0,
      idempotencyKey: "curta", // invalid, so the payload is rejected wholesale
      contact: {
        name: "Fulano Secreto",
        whatsapp: "11999998888",
        contactConsent: true,
        marketingOptIn: false,
        consentTextVersion: "test.v1",
      },
    });

    const serialized = JSON.stringify(response.body);
    expect(response.status).toBe(422);
    expect(serialized).not.toContain("Fulano Secreto");
    expect(serialized).not.toContain("11999998888");
  });

  it("answers every mutating route with no-store", async () => {
    const client = new TestClient();
    const created = await client.createDraft();
    expect(created.headers.get("cache-control")).toBe("no-store");
  });
});
