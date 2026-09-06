import { describe, expect, it } from "vitest";
import { assertSafeFunnelMetadata } from "./funnel-repository";

describe("assertSafeFunnelMetadata", () => {
  it("allows ordinary funnel properties", () => {
    expect(() =>
      assertSafeFunnelMetadata({ step: "vendas", durationMs: 1200, unknownCost: true }),
    ).not.toThrow();
  });

  it("allows null metadata", () => {
    expect(() => assertSafeFunnelMetadata(null)).not.toThrow();
  });

  it("rejects a session secret", () => {
    expect(() => assertSafeFunnelMetadata({ sessionSecret: "abc" })).toThrow();
    expect(() => assertSafeFunnelMetadata({ draftSessionHash: "abc" })).toThrow();
  });

  it("rejects a full result token", () => {
    expect(() => assertSafeFunnelMetadata({ resultToken: "abc" })).toThrow();
    expect(() => assertSafeFunnelMetadata({ token: "abc" })).toThrow();
  });

  it("rejects personal data", () => {
    expect(() => assertSafeFunnelMetadata({ name: "Maria" })).toThrow();
    expect(() => assertSafeFunnelMetadata({ nome: "Maria" })).toThrow();
    expect(() => assertSafeFunnelMetadata({ whatsapp: "11988887777" })).toThrow();
    expect(() => assertSafeFunnelMetadata({ telefone: "11988887777" })).toThrow();
  });

  it("catches the forbidden keys regardless of casing or separators", () => {
    expect(() => assertSafeFunnelMetadata({ result_token: "abc" })).toThrow();
    expect(() => assertSafeFunnelMetadata({ "Session-Secret": "abc" })).toThrow();
    expect(() => assertSafeFunnelMetadata({ WHATSAPP: "x" })).toThrow();
  });
});
