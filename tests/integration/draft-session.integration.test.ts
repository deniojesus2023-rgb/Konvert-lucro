import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./setup";
import { BASE_ANSWERS, TestClient } from "./client";

describe("migrations", () => {
  it("1. every table exists after the migrations run on an empty database", async () => {
    const rows = await db.execute<{ table_name: string }>(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
    );
    const names = rows.map((row) => row.table_name);

    expect(names).toEqual(
      expect.arrayContaining([
        "consents",
        "diagnostic_answers",
        "diagnostic_results",
        "diagnostics",
        "funnel_events",
        "leads",
      ]),
    );
  });
});

describe("creating a draft", () => {
  it("2. creates an anonymous draft and issues an httpOnly session cookie", async () => {
    const client = new TestClient();
    const response = await client.createDraft();

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("draft");
    expect(response.body.answersVersion).toBe(0);
    expect(response.body.id).toMatch(/^[0-9a-f-]{36}$/);

    const setCookie = response.headers.getSetCookie().join(";");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=lax");
    expect(setCookie).toContain("Path=/");

    // Never exposes the result token at creation time.
    expect(response.body).not.toHaveProperty("resultToken");
    expect(response.body).not.toHaveProperty("sessionSecret");
  });

  it("stores only the hash of the session secret, never the secret itself", async () => {
    const client = new TestClient();
    const created = await client.createDraft();
    const secret = client.getSessionCookie();

    const [row] = await db.execute<{ draft_session_hash: string }>(
      sql`SELECT draft_session_hash FROM diagnostics WHERE id = ${created.body.id}`,
    );

    expect(secret).toBeTruthy();
    expect(row.draft_session_hash).not.toBe(secret);
    expect(row.draft_session_hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("resuming a draft", () => {
  it("3. the same session reads its draft back with the saved answers", async () => {
    const client = new TestClient();
    const created = await client.createDraft();
    const id = created.body.id;

    await client.patchAnswers(id, {
      expectedVersion: 0,
      answers: { revenue: BASE_ANSWERS.revenue },
    });

    const resumed = await client.getDraft(id);

    expect(resumed.status).toBe(200);
    expect(resumed.body.answersVersion).toBe(1);
    expect(resumed.body.answers).toMatchObject({
      revenue: { kind: "informed", value: 5_000_000 },
    });
  });

  it("never returns the session hash or any secret material", async () => {
    const client = new TestClient();
    const created = await client.createDraft();

    const resumed = await client.getDraft(created.body.id);
    const serialized = JSON.stringify(resumed.body);

    expect(serialized).not.toContain("draftSessionHash");
    expect(serialized).not.toContain("draft_session_hash");
    expect(serialized).not.toContain(client.getSessionCookie());
  });
});

describe("session isolation", () => {
  it("4. session B can neither read nor modify session A's draft", async () => {
    const sessionA = new TestClient();
    const created = await sessionA.createDraft();
    const id = created.body.id;

    // B has a perfectly valid session of its own — just not for this draft.
    const sessionB = new TestClient();
    await sessionB.createDraft();

    const read = await sessionB.getDraft(id);
    expect(read.status).toBe(404);

    const write = await sessionB.patchAnswers(id, {
      expectedVersion: 0,
      answers: { revenue: BASE_ANSWERS.revenue },
    });
    expect(write.status).toBe(404);

    // A's draft is untouched.
    const stillA = await sessionA.getDraft(id);
    expect(stillA.status).toBe(200);
    expect(stillA.body.answersVersion).toBe(0);
  });

  it("5. knowing the UUID without a cookie authorizes nothing", async () => {
    const owner = new TestClient();
    const created = await owner.createDraft();
    const id = created.body.id;

    const anonymous = new TestClient();
    expect((await anonymous.getDraft(id)).status).toBe(404);
    expect(
      (
        await anonymous.patchAnswers(id, {
          expectedVersion: 0,
          answers: { revenue: BASE_ANSWERS.revenue },
        })
      ).status,
    ).toBe(404);
  });

  it("a forged cookie value is rejected like any other wrong secret", async () => {
    const owner = new TestClient();
    const created = await owner.createDraft();

    const attacker = new TestClient();
    attacker.setSessionCookie("x".repeat(43));

    expect((await attacker.getDraft(created.body.id)).status).toBe(404);
  });

  it("returns 404 (not 403) so diagnostics can't be enumerated", async () => {
    const client = new TestClient();
    await client.createDraft();

    const unknownId = "6f4d3a2e-1b0c-4a9d-8e7f-2c1b0a9d8e7f";
    const missing = await client.getDraft(unknownId);
    const someoneElses = await new TestClient().getDraft(unknownId);

    // "Exists but isn't yours" is indistinguishable from "doesn't exist".
    expect(missing.status).toBe(404);
    expect(someoneElses.status).toBe(404);
    expect(missing.body).toEqual(someoneElses.body);
  });
});
