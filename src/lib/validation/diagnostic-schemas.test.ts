import { describe, expect, it } from "vitest";
import { MAX_INPUT_CENTS } from "@/domain/money/cents";
import {
  centsSchema,
  contactSchema,
  finalizeSchema,
  idempotencyKeySchema,
  MAX_NAME_LENGTH,
  moneyAnswerSchema,
  orderAnswerSchema,
  patchAnswersSchema,
  resultTokenParamSchema,
  uuidParamSchema,
} from "./diagnostic-schemas";

describe("centsSchema", () => {
  it("accepts the boundaries", () => {
    expect(centsSchema.safeParse(0).success).toBe(true);
    expect(centsSchema.safeParse(MAX_INPUT_CENTS).success).toBe(true);
  });

  it("rejects values above R$10.000.000,00", () => {
    expect(centsSchema.safeParse(MAX_INPUT_CENTS + 1).success).toBe(false);
  });

  it("rejects negatives and fractions of a cent", () => {
    expect(centsSchema.safeParse(-1).success).toBe(false);
    expect(centsSchema.safeParse(10.5).success).toBe(false);
  });
});

describe("moneyAnswerSchema — the six states", () => {
  it("accepts an informed value", () => {
    expect(moneyAnswerSchema.safeParse({ kind: "informed", value: 5_000_00 }).success).toBe(true);
  });

  it("accepts a typed estimate with no range at all", () => {
    const result = moneyAnswerSchema.safeParse({
      kind: "estimated",
      origin: "typed",
      value: 1500,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a range-derived estimate whose midpoint matches its bounds", () => {
    const result = moneyAnswerSchema.safeParse({
      kind: "estimated",
      origin: "range",
      value: 1500,
      range: { min: 1000, max: 2000 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a range-derived estimate with an incoherent midpoint", () => {
    // The server recomputes the midpoint instead of trusting the browser.
    const result = moneyAnswerSchema.safeParse({
      kind: "estimated",
      origin: "range",
      value: 9999,
      range: { min: 1000, max: 2000 },
    });
    expect(result.success).toBe(false);
  });

  it("accepts an open range (max: null) without inventing a midpoint", () => {
    const result = moneyAnswerSchema.safeParse({ kind: "range", min: 5_000_00, max: null });
    expect(result.success).toBe(true);
    if (result.success && result.data.kind === "range") {
      expect(result.data.max).toBeNull();
    }
  });

  it("rejects an inverted range", () => {
    expect(moneyAnswerSchema.safeParse({ kind: "range", min: 2000, max: 1000 }).success).toBe(
      false,
    );
  });

  it("accepts a closed range as a range answer", () => {
    expect(moneyAnswerSchema.safeParse({ kind: "range", min: 1000, max: 2000 }).success).toBe(
      true,
    );
  });

  it("accepts unknown, zero_confirmed and unanswered without any value", () => {
    expect(moneyAnswerSchema.safeParse({ kind: "unknown" }).success).toBe(true);
    expect(moneyAnswerSchema.safeParse({ kind: "zero_confirmed" }).success).toBe(true);
    expect(moneyAnswerSchema.safeParse({ kind: "unanswered" }).success).toBe(true);
  });

  it("rejects an unrecognized state", () => {
    expect(moneyAnswerSchema.safeParse({ kind: "chute", value: 10 }).success).toBe(false);
  });

  it("rejects an informed answer carrying no value", () => {
    expect(moneyAnswerSchema.safeParse({ kind: "informed" }).success).toBe(false);
  });
});

describe("orderAnswerSchema", () => {
  it("accepts a non-negative integer count", () => {
    expect(orderAnswerSchema.safeParse({ kind: "informed", value: 1000 }).success).toBe(true);
    expect(orderAnswerSchema.safeParse({ kind: "informed", value: 0 }).success).toBe(true);
  });

  it("rejects negative, fractional and absurd counts", () => {
    expect(orderAnswerSchema.safeParse({ kind: "informed", value: -1 }).success).toBe(false);
    expect(orderAnswerSchema.safeParse({ kind: "informed", value: 1.5 }).success).toBe(false);
    expect(
      orderAnswerSchema.safeParse({ kind: "informed", value: Number.MAX_SAFE_INTEGER }).success,
    ).toBe(false);
  });

  it("accepts the non-numeric states", () => {
    expect(orderAnswerSchema.safeParse({ kind: "unknown" }).success).toBe(true);
    expect(orderAnswerSchema.safeParse({ kind: "unanswered" }).success).toBe(true);
  });
});

describe("patchAnswersSchema", () => {
  it("requires expectedVersion", () => {
    expect(patchAnswersSchema.safeParse({ answers: {} }).success).toBe(false);
  });

  it("rejects a payload with nothing to update", () => {
    expect(patchAnswersSchema.safeParse({ expectedVersion: 0 }).success).toBe(false);
  });

  it("rejects unknown field keys (strict)", () => {
    const result = patchAnswersSchema.safeParse({
      expectedVersion: 0,
      answers: { lucro_secreto: { kind: "informed", value: 1 } },
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid step update", () => {
    const result = patchAnswersSchema.safeParse({
      expectedVersion: 3,
      answers: { revenue: { kind: "informed", value: 5_000_000 } },
      taxClassification: "variable",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative expectedVersion", () => {
    expect(
      patchAnswersSchema.safeParse({ expectedVersion: -1, answers: {} }).success,
    ).toBe(false);
  });
});

describe("contactSchema", () => {
  const valid = {
    name: "Maria",
    whatsapp: "(11) 98888-7777",
    contactConsent: true,
    marketingOptIn: false,
    consentTextVersion: "2026-09-06.v1",
  };

  it("normalizes the WhatsApp to digits only", () => {
    const result = contactSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.whatsapp).toBe("11988887777");
  });

  it("requires the contact consent to be true", () => {
    expect(contactSchema.safeParse({ ...valid, contactConsent: false }).success).toBe(false);
  });

  it("accepts marketingOptIn=false — refusing marketing never blocks anything", () => {
    const result = contactSchema.safeParse({ ...valid, marketingOptIn: false });
    expect(result.success).toBe(true);
  });

  it("defaults marketingOptIn to false when omitted", () => {
    const withoutOptIn = {
      name: valid.name,
      whatsapp: valid.whatsapp,
      contactConsent: valid.contactConsent,
      consentTextVersion: valid.consentTextVersion,
    };
    const result = contactSchema.safeParse(withoutOptIn);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.marketingOptIn).toBe(false);
  });

  it("rejects an empty name and one past the length limit", () => {
    expect(contactSchema.safeParse({ ...valid, name: "  " }).success).toBe(false);
    expect(
      contactSchema.safeParse({ ...valid, name: "a".repeat(MAX_NAME_LENGTH + 1) }).success,
    ).toBe(false);
  });

  it("rejects a WhatsApp with too few or too many digits", () => {
    expect(contactSchema.safeParse({ ...valid, whatsapp: "1198" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, whatsapp: "1".repeat(20) }).success).toBe(false);
  });
});

describe("finalizeSchema", () => {
  const contact = {
    name: "Maria",
    whatsapp: "11988887777",
    contactConsent: true,
    marketingOptIn: false,
    consentTextVersion: "2026-09-06.v1",
  };

  it("accepts a complete payload", () => {
    const result = finalizeSchema.safeParse({
      expectedVersion: 2,
      idempotencyKey: "a".repeat(36),
      contact,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short idempotency key", () => {
    expect(idempotencyKeySchema.safeParse("curta").success).toBe(false);
    expect(idempotencyKeySchema.safeParse("a".repeat(201)).success).toBe(false);
  });

  it("rejects unexpected extra properties (strict)", () => {
    const result = finalizeSchema.safeParse({
      expectedVersion: 2,
      idempotencyKey: "a".repeat(36),
      contact,
      admin: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("param schemas", () => {
  it("accepts a UUID and rejects anything else", () => {
    expect(uuidParamSchema.safeParse("6f4d3a2e-1b0c-4a9d-8e7f-2c1b0a9d8e7f").success).toBe(true);
    expect(uuidParamSchema.safeParse("nope").success).toBe(false);
  });

  it("accepts a 43-char base64url token and rejects the rest", () => {
    expect(resultTokenParamSchema.safeParse("a".repeat(43)).success).toBe(true);
    expect(resultTokenParamSchema.safeParse("a".repeat(42)).success).toBe(false);
    expect(resultTokenParamSchema.safeParse(`${"a".repeat(42)}$`).success).toBe(false);
  });
});
