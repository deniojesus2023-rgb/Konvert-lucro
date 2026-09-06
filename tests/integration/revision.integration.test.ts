import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./setup";
import {
  idempotencyKey,
  seedCompletedAnswers,
  TestClient,
  VALID_CONTACT,
} from "./client";

async function completeOne(client: TestClient, seed = "revisao") {
  const { id, answersVersion } = await seedCompletedAnswers(client);
  const response = await client.finalize(id, {
    expectedVersion: answersVersion,
    idempotencyKey: idempotencyKey(seed),
    contact: VALID_CONTACT,
  });
  return { id, token: response.body.resultToken as string };
}

describe("revising a completed diagnostic", () => {
  it("16. creates a new draft that points back at its source and carries the answers over", async () => {
    const client = new TestClient();
    const { id: sourceId } = await completeOne(client);
    const secretBefore = client.getSessionCookie();

    const revision = await client.revise(sourceId);

    expect(revision.status).toBe(201);
    expect(revision.body.id).not.toBe(sourceId);
    expect(revision.body.sourceDiagnosticId).toBe(sourceId);
    expect(revision.body.answersVersion).toBe(0);

    // A fresh edit secret is issued and the cookie now points at the revision.
    expect(client.getSessionCookie()).not.toBe(secretBefore);

    // The answers were copied, so the user revises instead of retyping.
    const draft = await client.getDraft(revision.body.id as string);
    expect(draft.status).toBe(200);
    expect(draft.body.answers).toMatchObject({
      revenue: { kind: "informed", value: 5_000_000 },
      orders: { kind: "informed", value: 1000 },
    });
    expect(draft.body.taxClassification).toBe("variable");
  });

  it("16. the revision finalizes into a second result with its own token", async () => {
    const client = new TestClient();
    const { id: sourceId, token: firstToken } = await completeOne(client);

    const revision = await client.revise(sourceId);
    const revisionId = revision.body.id as string;

    // Change one answer, then finalize the revision.
    const patched = await client.patchAnswers(revisionId, {
      expectedVersion: 0,
      answers: { revenue: { kind: "informed", value: 6_000_000 } },
    });

    const finalized = await client.finalize(revisionId, {
      expectedVersion: patched.body.answersVersion as number,
      idempotencyKey: idempotencyKey("revfinal"),
      contact: VALID_CONTACT,
    });

    expect(finalized.status).toBe(200);
    const secondToken = finalized.body.resultToken as string;
    expect(secondToken).not.toBe(firstToken);

    const [{ count }] = await db.execute<{ count: string }>(
      sql`SELECT count(*)::text AS count FROM diagnostic_results`,
    );
    expect(count).toBe("2");

    const second = await new TestClient().publicResult(secondToken);
    expect(second.status).toBe(200);
    expect(second.body.result).toMatchObject({
      // revenue 6.000.000 - costs 4.000.000 = 2.000.000
      profit: { status: "available", value: 2_000_000 },
    });
  });

  it("17. the previous result stays byte-for-byte identical after a revision", async () => {
    const client = new TestClient();
    const { id: sourceId, token: firstToken } = await completeOne(client);

    const before = await new TestClient().publicResult(firstToken);

    const revision = await client.revise(sourceId);
    const revisionId = revision.body.id as string;
    const patched = await client.patchAnswers(revisionId, {
      expectedVersion: 0,
      answers: { revenue: { kind: "informed", value: 9_000_000 } },
    });
    await client.finalize(revisionId, {
      expectedVersion: patched.body.answersVersion as number,
      idempotencyKey: idempotencyKey("revimut"),
      contact: VALID_CONTACT,
    });

    const after = await new TestClient().publicResult(firstToken);

    // The old link keeps resolving, to exactly the old numbers.
    expect(after.status).toBe(200);
    expect(after.body).toEqual(before.body);

    // And the source row itself was never rewritten.
    const [source] = await db.execute<{ status: string; result_token: string }>(
      sql`SELECT status, result_token FROM diagnostics WHERE id = ${sourceId}`,
    );
    expect(source.status).toBe("completed");
    expect(source.result_token).toBe(firstToken);
  });

  it("refuses to revise a diagnostic that isn't completed yet", async () => {
    const client = new TestClient();
    const { id } = await seedCompletedAnswers(client);

    const response = await client.revise(id);

    expect(response.status).toBe(409);
    expect((response.body as { error?: { code?: string } }).error?.code).toBe("not_completed");
  });

  it("another session cannot revise someone else's completed diagnostic", async () => {
    const owner = new TestClient();
    const { id } = await completeOne(owner);

    const attacker = new TestClient();
    await attacker.createDraft();

    expect((await attacker.revise(id)).status).toBe(404);
  });
});
