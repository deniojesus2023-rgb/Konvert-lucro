import { z } from "zod";

export const MAX_ESTABLISHMENT_NAME_LENGTH = 120;

export const createEstablishmentSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_ESTABLISHMENT_NAME_LENGTH),
  })
  .strict();

export type CreateEstablishmentPayload = z.infer<typeof createEstablishmentSchema>;
