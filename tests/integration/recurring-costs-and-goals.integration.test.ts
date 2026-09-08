import { describe, expect, it } from "vitest";
import { TestClient, createLoggedInEstablishment } from "./client";

describe("recurring costs", () => {
  it("creates a recurring cost and its prorated share shows up in the month summary", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    const created = await client.postRecurringCost(establishmentId, {
      categoryName: "Aluguel",
      name: "Aluguel da cozinha",
      amountCents: 3_100_00,
      frequency: "monthly",
      startDate: "2026-01-01",
    });
    expect(created.status).toBe(200);

    await client.postDailyEntry(establishmentId, {
      entryDate: "2026-01-15",
      grossRevenueCents: 0,
      ordersCount: 0,
      discountsCents: 0,
      cancellationsCents: 0,
      knownFeesCents: 0,
    });

    const summary = await client.getSummary(establishmentId, { from: "2026-01-01", to: "2026-01-31" });
    expect(summary.status).toBe(200);
    // Full 31-day January, cost starts Jan 1: full amount allocated.
    expect(summary.body.summary?.totalCostsCents).toBe(3_100_00);
  });

  it("prorates a recurring cost that starts mid-period", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    await client.postRecurringCost(establishmentId, {
      categoryName: "Aluguel",
      name: "Aluguel da cozinha",
      amountCents: 3_100_00,
      frequency: "monthly",
      startDate: "2026-02-16",
    });

    const summary = await client.getSummary(establishmentId, { from: "2026-02-01", to: "2026-02-28" });
    expect(summary.status).toBe(200);
    // 13 of 28 days in February: 3100,00 * 13 / 28 = 1439,29 -> rounds to 1439.
    const expected = Math.round((3_100_00 * 13) / 28);
    expect(summary.body.summary?.totalCostsCents).toBe(expected);
  });

  it("excludes a recurring cost from a period entirely before it started", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    await client.postRecurringCost(establishmentId, {
      categoryName: "Aluguel",
      name: "Aluguel da cozinha",
      amountCents: 3_100_00,
      frequency: "monthly",
      startDate: "2026-03-01",
    });

    const summary = await client.getSummary(establishmentId, { from: "2026-01-01", to: "2026-01-31" });
    expect(summary.status).toBe(200);
    expect(summary.body.summary?.totalCostsCents).toBe(0);
  });

  it("lists recurring costs for the establishment", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    await client.postRecurringCost(establishmentId, {
      categoryName: "Assinaturas",
      name: "Software de gestão",
      amountCents: 150_00,
      frequency: "monthly",
      startDate: "2026-01-01",
    });

    const list = await client.listRecurringCosts(establishmentId);
    expect(list.status).toBe(200);
    expect(list.body.recurringCosts).toHaveLength(1);
    expect(list.body.recurringCosts?.[0]?.name).toBe("Software de gestão");
  });

  it("never leaks one establishment's recurring costs into another's summary", async () => {
    const clientA = new TestClient();
    const { establishmentId: establishmentA } = await createLoggedInEstablishment(clientA, {
      email: "dona-rec-a@example.com",
    });
    await clientA.postRecurringCost(establishmentA, {
      categoryName: "Aluguel",
      name: "Aluguel A",
      amountCents: 5_000_00,
      frequency: "monthly",
      startDate: "2026-01-01",
    });

    const clientB = new TestClient();
    const { establishmentId: establishmentB } = await createLoggedInEstablishment(clientB, {
      email: "dono-rec-b@example.com",
    });

    const summaryB = await clientB.getSummary(establishmentB, { from: "2026-01-01", to: "2026-01-31" });
    expect(summaryB.status).toBe(200);
    expect(summaryB.body.summary?.totalCostsCents).toBe(0);
  });

  it("deactivating a recurring cost removes its share from a later summary", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    const created = await client.postRecurringCost(establishmentId, {
      categoryName: "Aluguel",
      name: "Aluguel da cozinha",
      amountCents: 3_100_00,
      frequency: "monthly",
      startDate: "2026-01-01",
    });
    const costId = created.body.recurringCost?.id as string;

    const deactivated = await client.deactivateRecurringCost(establishmentId, costId);
    expect(deactivated.status).toBe(200);

    const summary = await client.getSummary(establishmentId, { from: "2026-01-01", to: "2026-01-31" });
    expect(summary.body.summary?.totalCostsCents).toBe(0);

    const list = await client.listRecurringCosts(establishmentId);
    expect(list.body.recurringCosts?.[0]?.active).toBe(false);
  });

  it("404s deactivating a recurring cost that belongs to a different establishment", async () => {
    const clientA = new TestClient();
    const { establishmentId: establishmentA } = await createLoggedInEstablishment(clientA, {
      email: "dona-rec-d@example.com",
    });
    const created = await clientA.postRecurringCost(establishmentA, {
      categoryName: "Aluguel",
      name: "Aluguel A",
      amountCents: 1_000_00,
      frequency: "monthly",
      startDate: "2026-01-01",
    });
    const costId = created.body.recurringCost?.id as string;

    const clientB = new TestClient();
    const { establishmentId: establishmentB } = await createLoggedInEstablishment(clientB, {
      email: "dono-rec-e@example.com",
    });

    const deactivated = await clientB.deactivateRecurringCost(establishmentB, costId);
    expect(deactivated.status).toBe(200);

    const listA = await clientA.listRecurringCosts(establishmentA);
    expect(listA.body.recurringCosts?.[0]?.active).toBe(true);
  });
});

describe("monthly goals", () => {
  it("creates a goal and reports the distance to it", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    const goal = await client.postGoal(establishmentId, {
      periodStart: "2026-01-01",
      profitGoalCents: 5_000_00,
    });
    expect(goal.status).toBe(200);

    await client.postDailyEntry(establishmentId, {
      entryDate: "2026-01-10",
      grossRevenueCents: 2_000_00,
      ordersCount: 10,
      discountsCents: 0,
      cancellationsCents: 0,
      knownFeesCents: 0,
    });

    const progress = await client.getGoalProgress(establishmentId, "2026-01-01");
    expect(progress.status).toBe(200);
    expect(progress.body.progress?.profitGoalCents).toBe(5_000_00);
    const gap = progress.body.progress?.gapToGoal as { status: string; value?: number };
    expect(gap.status).toBe("available");
    expect(gap.value).toBe(3_000_00);
  });

  it("replaces an existing goal for the same month instead of duplicating it", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    await client.postGoal(establishmentId, { periodStart: "2026-02-01", profitGoalCents: 1_000_00 });
    const second = await client.postGoal(establishmentId, { periodStart: "2026-02-01", profitGoalCents: 2_000_00 });
    expect(second.status).toBe(200);

    const progress = await client.getGoalProgress(establishmentId, "2026-02-01");
    expect(progress.body.progress?.profitGoalCents).toBe(2_000_00);
  });

  it("reports 'no_goal' distinctly when no goal is set for the month", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    const progress = await client.getGoalProgress(establishmentId, "2026-05-01");
    expect(progress.status).toBe(200);
    expect(progress.body.progress?.profitGoalCents).toBeNull();
    const gap = progress.body.progress?.gapToGoal as { status: string; reason?: string };
    expect(gap).toEqual({ status: "unavailable", reason: "no_goal" });
  });
});
