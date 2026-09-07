import { describe, expect, it } from "vitest";
import { TestClient, createLoggedInEstablishment } from "./client";

describe("daily entries CRUD", () => {
  it("creates a daily entry and reads it back via the summary", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    const created = await client.postDailyEntry(establishmentId, {
      entryDate: "2026-01-10",
      grossRevenueCents: 1_000_00,
      ordersCount: 40,
      discountsCents: 10_00,
      cancellationsCents: 0,
      knownFeesCents: 50_00,
    });
    expect(created.status).toBe(200);
    expect(created.body.entry?.entriesVersion).toBe(0);

    const summary = await client.getSummary(establishmentId, { from: "2026-01-01", to: "2026-01-31" });
    expect(summary.status).toBe(200);
    expect(summary.body.summary?.netRevenueCents).toBe(990_00);
  });

  it("edits an existing entry under optimistic locking", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    const created = await client.postDailyEntry(establishmentId, {
      entryDate: "2026-02-01",
      grossRevenueCents: 500_00,
      ordersCount: 10,
      discountsCents: 0,
      cancellationsCents: 0,
      knownFeesCents: 0,
    });
    const version = created.body.entry?.entriesVersion as number;

    const edited = await client.postDailyEntry(establishmentId, {
      entryDate: "2026-02-01",
      grossRevenueCents: 600_00,
      ordersCount: 12,
      discountsCents: 0,
      cancellationsCents: 0,
      knownFeesCents: 0,
      expectedVersion: version,
    });
    expect(edited.status).toBe(200);
    expect(edited.body.entry?.grossRevenueCents).toBe(600_00);
    expect(edited.body.entry?.entriesVersion).toBe(1);
  });

  it("rejects a stale edit instead of silently overwriting it", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    await client.postDailyEntry(establishmentId, {
      entryDate: "2026-03-01",
      grossRevenueCents: 100_00,
      ordersCount: 1,
      discountsCents: 0,
      cancellationsCents: 0,
      knownFeesCents: 0,
    });

    // First edit succeeds and advances the version to 1.
    await client.postDailyEntry(establishmentId, {
      entryDate: "2026-03-01",
      grossRevenueCents: 200_00,
      ordersCount: 2,
      discountsCents: 0,
      cancellationsCents: 0,
      knownFeesCents: 0,
      expectedVersion: 0,
    });

    // A second client, still holding the stale version 0, tries to edit.
    const stale = await client.postDailyEntry(establishmentId, {
      entryDate: "2026-03-01",
      grossRevenueCents: 300_00,
      ordersCount: 3,
      discountsCents: 0,
      cancellationsCents: 0,
      knownFeesCents: 0,
      expectedVersion: 0,
    });
    expect(stale.status).toBe(409);
  });

  it("keeps entries for the same date but different channels separate", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    await client.postDailyEntry(establishmentId, {
      entryDate: "2026-04-01",
      channelName: "iFood",
      grossRevenueCents: 1_000_00,
      ordersCount: 10,
      discountsCents: 0,
      cancellationsCents: 0,
      knownFeesCents: 0,
    });
    await client.postDailyEntry(establishmentId, {
      entryDate: "2026-04-01",
      channelName: "Balcão",
      grossRevenueCents: 500_00,
      ordersCount: 5,
      discountsCents: 0,
      cancellationsCents: 0,
      knownFeesCents: 0,
    });

    const list = await client.listDailyEntries(establishmentId, { from: "2026-04-01", to: "2026-04-01" });
    expect(list.status).toBe(200);
    expect(list.body.entries).toHaveLength(2);
  });

  it("never leaks one establishment's entries into another's summary", async () => {
    const clientA = new TestClient();
    const { establishmentId: establishmentA } = await createLoggedInEstablishment(clientA, {
      email: "dona-a@example.com",
    });
    await clientA.postDailyEntry(establishmentA, {
      entryDate: "2026-05-01",
      grossRevenueCents: 1_000_00,
      ordersCount: 10,
      discountsCents: 0,
      cancellationsCents: 0,
      knownFeesCents: 0,
    });

    const clientB = new TestClient();
    const { establishmentId: establishmentB } = await createLoggedInEstablishment(clientB, {
      email: "dono-b@example.com",
    });

    const summaryB = await clientB.getSummary(establishmentB, { from: "2026-05-01", to: "2026-05-01" });
    expect(summaryB.status).toBe(200);
    expect(summaryB.body.summary?.netRevenueCents).toBe(0);

    // B's session can never even read A's establishment — 404, not 403.
    const crossRead = await clientB.getSummary(establishmentA, { from: "2026-05-01", to: "2026-05-01" });
    expect(crossRead.status).toBe(404);
  });

  it("requires an app session to write or read", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    const anonymous = new TestClient();
    const response = await anonymous.getSummary(establishmentId, { from: "2026-01-01", to: "2026-01-31" });
    expect(response.status).toBe(401);
  });
});
