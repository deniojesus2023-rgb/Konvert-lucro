import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./setup";
import { idempotencyKey, seedCompletedAnswers, TestClient, VALID_CONTACT } from "./client";

describe("GET /api/raio-x/[id] — completed diagnostic recovery (resultPath)", () => {
  it("returns resultPath pointing at the token once the diagnostic is completed", async () => {
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);

    const finalized = await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("recuperar"),
      contact: VALID_CONTACT,
    });
    const token = finalized.body.resultToken as string;

    const draft = await client.getDraft(id);

    expect(draft.status).toBe(200);
    expect(draft.body.resultPath).toBe(`/raio-x/resultado/${token}`);
  });

  it("resultPath is null while the diagnostic is still a draft", async () => {
    const client = new TestClient();
    const { id } = await seedCompletedAnswers(client);

    const draft = await client.getDraft(id);
    expect(draft.body.resultPath).toBeNull();
  });

  it("never returns draftSessionHash, leadId, name, WhatsApp or consent alongside resultPath", async () => {
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);
    await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("semdados"),
      contact: VALID_CONTACT,
    });

    const draft = await client.getDraft(id);
    const serialized = JSON.stringify(draft.body);

    expect(serialized).not.toMatch(/draftSessionHash|draft_session_hash/i);
    expect(serialized).not.toMatch(/leadId|lead_id/i);
    expect(serialized).not.toMatch(/consent/i);
    expect(serialized).not.toContain(VALID_CONTACT.name);
    expect(serialized).not.toContain("11988887777");
  });

  it("does not return resultPath for an invalid session, even for a completed diagnostic", async () => {
    const owner = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(owner);
    await owner.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("dono2"),
      contact: VALID_CONTACT,
    });

    const stranger = new TestClient();
    const response = await stranger.getDraft(id);

    expect(response.status).toBe(404);
    expect(JSON.stringify(response.body)).not.toMatch(/resultPath/);
  });
});

describe("POST /api/raio-x/events", () => {
  it("accepts an allowed event and records it under an anonymous funnel cookie", async () => {
    const client = new TestClient();
    const response = await client.sendEvent({ eventName: "landing_viewed" });

    expect(response.status).toBe(204);
    expect(client.getFunnelCookie()).toBeTruthy();

    const [row] = await db.execute<{ event_name: string; session_id: string }>(
      sql`SELECT event_name, session_id FROM funnel_events WHERE event_name = 'landing_viewed'`,
    );
    expect(row.event_name).toBe("landing_viewed");
    expect(row.session_id).toBe(client.getFunnelCookie());
  });

  it("accepts the documented metadata keys with a diagnosticId", async () => {
    const client = new TestClient();
    const { id } = await seedCompletedAnswers(client);

    const response = await client.sendEvent({
      eventName: "diagnostic_step_completed",
      diagnosticId: id,
      metadata: { step: 2, durationMs: 4500, source: "wizard" },
    });

    expect(response.status).toBe(204);

    const [row] = await db.execute<{ metadata: Record<string, unknown>; diagnostic_id: string }>(
      sql`SELECT metadata, diagnostic_id FROM funnel_events WHERE event_name = 'diagnostic_step_completed'`,
    );
    expect(row.diagnostic_id).toBe(id);
    expect(row.metadata).toEqual({ step: 2, durationMs: 4500, source: "wizard" });
  });

  it("rejects an event name outside the allowed list", async () => {
    const client = new TestClient();
    const response = await client.sendEvent({ eventName: "totally_made_up" });
    expect(response.status).toBe(422);
  });

  it("rejects metadata carrying a key outside the documented schema", async () => {
    const client = new TestClient();
    const response = await client.sendEvent({
      eventName: "landing_viewed",
      metadata: { resultToken: "z".repeat(43) },
    });
    expect(response.status).toBe(422);

    const [row] = await db.execute<{ count: string }>(
      sql`SELECT count(*)::text AS count FROM funnel_events`,
    );
    expect(row.count).toBe("0");
  });

  it("rejects metadata carrying a name or WhatsApp, even under an unexpected key", async () => {
    const client = new TestClient();
    const response = await client.sendEvent({
      eventName: "landing_viewed",
      metadata: { name: "Maria" },
    });
    expect(response.status).toBe(422);
  });

  it("reuses the same anonymous session id across multiple events", async () => {
    const client = new TestClient();
    await client.sendEvent({ eventName: "landing_viewed" });
    const firstSid = client.getFunnelCookie();

    await client.sendEvent({ eventName: "diagnostic_started" });
    expect(client.getFunnelCookie()).toBe(firstSid);

    const rows = await db.execute<{ session_id: string }>(
      sql`SELECT DISTINCT session_id FROM funnel_events`,
    );
    expect(rows).toHaveLength(1);
  });
});
