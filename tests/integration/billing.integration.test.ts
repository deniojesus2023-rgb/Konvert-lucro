import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "./setup";
import { TestClient, createLoggedInEstablishment, callWebhook } from "./client";

const WEBHOOK_SECRET = "whsec_test_dummy_secret";

function signedPayload(event: unknown): { rawBody: string; signature: string } {
  const rawBody = JSON.stringify(event);
  const signature = Stripe.webhooks.generateTestHeaderString({ payload: rawBody, secret: WEBHOOK_SECRET });
  return { rawBody, signature };
}

function subscriptionEvent(input: {
  id: string;
  type: string;
  created: number;
  subscriptionId: string;
  establishmentId: string;
  status: string;
  customerId?: string;
  priceId?: string;
  periodStart?: number;
  periodEnd?: number;
}) {
  return {
    id: input.id,
    object: "event",
    type: input.type,
    created: input.created,
    data: {
      object: {
        id: input.subscriptionId,
        object: "subscription",
        customer: input.customerId ?? "cus_test_1",
        status: input.status,
        metadata: { establishmentId: input.establishmentId },
        items: {
          object: "list",
          data: [
            {
              id: "si_test_1",
              price: { id: input.priceId ?? "price_test_dummy" },
              current_period_start: input.periodStart ?? input.created,
              current_period_end: input.periodEnd ?? input.created + 30 * 24 * 60 * 60,
            },
          ],
        },
      },
    },
  };
}

describe("billing webhook", () => {
  it("rejects a request with no stripe-signature header", async () => {
    const response = await callWebhook(JSON.stringify({ id: "evt_1" }), null);
    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe("invalid_signature");
  });

  it("rejects a request with an invalid signature", async () => {
    const response = await callWebhook(JSON.stringify({ id: "evt_1" }), "t=1,v1=bogus");
    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe("invalid_signature");
  });

  it("applies a customer.subscription.created event and records an active subscription", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);
    const now = Math.floor(Date.now() / 1000);

    const event = subscriptionEvent({
      id: "evt_created_1",
      type: "customer.subscription.created",
      created: now,
      subscriptionId: "sub_1",
      establishmentId,
      status: "active",
    });
    const { rawBody, signature } = signedPayload(event);

    const response = await callWebhook(rawBody, signature);
    expect(response.status).toBe(200);

    const status = await client.getSubscriptionStatus(establishmentId);
    expect(status.body.subscription?.status).toBe("active");
    expect(status.body.subscription?.isActive).toBe(true);
  });

  it("never applies the same event twice (idempotent redelivery)", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);
    const now = Math.floor(Date.now() / 1000);

    const event = subscriptionEvent({
      id: "evt_dup_1",
      type: "customer.subscription.created",
      created: now,
      subscriptionId: "sub_dup",
      establishmentId,
      status: "active",
    });
    const { rawBody, signature } = signedPayload(event);

    await callWebhook(rawBody, signature);
    const second = await callWebhook(rawBody, signature);
    expect(second.status).toBe(200);

    const rows = await db.execute<{ count: string }>(
      sql`SELECT count(*)::text as count FROM subscriptions WHERE establishment_id = ${establishmentId}`,
    );
    expect(rows[0].count).toBe("1");
  });

  it("never lets an out-of-order (older) event regress a newer status", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);
    const now = Math.floor(Date.now() / 1000);

    const newer = subscriptionEvent({
      id: "evt_newer",
      type: "customer.subscription.updated",
      created: now,
      subscriptionId: "sub_order",
      establishmentId,
      status: "active",
    });
    const older = subscriptionEvent({
      id: "evt_older",
      type: "customer.subscription.updated",
      created: now - 3600,
      subscriptionId: "sub_order",
      establishmentId,
      status: "past_due",
    });

    // Deliver the newer event first, then the older one arrives late.
    const newerSigned = signedPayload(newer);
    const olderSigned = signedPayload(older);
    await callWebhook(newerSigned.rawBody, newerSigned.signature);
    await callWebhook(olderSigned.rawBody, olderSigned.signature);

    const status = await client.getSubscriptionStatus(establishmentId);
    expect(status.body.subscription?.status).toBe("active");
  });

  it("ignores an event with no establishmentId metadata instead of crashing", async () => {
    const now = Math.floor(Date.now() / 1000);
    const event = {
      id: "evt_no_meta",
      object: "event",
      type: "customer.subscription.created",
      created: now,
      data: {
        object: {
          id: "sub_no_meta",
          object: "subscription",
          customer: "cus_x",
          status: "active",
          metadata: {},
          items: { object: "list", data: [] },
        },
      },
    };
    const { rawBody, signature } = signedPayload(event);
    const response = await callWebhook(rawBody, signature);
    expect(response.status).toBe(200);
  });

  it("claims but ignores an event type it doesn't handle", async () => {
    const now = Math.floor(Date.now() / 1000);
    const event = {
      id: "evt_unhandled",
      object: "event",
      type: "invoice.paid",
      created: now,
      data: { object: { id: "in_1", object: "invoice" } },
    };
    const { rawBody, signature } = signedPayload(event);
    const response = await callWebhook(rawBody, signature);
    expect(response.status).toBe(200);
  });
});

describe("billing authorization guards", () => {
  it("refuses to start checkout for an establishment the caller doesn't belong to", async () => {
    const owner = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(owner);

    const intruder = new TestClient();
    await createLoggedInEstablishment(intruder, { email: "intruso-billing@example.com" });

    const response = await intruder.postCheckoutSession(establishmentId);
    expect(response.status).toBe(404);
  });

  it("refuses to open the billing portal for an establishment with no subscription on record", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    const response = await client.postPortalSession(establishmentId);
    expect(response.status).toBe(409);
  });

  it("reports 'none' for an establishment that never subscribed", async () => {
    const client = new TestClient();
    const { establishmentId } = await createLoggedInEstablishment(client);

    const status = await client.getSubscriptionStatus(establishmentId);
    expect(status.status).toBe(200);
    expect(status.body.subscription).toEqual({ status: "none", isActive: false, currentPeriodEnd: null });
  });
});
