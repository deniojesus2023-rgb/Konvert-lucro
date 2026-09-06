// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDraftRef,
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
  loadDraftRef,
  saveDraftRef,
} from "./draft-storage";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("draft ref storage", () => {
  it("round-trips id/step/answersVersion", () => {
    saveDraftRef({ id: "abc-123", step: 3, answersVersion: 2 });
    expect(loadDraftRef()).toEqual({ id: "abc-123", step: 3, answersVersion: 2 });
  });

  it("returns null when nothing is stored", () => {
    expect(loadDraftRef()).toBeNull();
  });

  it("clears the stored ref", () => {
    saveDraftRef({ id: "abc-123", step: 1, answersVersion: 0 });
    clearDraftRef();
    expect(loadDraftRef()).toBeNull();
  });

  it("never persists name, whatsapp, a result token or a session secret", () => {
    saveDraftRef({ id: "abc-123", step: 1, answersVersion: 0 });
    const raw = window.localStorage.getItem("konvert:raiox:draft") ?? "";
    expect(raw).not.toMatch(/whatsapp|nome|name|token|secret/i);
  });
});

describe("finalize idempotency key", () => {
  it("generates a key and reuses it on subsequent calls", () => {
    const first = getOrCreateIdempotencyKey();
    const second = getOrCreateIdempotencyKey();
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("generates a new key after clearing", () => {
    const first = getOrCreateIdempotencyKey();
    clearIdempotencyKey();
    const second = getOrCreateIdempotencyKey();
    expect(second).not.toBe(first);
  });
});
