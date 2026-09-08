import { describe, expect, it } from "vitest";
import { TestClient, createLoggedInEstablishment, loginNewUser } from "./client";

describe("variable costs", () => {
  it("creates a variable cost and it shows up in the list and the month summary", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    const created = await client.postVariableCost(establishmentId, {
      costDate: "2026-01-10",
      categoryName: "Ingredientes extras",
      amountCents: 250_00,
      note: "Compra extra de queijo",
    });
    expect(created.status).toBe(200);
    expect(created.body.variableCost?.categoryName).toBe("Ingredientes extras");

    const list = await client.listVariableCosts(establishmentId, { from: "2026-01-01", to: "2026-01-31" });
    expect(list.status).toBe(200);
    expect(list.body.variableCosts).toHaveLength(1);
    expect(list.body.variableCosts?.[0]?.amountCents).toBe(250_00);

    const summary = await client.getSummary(establishmentId, { from: "2026-01-01", to: "2026-01-31" });
    expect(summary.status).toBe(200);
    expect(summary.body.summary?.totalCostsCents).toBe(250_00);
  });

  it("deletes a variable cost", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    const created = await client.postVariableCost(establishmentId, {
      costDate: "2026-01-10",
      categoryName: "Outros",
      amountCents: 100_00,
    });
    const costId = created.body.variableCost?.id as string;

    const deleted = await client.deleteVariableCost(establishmentId, costId);
    expect(deleted.status).toBe(200);

    const list = await client.listVariableCosts(establishmentId, { from: "2026-01-01", to: "2026-01-31" });
    expect(list.body.variableCosts).toHaveLength(0);
  });

  it("never leaks one establishment's variable costs into another's list or summary", async () => {
    const clientA = new TestClient();
    const { establishmentId: establishmentA } = await createLoggedInEstablishment(clientA, {
      email: "dona-var-a@example.com",
    });
    await clientA.postVariableCost(establishmentA, {
      costDate: "2026-01-10",
      categoryName: "Outros",
      amountCents: 900_00,
    });

    const clientB = new TestClient();
    const { establishmentId: establishmentB } = await createLoggedInEstablishment(clientB, {
      email: "dono-var-b@example.com",
    });

    const listB = await clientB.listVariableCosts(establishmentB, { from: "2026-01-01", to: "2026-01-31" });
    expect(listB.status).toBe(200);
    expect(listB.body.variableCosts).toHaveLength(0);

    const summaryB = await clientB.getSummary(establishmentB, { from: "2026-01-01", to: "2026-01-31" });
    expect(summaryB.body.summary?.totalCostsCents).toBe(0);
  });

  it("404s for a non-member instead of leaking whether the establishment exists", async () => {
    const clientA = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(clientA, { email: "dona-var-c@example.com" });

    const clientB = new TestClient();
    await loginNewUser(clientB, "estranho-var@example.com");

    const list = await clientB.listVariableCosts(establishmentId, { from: "2026-01-01", to: "2026-01-31" });
    expect(list.status).toBe(404);
  });
});

describe("direct-signup onboarding", () => {
  it("creates an establishment for a logged-in user with none yet, as its owner", async () => {
    const client = new TestClient();
    await loginNewUser(client, "nova-dona@example.com");

    const created = await client.postEstablishment({ name: "Meu Novo Delivery" });
    expect(created.status).toBe(201);
    expect(created.body.establishment?.name).toBe("Meu Novo Delivery");

    const establishmentId = created.body.establishment?.id as string;
    const summary = await client.getSummary(establishmentId, { from: "2026-01-01", to: "2026-01-31" });
    expect(summary.status).toBe(200);
  });

  it("requires a logged-in session", async () => {
    const client = new TestClient();
    const created = await client.postEstablishment({ name: "Sem sessão" });
    expect(created.status).toBe(401);
  });
});
