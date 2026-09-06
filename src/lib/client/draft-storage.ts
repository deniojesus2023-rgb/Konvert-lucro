"use client";

/**
 * Everything the browser is allowed to remember about the diagnostic
 * across reloads. Deliberately narrow: the diagnostic id, which step the
 * user was on, the answers version (for optimistic-lock retries) and the
 * finalize idempotency key. NEVER the name, WhatsApp, the public result
 * token, or the session secret — those stay in the httpOnly cookie or are
 * fetched fresh from the API, which remains the source of truth.
 */

const DRAFT_STORAGE_KEY = "konvert:raiox:draft";
const IDEMPOTENCY_KEY_STORAGE_KEY = "konvert:raiox:finalize-idempotency-key";

export interface StoredDraftRef {
  readonly id: string;
  readonly step: number;
  readonly answersVersion: number;
}

function isStoredDraftRef(value: unknown): value is StoredDraftRef {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as StoredDraftRef).id === "string" &&
    typeof (value as StoredDraftRef).step === "number" &&
    typeof (value as StoredDraftRef).answersVersion === "number"
  );
}

export function loadDraftRef(): StoredDraftRef | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredDraftRef(parsed) ? parsed : null;
  } catch {
    // Private browsing, disabled storage, corrupted value — treat as "no draft".
    return null;
  }
}

export function saveDraftRef(ref: StoredDraftRef): void {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(ref));
  } catch {
    // Best-effort: the API + cookie remain the source of truth either way.
  }
}

export function clearDraftRef(): void {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}

/**
 * The finalize idempotency key lives in sessionStorage (not localStorage):
 * it only needs to survive retries within the same tab session, and
 * clearing it on tab close avoids ever reusing a stale key across
 * unrelated visits.
 */
export function getOrCreateIdempotencyKey(): string {
  try {
    const existing = window.sessionStorage.getItem(IDEMPOTENCY_KEY_STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // Fall through to a fresh, unpersisted key.
  }

  const key = crypto.randomUUID();
  try {
    window.sessionStorage.setItem(IDEMPOTENCY_KEY_STORAGE_KEY, key);
  } catch {
    // Best-effort persistence; the key still works for this call.
  }
  return key;
}

export function clearIdempotencyKey(): void {
  try {
    window.sessionStorage.removeItem(IDEMPOTENCY_KEY_STORAGE_KEY);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
