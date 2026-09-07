import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./setup";
import { TestClient } from "./client";
import { hashSessionSecret } from "@/domain/token/secrets";

function extractToken(devVerifyUrl: string): string {
  const match = /token=([^&]+)/.exec(devVerifyUrl);
  if (!match) throw new Error("devVerifyUrl sem token");
  return decodeURIComponent(match[1]);
}

describe("requesting a magic link", () => {
  it("creates a new user on first request and returns a dev verify URL outside production", async () => {
    const client = new TestClient();
    const response = await client.requestMagicLink("nova@example.com");

    expect(response.status).toBe(200);
    expect(response.body.devVerifyUrl).toMatch(/^\/entrar\/verificar\?token=/);

    const [row] = await db.execute<{ email: string }>(
      sql`SELECT email FROM users WHERE email = 'nova@example.com'`,
    );
    expect(row.email).toBe("nova@example.com");
  });

  it("reuses the existing account on a second request instead of creating a duplicate", async () => {
    const client = new TestClient();
    await client.requestMagicLink("repetida@example.com");
    await client.requestMagicLink("repetida@example.com");

    const rows = await db.execute<{ count: string }>(
      sql`SELECT count(*)::text as count FROM users WHERE email = 'repetida@example.com'`,
    );
    expect(rows[0].count).toBe("1");
  });

  it("never stores the raw token, only its hash", async () => {
    const client = new TestClient();
    const response = await client.requestMagicLink("hash@example.com");
    const token = extractToken(response.body.devVerifyUrl!);

    const [row] = await db.execute<{ token_hash: string }>(
      sql`SELECT token_hash FROM login_tokens ORDER BY created_at DESC LIMIT 1`,
    );
    expect(row.token_hash).not.toBe(token);
    expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("verifying a magic link", () => {
  it("consumes a valid token and issues an httpOnly app session cookie", async () => {
    const client = new TestClient();
    const requested = await client.requestMagicLink("valido@example.com");
    const token = extractToken(requested.body.devVerifyUrl!);

    const verified = await client.verifyMagicLink(token);

    expect(verified.status).toBe(200);
    expect(verified.body.ok).toBe(true);
    const setCookie = verified.headers.getSetCookie().join(";");
    expect(setCookie).toContain("HttpOnly");
    expect(client.getAppSessionCookie()).toBeTruthy();
  });

  it("rejects reusing an already-consumed token", async () => {
    const client = new TestClient();
    const requested = await client.requestMagicLink("reuso@example.com");
    const token = extractToken(requested.body.devVerifyUrl!);

    await client.verifyMagicLink(token);
    const second = await client.verifyMagicLink(token);

    expect(second.status).toBe(404);
  });

  it("rejects a token that never existed", async () => {
    const client = new TestClient();
    const bogus = "x".repeat(43);
    const response = await client.verifyMagicLink(bogus);
    expect(response.status).toBe(404);
  });

  it("rejects an expired token", async () => {
    const client = new TestClient();
    const requested = await client.requestMagicLink("expirado@example.com");
    const token = extractToken(requested.body.devVerifyUrl!);

    await db.execute(sql`UPDATE login_tokens SET expires_at = now() - interval '1 minute'`);

    const response = await client.verifyMagicLink(token);
    expect(response.status).toBe(404);
  });

  it("logging in twice invalidates the first session", async () => {
    const client = new TestClient();
    const first = await client.requestMagicLink("duassessoes@example.com");
    const firstToken = extractToken(first.body.devVerifyUrl!);
    await client.verifyMagicLink(firstToken);
    const firstAppCookie = client.getAppSessionCookie();

    const second = await client.requestMagicLink("duassessoes@example.com");
    const secondToken = extractToken(second.body.devVerifyUrl!);
    await client.verifyMagicLink(secondToken);

    // Forge the old cookie back and confirm it no longer resolves to a user.
    client.setAppSessionCookie(firstAppCookie);
    const [row] = await db.execute<{ session_hash: string }>(
      sql`SELECT session_hash FROM users WHERE email = 'duassessoes@example.com'`,
    );
    expect(hashSessionSecret(firstAppCookie!)).not.toBe(row.session_hash);
  });
});
