import { describe, expect, it } from "vitest";
import {
  generateResultToken,
  generateSessionSecret,
  hashSessionSecret,
  safeCompareHash,
  TOKEN_LENGTH,
  tokenFingerprint,
  verifySessionSecret,
} from "./secrets";

const BASE64URL = /^[A-Za-z0-9_-]+$/;

describe("generateSessionSecret / generateResultToken", () => {
  it("produce base64url strings of 256 bits of entropy", () => {
    for (const value of [generateSessionSecret(), generateResultToken()]) {
      expect(value).toHaveLength(TOKEN_LENGTH);
      expect(value).toMatch(BASE64URL);
      // 43 base64url chars decode back to exactly 32 bytes = 256 bits.
      expect(Buffer.from(value, "base64url")).toHaveLength(32);
    }
  });

  it("never repeats across many generations", () => {
    const count = 500;
    const secrets = new Set(Array.from({ length: count }, () => generateSessionSecret()));
    const tokens = new Set(Array.from({ length: count }, () => generateResultToken()));
    expect(secrets.size).toBe(count);
    expect(tokens.size).toBe(count);
  });

  it("does not derive the result token from the session secret", () => {
    const secret = generateSessionSecret();
    const token = generateResultToken();
    expect(token).not.toBe(secret);
    expect(token).not.toBe(hashSessionSecret(secret));
  });
});

describe("hashSessionSecret", () => {
  it("is deterministic", () => {
    const secret = generateSessionSecret();
    expect(hashSessionSecret(secret)).toBe(hashSessionSecret(secret));
  });

  it("produces a 64-character hex SHA-256 digest", () => {
    const hash = hashSessionSecret("qualquer-segredo");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("matches the known SHA-256 of a fixed input", () => {
    // Pinned reference digest, so a refactor can't silently swap the
    // algorithm out from under the stored hashes.
    expect(hashSessionSecret("konvert")).toBe(
      "3d8f70bb8b7e4f4b6a593edcef65370cfdb90e04ff71be824f3f3688ecae04e1",
    );
    expect(hashSessionSecret("konvert")).not.toBe(hashSessionSecret("konvert "));
  });

  it("never returns the secret itself", () => {
    const secret = generateSessionSecret();
    expect(hashSessionSecret(secret)).not.toBe(secret);
  });
});

describe("safeCompareHash", () => {
  it("returns true for identical values", () => {
    const hash = hashSessionSecret("abc");
    expect(safeCompareHash(hash, hash)).toBe(true);
  });

  it("returns false for different values of the same length", () => {
    expect(safeCompareHash(hashSessionSecret("abc"), hashSessionSecret("abd"))).toBe(false);
  });

  it("returns false (without throwing) for values of different lengths", () => {
    expect(safeCompareHash("abc", hashSessionSecret("abc"))).toBe(false);
    expect(safeCompareHash("", hashSessionSecret("abc"))).toBe(false);
  });
});

describe("verifySessionSecret", () => {
  it("accepts the secret that produced the stored hash", () => {
    const secret = generateSessionSecret();
    expect(verifySessionSecret(secret, hashSessionSecret(secret))).toBe(true);
  });

  it("rejects any other secret", () => {
    const stored = hashSessionSecret(generateSessionSecret());
    expect(verifySessionSecret(generateSessionSecret(), stored)).toBe(false);
  });

  it("rejects garbage without throwing", () => {
    expect(verifySessionSecret("", hashSessionSecret("x"))).toBe(false);
    expect(verifySessionSecret("x", "")).toBe(false);
  });
});

describe("tokenFingerprint", () => {
  it("is short, deterministic and never the value itself", () => {
    const token = generateResultToken();
    const fingerprint = tokenFingerprint(token);
    expect(fingerprint).toHaveLength(8);
    expect(fingerprint).toBe(tokenFingerprint(token));
    expect(token).not.toContain(fingerprint);
  });
});
