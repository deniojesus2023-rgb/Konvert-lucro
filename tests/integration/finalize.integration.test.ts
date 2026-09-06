import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { FORMULA_VERSION } from "@/domain/diagnostic/constants";
import { db } from "./setup";
import {
  BASE_ANSWERS,
  idempotencyKey,
  seedCompletedAnswers,
  TestClient,
  VALID_CONTACT,
} from "./client";

async function countRows(table: string): Promise<number> {
  const [row] = await db.execute<{ count: string }>(
    sql`SELECT count(*)::text AS count FROM ${sql.identifier(table)}`,
  );
  return Number(row.count);
}

describe("finalizing a diagnostic", () => {
  it("9. creates exactly one lead, one consent and one result", async () => {
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);

    const response = await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("unico"),
      contact: VALID_CONTACT,
    });

    expect(response.status).toBe(200);
    expect(response.body.resultToken).toHaveLength(43);
    expect(response.body.alreadyFinalized).toBe(false);

    expect(await countRows("leads")).toBe(1);
    expect(await countRows("consents")).toBe(1);
    expect(await countRows("diagnostic_results")).toBe(1);

    const [diagnostic] = await db.execute<{ status: string; completed_at: string | null }>(
      sql`SELECT status, completed_at FROM diagnostics WHERE id = ${id}`,
    );
    expect(diagnostic.status).toBe("completed");
    expect(diagnostic.completed_at).not.toBeNull();
  });

  it("10. marketingOptIn=false still finalizes — refusing marketing blocks nothing", async () => {
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);

    const response = await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("semmkt"),
      contact: { ...VALID_CONTACT, marketingOptIn: false },
    });

    expect(response.status).toBe(200);
    expect(response.body.resultToken).toBeTruthy();

    const [consent] = await db.execute<{
      marketing_opt_in: boolean;
      marketing_opt_in_at: string | null;
      contact_consent_accepted_at: string | null;
    }>(sql`SELECT marketing_opt_in, marketing_opt_in_at, contact_consent_accepted_at FROM consents`);

    expect(consent.marketing_opt_in).toBe(false);
    expect(consent.marketing_opt_in_at).toBeNull();
    // The mandatory contact consent is always stamped.
    expect(consent.contact_consent_accepted_at).not.toBeNull();
  });

  it("stamps marketing_opt_in_at only when marketing is accepted", async () => {
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);

    await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("commkt"),
      contact: { ...VALID_CONTACT, marketingOptIn: true },
    });

    const [consent] = await db.execute<{
      marketing_opt_in: boolean;
      marketing_opt_in_at: string | null;
    }>(sql`SELECT marketing_opt_in, marketing_opt_in_at FROM consents`);

    expect(consent.marketing_opt_in).toBe(true);
    expect(consent.marketing_opt_in_at).not.toBeNull();
  });

  it("11. rejects finalizing without the mandatory contact consent", async () => {
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);

    const response = await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("semconsent"),
      contact: { ...VALID_CONTACT, contactConsent: false },
    });

    expect(response.status).toBe(422);
    expect(await countRows("leads")).toBe(0);
    expect(await countRows("consents")).toBe(0);
    expect(await countRows("diagnostic_results")).toBe(0);
  });

  it("12. two simultaneous finalizations don't duplicate anything", async () => {
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);
    const key = idempotencyKey("duplo");

    const payload = {
      expectedVersion: answersVersion,
      idempotencyKey: key,
      contact: VALID_CONTACT,
    };

    const [first, second] = await Promise.all([
      client.finalize(id, payload),
      client.finalize(id, payload),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.resultToken).toBe(second.body.resultToken);

    expect(await countRows("leads")).toBe(1);
    expect(await countRows("consents")).toBe(1);
    expect(await countRows("diagnostic_results")).toBe(1);
  });

  it("13. an idempotent retry returns the very same token without new records", async () => {
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);
    const key = idempotencyKey("retry");

    const first = await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: key,
      contact: VALID_CONTACT,
    });

    // The client never saw the response (network hiccup) and retries.
    const retry = await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: key,
      contact: VALID_CONTACT,
    });

    expect(retry.status).toBe(200);
    expect(retry.body.resultToken).toBe(first.body.resultToken);
    expect(retry.body.alreadyFinalized).toBe(true);

    expect(await countRows("leads")).toBe(1);
    expect(await countRows("diagnostic_results")).toBe(1);
  });

  it("recovers the same result for the owner even with a different idempotency key", async () => {
    // Simulates the response never reaching the browser: it reloads and
    // generates a brand-new idempotencyKey before retrying. The session
    // cookie alone proves ownership, so the owner must get their result
    // back rather than being locked out by "already_completed".
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);

    const first = await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("primeira"),
      contact: VALID_CONTACT,
    });

    const second = await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("outra"),
      contact: VALID_CONTACT,
    });

    expect(second.status).toBe(200);
    expect(second.body.resultToken).toBe(first.body.resultToken);
    expect(second.body.alreadyFinalized).toBe(true);

    expect(await countRows("leads")).toBe(1);
    expect(await countRows("consents")).toBe(1);
    expect(await countRows("diagnostic_results")).toBe(1);
  });

  it("recovers the result after a lost response, even with a stale expectedVersion and a new key", async () => {
    // The server committed the transaction but the client never saw the
    // response. On reload the client only has what it knew *before*
    // finalizing: the old expectedVersion, plus a freshly generated
    // idempotencyKey. Because the diagnostic is already completed, the
    // version check must not even be reached — the owner still gets their
    // token back.
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);

    await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("original"),
      contact: VALID_CONTACT,
    });
    const originalToken = (
      await client.finalize(id, {
        expectedVersion: answersVersion,
        idempotencyKey: idempotencyKey("original"),
        contact: VALID_CONTACT,
      })
    ).body.resultToken;

    const recovered = await client.finalize(id, {
      expectedVersion: answersVersion, // stale: the diagnostic is already completed
      idempotencyKey: idempotencyKey("apos-reload"),
      contact: VALID_CONTACT,
    });

    expect(recovered.status).toBe(200);
    expect(recovered.body.resultToken).toBe(originalToken);
    expect(recovered.body.alreadyFinalized).toBe(true);

    expect(await countRows("leads")).toBe(1);
    expect(await countRows("consents")).toBe(1);
    expect(await countRows("diagnostic_results")).toBe(1);
  });

  it("still refuses a different session entirely, even for a completed diagnostic", async () => {
    const owner = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(owner);

    await owner.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("dono"),
      contact: VALID_CONTACT,
    });

    const attacker = new TestClient();
    await attacker.createDraft();

    const response = await attacker.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("invasor2"),
      contact: VALID_CONTACT,
    });

    expect(response.status).toBe(404);
    expect(await countRows("leads")).toBe(1);
  });

  it("18. persists formulaVersion 1.1.0 plus both snapshots", async () => {
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);

    await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("snapshot"),
      contact: VALID_CONTACT,
    });

    const [row] = await db.execute<{
      formula_version: string;
      input_snapshot: Record<string, unknown>;
      output_snapshot: Record<string, unknown>;
      profit_status: string;
      profit_cents: string;
      margin_bps: number;
      take_home_per_100_cents: number;
      break_even_revenue_cents: string;
      break_even_orders: string;
      has_estimated_inputs: boolean;
    }>(sql`SELECT * FROM diagnostic_results WHERE diagnostic_id = ${id}`);

    expect(row.formula_version).toBe("1.1.0");
    expect(row.formula_version).toBe(FORMULA_VERSION);

    // The base scenario from Fase 1A, now computed through the full stack.
    expect(row.profit_status).toBe("available");
    expect(Number(row.profit_cents)).toBe(1_000_000);
    expect(row.margin_bps).toBe(2000);
    expect(row.take_home_per_100_cents).toBe(2000);
    expect(Number(row.break_even_revenue_cents)).toBe(2_500_000);
    expect(Number(row.break_even_orders)).toBe(500);
    expect(row.has_estimated_inputs).toBe(false);

    // input_snapshot holds exactly the normalized input handed to the domain.
    expect(row.input_snapshot).toMatchObject({
      revenue: { kind: "informed", value: 5_000_000 },
      taxes: { classification: "variable", state: { kind: "zero_confirmed" } },
      orders: { kind: "informed", value: 1000 },
    });

    // output_snapshot holds the complete ProfitResult, including the
    // disclaimer and the reason machinery.
    expect(row.output_snapshot).toMatchObject({
      selfReportedDisclaimer: true,
      formulaVersion: "1.1.0",
      profit: { status: "available", value: 1_000_000 },
      blindSpots: [],
    });
  });

  it("stores unavailable metrics as NULL, never as a misleading zero", async () => {
    const client = new TestClient();
    const created = await client.createDraft();
    const id = created.body.id;

    // Every field answered, but a required cost group is "não sei".
    await client.patchAnswers(id, {
      expectedVersion: 0,
      answers: { ...BASE_ANSWERS, cost_fixed_structure: { kind: "unknown" } },
      taxClassification: "variable",
    });

    await client.finalize(id, {
      expectedVersion: 1,
      idempotencyKey: idempotencyKey("semcusto"),
      contact: VALID_CONTACT,
    });

    const [row] = await db.execute<{
      profit_status: string;
      profit_cents: string | null;
      margin_bps: number | null;
      output_snapshot: { blindSpots: unknown[]; profit: { reason?: string } };
    }>(sql`SELECT profit_status, profit_cents, margin_bps, output_snapshot FROM diagnostic_results WHERE diagnostic_id = ${id}`);

    expect(row.profit_status).toBe("unavailable");
    expect(row.profit_cents).toBeNull();
    expect(row.margin_bps).toBeNull();
    expect(row.output_snapshot.profit.reason).toBe("missing_required_costs");
    expect(row.output_snapshot.blindSpots).toContainEqual({
      field: "fixedStructure",
      kind: "unknown",
    });
  });

  it("19. rolls everything back when the finalize transaction fails midway", async () => {
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);

    // A unique index on leads.whatsapp doesn't exist, so to force a genuine
    // mid-transaction failure we make the results insert impossible: a row
    // already occupies this diagnostic's unique diagnostic_id slot.
    await db.execute(sql`
      INSERT INTO diagnostic_results
        (diagnostic_id, formula_version, input_snapshot, output_snapshot, profit_status, has_estimated_inputs)
      VALUES
        (${id}, 'sabotagem', '{}'::jsonb, '{}'::jsonb, 'unavailable', false)
    `);

    const leadsBefore = await countRows("leads");
    const consentsBefore = await countRows("consents");

    const response = await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("rollback"),
      contact: VALID_CONTACT,
    });

    expect(response.status).toBe(500);
    // The lead and consent inserted earlier in the same transaction are gone.
    expect(await countRows("leads")).toBe(leadsBefore);
    expect(await countRows("consents")).toBe(consentsBefore);

    // And the diagnostic was never flipped to completed.
    const [diagnostic] = await db.execute<{
      status: string;
      result_token: string | null;
      lead_id: string | null;
    }>(sql`SELECT status, result_token, lead_id FROM diagnostics WHERE id = ${id}`);

    expect(diagnostic.status).toBe("draft");
    expect(diagnostic.result_token).toBeNull();
    expect(diagnostic.lead_id).toBeNull();
  });

  it("refuses to finalize a diagnostic that still has unanswered steps", async () => {
    const client = new TestClient();
    const created = await client.createDraft();
    const id = created.body.id;

    await client.patchAnswers(id, {
      expectedVersion: 0,
      answers: { revenue: BASE_ANSWERS.revenue },
    });

    const response = await client.finalize(id, {
      expectedVersion: 1,
      idempotencyKey: idempotencyKey("incompleto"),
      contact: VALID_CONTACT,
    });

    expect(response.status).toBe(422);
    expect(response.body.error).toMatchObject({ code: "incomplete_diagnostic" });
    expect(await countRows("leads")).toBe(0);
  });

  it("rejects finalizing with a stale expectedVersion", async () => {
    const client = new TestClient();
    const { id } = await seedCompletedAnswers(client);

    const response = await client.finalize(id, {
      expectedVersion: 0, // the seed already advanced it to 1
      idempotencyKey: idempotencyKey("versaovelha"),
      contact: VALID_CONTACT,
    });

    expect(response.status).toBe(409);
    expect(await countRows("leads")).toBe(0);
  });

  it("another session cannot finalize someone else's draft", async () => {
    const owner = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(owner);

    const attacker = new TestClient();
    await attacker.createDraft();

    const response = await attacker.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("invasor"),
      contact: VALID_CONTACT,
    });

    expect(response.status).toBe(404);
    expect(await countRows("leads")).toBe(0);
  });

  it("refuses to change the answers of a completed diagnostic", async () => {
    const client = new TestClient();
    const { id, answersVersion } = await seedCompletedAnswers(client);

    await client.finalize(id, {
      expectedVersion: answersVersion,
      idempotencyKey: idempotencyKey("fechado"),
      contact: VALID_CONTACT,
    });

    const patch = await client.patchAnswers(id, {
      expectedVersion: answersVersion,
      answers: { revenue: { kind: "informed", value: 1 } },
    });

    expect(patch.status).toBe(409);
    expect(patch.body.error).toMatchObject({ code: "already_completed" });
  });
});
