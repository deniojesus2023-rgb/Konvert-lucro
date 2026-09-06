import { z } from "zod";
import { MAX_INPUT_CENTS, roundHalfAwayFromZero } from "@/domain/money/cents";
import { REQUIRED_COST_GROUPS, TAX_CLASSIFICATIONS } from "@/domain/diagnostic/constants";

/**
 * Every payload the API accepts. These schemas run on the SERVER on every
 * request — the browser's validation is a UX convenience, never a trust
 * boundary.
 */

export const MAX_TEXT_LENGTH = 200;
export const MAX_NAME_LENGTH = 120;
export const MAX_ORDERS = 100_000_000;

/** Monetary input: integer cents, 0..1_000_000_000 (R$10.000.000,00). */
export const centsSchema = z
  .number()
  .int("Valor monetário deve ser um número inteiro de centavos")
  .min(0, "Valor monetário não pode ser negativo")
  .max(MAX_INPUT_CENTS, "Valor monetário excede o limite permitido");

/** Order count: safe non-negative integer. */
export const orderCountSchema = z
  .number()
  .int("Quantidade de pedidos deve ser um número inteiro")
  .min(0, "Quantidade de pedidos não pode ser negativa")
  .max(MAX_ORDERS, "Quantidade de pedidos excede o limite permitido");

/**
 * The six response states, mirroring `ResponseState` in the domain.
 *
 * Two rules are enforced here that the type system alone can't:
 * - a closed range must have `min <= max`;
 * - an `estimated` answer with `origin: "range"` must carry a midpoint
 *   that actually matches its bounds — the server recomputes it rather
 *   than trusting the number the browser sent.
 */
const informedAnswer = z.object({
  kind: z.literal("informed"),
  value: centsSchema,
});

const rangeAnswer = z
  .object({
    kind: z.literal("range"),
    min: centsSchema,
    // null = open range ("mais de X"): no midpoint can be invented from it.
    max: centsSchema.nullable(),
  })
  .refine((data) => data.max === null || data.max >= data.min, {
    message: "Faixa inválida: o máximo não pode ser menor que o mínimo",
    path: ["max"],
  });

const estimatedTypedAnswer = z.object({
  kind: z.literal("estimated"),
  origin: z.literal("typed"),
  value: centsSchema,
});

const estimatedRangeAnswer = z
  .object({
    kind: z.literal("estimated"),
    origin: z.literal("range"),
    value: centsSchema,
    range: z.object({ min: centsSchema, max: centsSchema }),
  })
  .refine((data) => data.range.max >= data.range.min, {
    message: "Faixa inválida: o máximo não pode ser menor que o mínimo",
    path: ["range", "max"],
  })
  .refine(
    (data) => data.value === roundHalfAwayFromZero((data.range.min + data.range.max) / 2),
    {
      message: "Ponto médio incoerente com a faixa informada",
      path: ["value"],
    },
  );

const estimatedAnswer = z.discriminatedUnion("origin", [
  estimatedTypedAnswer,
  estimatedRangeAnswer,
]);

const unknownAnswer = z.object({ kind: z.literal("unknown") });
const zeroConfirmedAnswer = z.object({ kind: z.literal("zero_confirmed") });
const unansweredAnswer = z.object({ kind: z.literal("unanswered") });

/** A monetary answer in any of the six states. */
export const moneyAnswerSchema = z.union([
  informedAnswer,
  rangeAnswer,
  estimatedAnswer,
  unknownAnswer,
  zeroConfirmedAnswer,
  unansweredAnswer,
]);

/** Orders use the same states but carry a count instead of cents. */
export const orderAnswerSchema = z.union([
  z.object({ kind: z.literal("informed"), value: orderCountSchema }),
  unknownAnswer,
  zeroConfirmedAnswer,
  unansweredAnswer,
]);

export const taxClassificationSchema = z.enum(TAX_CLASSIFICATIONS);

/** The canonical field keys persisted in `diagnostic_answers`. */
export const MONEY_FIELD_KEYS = [
  "revenue",
  ...REQUIRED_COST_GROUPS.map((group) => `cost_${toSnakeCase(group)}` as const),
  "taxes",
  "goal",
] as const;

export const ALL_FIELD_KEYS = [...MONEY_FIELD_KEYS, "orders"] as const;

export type FieldKey = (typeof ALL_FIELD_KEYS)[number];

function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** Profile answers that live on the `diagnostics` row itself. */
export const profileSchema = z.object({
  deliveryType: z.string().max(MAX_TEXT_LENGTH).nullish(),
  mainChannel: z.string().max(MAX_TEXT_LENGTH).nullish(),
});

export const answersPayloadSchema = z
  .object({
    revenue: moneyAnswerSchema.optional(),
    cost_production: moneyAnswerSchema.optional(),
    cost_fees: moneyAnswerSchema.optional(),
    cost_delivery: moneyAnswerSchema.optional(),
    cost_fixed_structure: moneyAnswerSchema.optional(),
    taxes: moneyAnswerSchema.optional(),
    goal: moneyAnswerSchema.optional(),
    orders: orderAnswerSchema.optional(),
  })
  .strict();

export type AnswersPayload = z.infer<typeof answersPayloadSchema>;

export const expectedVersionSchema = z
  .number()
  .int("expectedVersion deve ser um inteiro")
  .min(0, "expectedVersion não pode ser negativo");

export const idempotencyKeySchema = z
  .string()
  .min(16, "idempotencyKey muito curta")
  .max(200, "idempotencyKey muito longa");

export const uuidParamSchema = z.uuid("Identificador inválido");

/** base64url token of exactly 43 characters (32 random bytes). */
export const resultTokenParamSchema = z
  .string()
  .length(43, "Token inválido")
  .regex(/^[A-Za-z0-9_-]+$/, "Token inválido");

export const patchAnswersSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    answers: answersPayloadSchema.optional(),
    profile: profileSchema.optional(),
    taxClassification: taxClassificationSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.answers !== undefined ||
      data.profile !== undefined ||
      data.taxClassification !== undefined,
    { message: "Nada para atualizar" },
  );

export type PatchAnswersPayload = z.infer<typeof patchAnswersSchema>;

/**
 * Contact + consent captured at the very end of the diagnostic.
 *
 * `contactConsent` must be literally `true` — it's the legal basis for
 * storing the contact at all. `marketingOptIn` is independent and defaults
 * to false: refusing marketing never blocks the result.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(MAX_NAME_LENGTH, "Nome muito longo"),
  whatsapp: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((digits) => digits.length >= 10 && digits.length <= 13, {
      message: "WhatsApp inválido",
    }),
  contactConsent: z.literal(true, {
    message: "O consentimento de contato é obrigatório",
  }),
  marketingOptIn: z.boolean().default(false),
  consentTextVersion: z.string().min(1).max(MAX_TEXT_LENGTH),
});

export const finalizeSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    idempotencyKey: idempotencyKeySchema,
    contact: contactSchema,
  })
  .strict();

export type FinalizePayload = z.infer<typeof finalizeSchema>;

/**
 * The funnel events the product cares about. Anything else is rejected —
 * this is not a general-purpose analytics sink.
 */
export const FUNNEL_EVENT_NAMES = [
  "landing_viewed",
  "diagnostic_started",
  "diagnostic_step_viewed",
  "diagnostic_step_completed",
  "diagnostic_completed",
  "result_viewed",
  "offer_viewed",
  "checkout_clicked",
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENT_NAMES)[number];

/**
 * A deliberately narrow, closed schema: only these four keys are ever
 * accepted, so the client cannot smuggle arbitrary (or sensitive) data
 * into `funnel_events.metadata` no matter what it sends. This is on top
 * of — not instead of — `assertSafeFunnelMetadata`'s key blocklist in the
 * repository layer.
 */
export const funnelMetadataSchema = z
  .object({
    step: z.number().int().min(1).max(8).optional(),
    durationMs: z
      .number()
      .int()
      .min(0)
      .max(24 * 60 * 60 * 1000)
      .optional(),
    resultMode: z.enum(["available", "partial"]).optional(),
    source: z.string().max(50).optional(),
  })
  .strict();

export const funnelEventSchema = z
  .object({
    eventName: z.enum(FUNNEL_EVENT_NAMES),
    diagnosticId: uuidParamSchema.optional(),
    metadata: funnelMetadataSchema.optional(),
  })
  .strict();

export type FunnelEventPayload = z.infer<typeof funnelEventSchema>;
