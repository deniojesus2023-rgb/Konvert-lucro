import { z } from "zod";
import { centsSchema, orderCountSchema } from "./diagnostic-schemas";

/** ISO calendar date `YYYY-MM-DD` — no time component, no timezone offset. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Data inválida");

export const MAX_CHANNEL_NAME_LENGTH = 60;

export const dailyEntrySchema = z
  .object({
    entryDate: isoDateSchema,
    /** Omitted or null means the entry isn't split by channel. */
    channelName: z.string().trim().min(1).max(MAX_CHANNEL_NAME_LENGTH).nullable().optional(),
    grossRevenueCents: centsSchema,
    ordersCount: orderCountSchema,
    discountsCents: centsSchema,
    cancellationsCents: centsSchema,
    knownFeesCents: centsSchema,
    /** Present only when updating an existing entry (optimistic lock). */
    expectedVersion: z.number().int().min(0).optional(),
  })
  .strict();

export type DailyEntryPayload = z.infer<typeof dailyEntrySchema>;

export const periodQuerySchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
  })
  .strict()
  .refine((data) => data.from <= data.to, { message: "O início do período deve ser antes do fim", path: ["from"] });

/** First day of a calendar month — `goals.period_start`. */
export const monthStartSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-01$/, "Informe o primeiro dia do mês")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Data inválida");

export const MAX_MARGIN_GOAL_BPS = 10_000;

export const goalSchema = z
  .object({
    periodStart: monthStartSchema,
    profitGoalCents: centsSchema.nullable().optional(),
    revenueGoalCents: centsSchema.nullable().optional(),
    marginGoalBps: z.number().int().min(0).max(MAX_MARGIN_GOAL_BPS).nullable().optional(),
  })
  .strict();

export type GoalPayload = z.infer<typeof goalSchema>;

export const MAX_RECURRING_COST_NAME_LENGTH = 120;

export const recurringCostSchema = z
  .object({
    categoryName: z.string().trim().min(1).max(MAX_CHANNEL_NAME_LENGTH),
    name: z.string().trim().min(1).max(MAX_RECURRING_COST_NAME_LENGTH),
    amountCents: centsSchema,
    frequency: z.enum(["monthly", "weekly"]),
    startDate: isoDateSchema,
    endDate: isoDateSchema.nullable().optional(),
  })
  .strict()
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "A data final deve ser depois da inicial",
    path: ["endDate"],
  });

export type RecurringCostPayload = z.infer<typeof recurringCostSchema>;
