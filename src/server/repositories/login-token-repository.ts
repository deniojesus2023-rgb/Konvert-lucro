import { and, eq, gt, isNull } from "drizzle-orm";
import { loginTokens } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

export interface LoginTokenRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export async function insertLoginToken(
  db: Executor,
  input: { userId: string; tokenHash: string; expiresAt: Date },
): Promise<LoginTokenRow> {
  const [row] = await db
    .insert(loginTokens)
    .values({ userId: input.userId, tokenHash: input.tokenHash, expiresAt: input.expiresAt })
    .returning();
  return row;
}

/** Only a token that hasn't been used and hasn't expired counts as valid. */
export async function findValidLoginToken(db: Executor, tokenHash: string): Promise<LoginTokenRow | null> {
  const [row] = await db
    .select()
    .from(loginTokens)
    .where(and(eq(loginTokens.tokenHash, tokenHash), isNull(loginTokens.consumedAt), gt(loginTokens.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

export async function markLoginTokenConsumed(db: Executor, id: string): Promise<void> {
  await db.update(loginTokens).set({ consumedAt: new Date() }).where(eq(loginTokens.id, id));
}
