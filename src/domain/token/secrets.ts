import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Secrets and public tokens for the diagnostic.
 *
 * Pure `node:crypto` — no Next.js, no database, no request objects — so it
 * stays inside the domain layer's "no I/O, testable without mocks" rule.
 *
 * Two distinct kinds of value, never interchangeable:
 *
 * - **Session secret**: authorizes *writing* to a draft. Only its SHA-256
 *   hash is stored (`diagnostics.draft_session_hash`); the secret itself
 *   exists solely inside the httpOnly cookie. Knowing a diagnostic's UUID
 *   grants nothing.
 * - **Result token**: authorizes *reading* the public result. Stored in
 *   full (it is the lookup key) but never derived from the session secret,
 *   so one can never be used to obtain the other.
 */

/** 32 bytes = 256 bits of entropy, the minimum for both kinds of value. */
export const TOKEN_BYTES = 32;

/** base64url of 32 bytes is always 43 characters (no padding). */
export const TOKEN_LENGTH = 43;

function randomBase64Url(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function generateSessionSecret(): string {
  return randomBase64Url();
}

export function generateResultToken(): string {
  return randomBase64Url();
}

/** SHA-256, hex encoded. Deterministic: the same secret always maps to the same hash. */
export function hashSessionSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

/**
 * Constant-time comparison of two hex hashes. Returns false (without
 * leaking timing) when the lengths differ, so a caller can pass untrusted
 * input directly.
 */
export function safeCompareHash(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Verifies a raw secret against a stored hash. The only correct way to
 * check session ownership.
 */
export function verifySessionSecret(secret: string, storedHash: string): boolean {
  return safeCompareHash(hashSessionSecret(secret), storedHash);
}

/**
 * Safe-for-logs fingerprint of a token or secret: never log the value
 * itself. Eight hex characters is enough to correlate two log lines and
 * useless for reconstructing the original.
 */
export function tokenFingerprint(value: string): string {
  return hashSessionSecret(value).slice(0, 8);
}
