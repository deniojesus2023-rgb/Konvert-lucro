import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./setup";
import { TestClient, VALID_CONTACT, idempotencyKey, seedCompletedAnswers } from "./client";

async function completeDiagnostic(client: TestClient): Promise<string> {
  const { id, answersVersion } = await seedCompletedAnswers(client);
  const finalized = await client.finalize(id, {
    expectedVersion: answersVersion,
    idempotencyKey: idempotencyKey(id),
    contact: VALID_CONTACT,
  });
  expect(finalized.status).toBe(200);
  return id;
}

describe("activating an account from a completed diagnostic", () => {
  it("creates a user, an establishment seeded from the diagnostic, and links them", async () => {
    const client = new TestClient();
    const id = await completeDiagnostic(client);

    const response = await client.activateAccount(id, {
      email: "dono@example.com",
      establishmentName: "Hamburgueria Teste",
    });

    expect(response.status).toBe(200);
    expect(response.body.devVerifyUrl).toMatch(/^\/entrar\/verificar\?token=/);

    const [diagnosticRow] = await db.execute<{ establishment_id: string }>(
      sql`SELECT establishment_id FROM diagnostics WHERE id = ${id}`,
    );
    expect(diagnosticRow.establishment_id).toBeTruthy();

    const [establishmentRow] = await db.execute<{ name: string; delivery_type: string; main_channel: string }>(
      sql`SELECT name, delivery_type, main_channel FROM establishments WHERE id = ${diagnosticRow.establishment_id}`,
    );
    expect(establishmentRow.name).toBe("Hamburgueria Teste");
    expect(establishmentRow.delivery_type).toBe("hamburgueria");
    expect(establishmentRow.main_channel).toBe("ifood");

    const [memberRow] = await db.execute<{ role: string }>(
      sql`SELECT em.role FROM establishment_members em
          JOIN users u ON u.id = em.user_id
          WHERE em.establishment_id = ${diagnosticRow.establishment_id} AND u.email = 'dono@example.com'`,
    );
    expect(memberRow.role).toBe("owner");
  });

  it("a double-click (retry) never creates a second establishment", async () => {
    const client = new TestClient();
    const id = await completeDiagnostic(client);

    await client.activateAccount(id, { email: "duploclique@example.com", establishmentName: "Açaí Teste" });
    const second = await client.activateAccount(id, { email: "duploclique@example.com", establishmentName: "Açaí Teste" });

    expect(second.status).toBe(200);
    const rows = await db.execute<{ count: string }>(sql`SELECT count(*)::text as count FROM establishments`);
    expect(rows[0].count).toBe("1");
  });

  it("leaves diagnostic_results completely untouched", async () => {
    const client = new TestClient();
    const id = await completeDiagnostic(client);

    const before = await db.execute<{ output_snapshot: unknown }>(
      sql`SELECT output_snapshot FROM diagnostic_results WHERE diagnostic_id = ${id}`,
    );

    await client.activateAccount(id, { email: "intocado@example.com", establishmentName: "Marmitaria Teste" });

    const after = await db.execute<{ output_snapshot: unknown }>(
      sql`SELECT output_snapshot FROM diagnostic_results WHERE diagnostic_id = ${id}`,
    );
    expect(after[0].output_snapshot).toEqual(before[0].output_snapshot);
  });

  it("refuses to activate an account for a diagnostic that isn't completed", async () => {
    const client = new TestClient();
    const { id } = await seedCompletedAnswers(client);

    const response = await client.activateAccount(id, { email: "aindarascunho@example.com", establishmentName: "X" });
    expect(response.status).toBe(409);
  });

  it("another session cannot activate an account for someone else's diagnostic", async () => {
    const owner = new TestClient();
    const id = await completeDiagnostic(owner);

    const intruder = new TestClient();
    const response = await intruder.activateAccount(id, { email: "intruso@example.com", establishmentName: "X" });
    expect(response.status).toBe(404);
  });
});
