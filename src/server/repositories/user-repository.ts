import { eq } from "drizzle-orm";
import { users } from "@/server/db/schema";
import type { Executor } from "./diagnostic-repository";

export interface UserRow {
  id: string;
  email: string;
  passwordHash: string | null;
  leadId: string | null;
  emailVerifiedAt: Date | null;
  sessionHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function insertUser(
  db: Executor,
  input: { email: string; leadId?: string | null },
): Promise<UserRow> {
  const [row] = await db
    .insert(users)
    .values({ email: input.email, leadId: input.leadId ?? null })
    .returning();
  return row;
}

export async function findUserByEmail(db: Executor, email: string): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

export async function findUserById(db: Executor, id: string): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function markEmailVerified(db: Executor, id: string): Promise<void> {
  await db.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id));
}

/** Overwrites any previous session — logging in elsewhere invalidates the old one. */
export async function setUserSessionHash(db: Executor, id: string, sessionHash: string): Promise<void> {
  await db.update(users).set({ sessionHash, updatedAt: new Date() }).where(eq(users.id, id));
}

export async function findUserBySessionHash(db: Executor, sessionHash: string): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.sessionHash, sessionHash)).limit(1);
  return row ?? null;
}
