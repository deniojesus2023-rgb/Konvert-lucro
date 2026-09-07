import { z } from "zod";
import { TOKEN_LENGTH } from "@/domain/token/secrets";

export const requestLinkSchema = z
  .object({
    email: z.email().max(254),
  })
  .strict();

export const verifyLoginSchema = z
  .object({
    token: z.string().length(TOKEN_LENGTH).regex(/^[A-Za-z0-9_-]+$/),
  })
  .strict();

export const activateAccountSchema = z
  .object({
    email: z.email().max(254),
    establishmentName: z.string().trim().min(1).max(120),
  })
  .strict();
