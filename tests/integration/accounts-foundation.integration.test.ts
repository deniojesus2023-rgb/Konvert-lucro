import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./setup";
import { TestClient } from "./client";
import {
  findEstablishmentById,
  findEstablishmentsForUser,
  insertEstablishment,
  insertEstablishmentMember,
} from "@/server/repositories/establishment-repository";
import { findUserByEmail, findUserById, insertUser, markEmailVerified } from "@/server/repositories/user-repository";
import { insertLead } from "@/server/repositories/lead-repository";

describe("migrations", () => {
  it("every new account table exists after migrations run", async () => {
    const rows = await db.execute<{ table_name: string }>(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
    );
    const names = rows.map((row) => row.table_name);

    expect(names).toEqual(expect.arrayContaining(["users", "establishments", "establishment_members"]));
  });

  it("diagnostics gained an additive, nullable establishment_id column", async () => {
    const rows = await db.execute<{ column_name: string; is_nullable: string }>(
      sql`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'diagnostics' AND column_name = 'establishment_id'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].is_nullable).toBe("YES");
  });
});

describe("users", () => {
  it("creates a user optionally bridged to a diagnostic lead", async () => {
    const lead = await insertLead(db, { name: "Maria", whatsapp: "11988887777" });
    const user = await insertUser(db, { email: "maria@example.com", leadId: lead.id });

    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.leadId).toBe(lead.id);
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.passwordHash).toBeNull();
  });

  it("finds a user by email and by id", async () => {
    const created = await insertUser(db, { email: "joao@example.com" });

    expect(await findUserByEmail(db, "joao@example.com")).toMatchObject({ id: created.id });
    expect(await findUserById(db, created.id)).toMatchObject({ email: "joao@example.com" });
    expect(await findUserByEmail(db, "nao-existe@example.com")).toBeNull();
  });

  it("rejects a duplicate email", async () => {
    await insertUser(db, { email: "duplicado@example.com" });
    await expect(insertUser(db, { email: "duplicado@example.com" })).rejects.toThrow();
  });

  it("marks a user's email as verified", async () => {
    const created = await insertUser(db, { email: "verificar@example.com" });
    await markEmailVerified(db, created.id);

    const reloaded = await findUserById(db, created.id);
    expect(reloaded?.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it("a nonexistent lead_id is rejected by the real foreign key", async () => {
    await expect(
      insertUser(db, { email: "orfao@example.com", leadId: "00000000-0000-0000-0000-000000000000" }),
    ).rejects.toThrow();
  });
});

describe("establishments and membership", () => {
  it("creates an establishment seeded from diagnostic answers", async () => {
    const establishment = await insertEstablishment(db, {
      name: "Pizzaria da Maria",
      deliveryType: "Pizzaria",
      mainChannel: "iFood",
    });

    expect(establishment.timezone).toBe("America/Sao_Paulo");
    expect(await findEstablishmentById(db, establishment.id)).toMatchObject({ name: "Pizzaria da Maria" });
  });

  it("links a user to an establishment as owner, and lists it back", async () => {
    const user = await insertUser(db, { email: "dono@example.com" });
    const establishment = await insertEstablishment(db, { name: "Açaí do João" });

    await insertEstablishmentMember(db, { establishmentId: establishment.id, userId: user.id });

    const owned = await findEstablishmentsForUser(db, user.id);
    expect(owned).toHaveLength(1);
    expect(owned[0].id).toBe(establishment.id);
  });

  it("rejects a second membership row for the same user+establishment", async () => {
    const user = await insertUser(db, { email: "duplo@example.com" });
    const establishment = await insertEstablishment(db, { name: "Marmitaria Central" });
    await insertEstablishmentMember(db, { establishmentId: establishment.id, userId: user.id });

    await expect(
      insertEstablishmentMember(db, { establishmentId: establishment.id, userId: user.id }),
    ).rejects.toThrow();
  });
});

describe("existing diagnostic funnel is unaffected", () => {
  it("a diagnostic's establishment_id stays null until explicitly linked", async () => {
    const testClient = new TestClient();
    const created = await testClient.createDraft();

    const rows = await db.execute<{ establishment_id: string | null }>(
      sql`SELECT establishment_id FROM diagnostics WHERE id = ${created.body.id}`,
    );
    expect(rows[0].establishment_id).toBeNull();
  });
});
