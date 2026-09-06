import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./setup";
import { BASE_ANSWERS, TestClient } from "./client";

describe("optimistic versioning on PATCH /answers", () => {
  it("6. a valid PATCH increments answersVersion exactly once", async () => {
    const client = new TestClient();
    const { body } = await client.createDraft();
    const id = body.id;

    const first = await client.patchAnswers(id, {
      expectedVersion: 0,
      // Several fields in one request must still bump the version once.
      answers: {
        revenue: BASE_ANSWERS.revenue,
        cost_production: BASE_ANSWERS.cost_production,
        cost_fees: BASE_ANSWERS.cost_fees,
      },
    });

    expect(first.status).toBe(200);
    expect(first.body.answersVersion).toBe(1);

    const second = await client.patchAnswers(id, {
      expectedVersion: 1,
      answers: { cost_delivery: BASE_ANSWERS.cost_delivery },
    });

    expect(second.body.answersVersion).toBe(2);
  });

  it("7. a stale expectedVersion is rejected with 409 and the current version", async () => {
    const client = new TestClient();
    const { body } = await client.createDraft();
    const id = body.id;

    await client.patchAnswers(id, { expectedVersion: 0, answers: { revenue: BASE_ANSWERS.revenue } });

    const stale = await client.patchAnswers(id, {
      expectedVersion: 0, // the version the client *thought* was current
      answers: { revenue: { kind: "informed", value: 999 } },
    });

    expect(stale.status).toBe(409);
    expect(stale.body.error).toMatchObject({
      code: "version_conflict",
      details: { currentVersion: 1 },
    });

    // The stale write did not land.
    const draft = await client.getDraft(id);
    expect(draft.body.answers).toMatchObject({
      revenue: { kind: "informed", value: 5_000_000 },
    });
  });

  it("8. concurrent PATCHes from the same version: exactly one wins, no lost update", async () => {
    const client = new TestClient();
    const { body } = await client.createDraft();
    const id = body.id;

    // Both requests believe the current version is 0 and race.
    const [a, b] = await Promise.all([
      client.patchAnswers(id, {
        expectedVersion: 0,
        answers: { revenue: { kind: "informed", value: 1_111_111 } },
      }),
      client.patchAnswers(id, {
        expectedVersion: 0,
        answers: { revenue: { kind: "informed", value: 2_222_222 } },
      }),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);

    const [row] = await db.execute<{ answers_version: number }>(
      sql`SELECT answers_version FROM diagnostics WHERE id = ${id}`,
    );
    // One increment, not two — the loser never applied its write.
    expect(Number(row.answers_version)).toBe(1);

    const winner = a.status === 200 ? 1_111_111 : 2_222_222;
    const draft = await client.getDraft(id);
    expect(draft.body.answers).toMatchObject({
      revenue: { kind: "informed", value: winner },
    });
  });

  it("preserves the tax classification when a later PATCH doesn't mention it", async () => {
    const client = new TestClient();
    const { body } = await client.createDraft();
    const id = body.id;

    await client.patchAnswers(id, {
      expectedVersion: 0,
      answers: { taxes: { kind: "informed", value: 400_000 } },
      taxClassification: "fixed",
    });

    await client.patchAnswers(id, {
      expectedVersion: 1,
      answers: { taxes: { kind: "informed", value: 500_000 } },
    });

    const draft = await client.getDraft(id);
    expect(draft.body.taxClassification).toBe("fixed");
  });

  it("round-trips all six answer states through PostgreSQL without distortion", async () => {
    const client = new TestClient();
    const { body } = await client.createDraft();
    const id = body.id;

    await client.patchAnswers(id, {
      expectedVersion: 0,
      answers: {
        revenue: { kind: "estimated", origin: "typed", value: 1500 },
        cost_production: {
          kind: "estimated",
          origin: "range",
          value: 1500,
          range: { min: 1000, max: 2000 },
        },
        cost_fees: { kind: "range", min: 500_000, max: null },
        cost_delivery: { kind: "unknown" },
        cost_fixed_structure: { kind: "zero_confirmed" },
        taxes: { kind: "unanswered" },
      },
    });

    const draft = await client.getDraft(id);

    expect(draft.body.answers).toMatchObject({
      revenue: { kind: "estimated", origin: "typed", value: 1500 },
      cost_production: {
        kind: "estimated",
        origin: "range",
        value: 1500,
        range: { min: 1000, max: 2000 },
      },
      // The open range comes back open — no midpoint was invented for it.
      cost_fees: { kind: "range", min: 500_000, max: null },
      cost_delivery: { kind: "unknown" },
      cost_fixed_structure: { kind: "zero_confirmed" },
      taxes: { kind: "unanswered" },
    });
  });

  it("rejects an invalid payload before touching the database", async () => {
    const client = new TestClient();
    const { body } = await client.createDraft();
    const id = body.id;

    const invalid = await client.patchAnswers(id, {
      expectedVersion: 0,
      answers: { revenue: { kind: "informed", value: -5 } },
    });

    expect(invalid.status).toBe(422);

    const [row] = await db.execute<{ count: string }>(
      sql`SELECT count(*)::text AS count FROM diagnostic_answers WHERE diagnostic_id = ${id}`,
    );
    expect(row.count).toBe("0");

    // A rejected request must not consume a version either.
    const draft = await client.getDraft(id);
    expect(draft.body.answersVersion).toBe(0);
  });
});
