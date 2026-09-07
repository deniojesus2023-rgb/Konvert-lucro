import { hashSessionSecret } from "@/domain/token/secrets";
import { getDb } from "@/server/db/client";
import { findUserBySessionHash, type UserRow } from "@/server/repositories/user-repository";

/** Resolves the app session cookie's secret to a user row, or null if absent/invalid. */
export async function getCurrentUser(sessionSecret: string | null): Promise<UserRow | null> {
  if (!sessionSecret) return null;
  return findUserBySessionHash(getDb(), hashSessionSecret(sessionSecret));
}
