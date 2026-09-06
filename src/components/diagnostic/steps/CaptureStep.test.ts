import { describe, expect, it } from "vitest";
import { emptyContactFormState, isContactFormComplete } from "./CaptureStep";

describe("isContactFormComplete", () => {
  it("is false for the empty form", () => {
    expect(isContactFormComplete(emptyContactFormState())).toBe(false);
  });

  it("requires name, a plausible WhatsApp and the contact consent", () => {
    expect(
      isContactFormComplete({
        name: "Maria",
        whatsapp: "(11) 98888-7777",
        contactConsent: true,
        marketingOptIn: false,
      }),
    ).toBe(true);
  });

  it("blocks when the mandatory contact consent is unchecked", () => {
    expect(
      isContactFormComplete({
        name: "Maria",
        whatsapp: "(11) 98888-7777",
        contactConsent: false,
        marketingOptIn: false,
      }),
    ).toBe(false);
  });

  it("marketing left unchecked never blocks completion", () => {
    const withMarketingOff = isContactFormComplete({
      name: "Maria",
      whatsapp: "(11) 98888-7777",
      contactConsent: true,
      marketingOptIn: false,
    });
    const withMarketingOn = isContactFormComplete({
      name: "Maria",
      whatsapp: "(11) 98888-7777",
      contactConsent: true,
      marketingOptIn: true,
    });
    expect(withMarketingOff).toBe(true);
    expect(withMarketingOn).toBe(true);
  });

  it("rejects a WhatsApp that's too short", () => {
    expect(
      isContactFormComplete({
        name: "Maria",
        whatsapp: "1198",
        contactConsent: true,
        marketingOptIn: false,
      }),
    ).toBe(false);
  });

  it("rejects an empty/whitespace-only name", () => {
    expect(
      isContactFormComplete({
        name: "   ",
        whatsapp: "(11) 98888-7777",
        contactConsent: true,
        marketingOptIn: false,
      }),
    ).toBe(false);
  });
});
