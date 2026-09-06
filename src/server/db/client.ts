import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: postgres.Sql | null = null;
let database: Database | null = null;

/**
 * Lazily creates the connection pool on first use. Nothing connects at
 * import time, so `next build` (and any route that never touches the
 * database) works without `DATABASE_URL` being set.
 */
export function getDb(): Database {
  if (database) return database;

  const { DATABASE_URL } = getEnv();
  client = postgres(DATABASE_URL, { max: 10 });
  database = drizzle(client, { schema });
  return database;
}

/** Points the module at an explicit connection — used by the test harness. */
export function setDbForTesting(url: string): Database {
  client = postgres(url, { max: 5 });
  database = drizzle(client, { schema });
  return database;
}

export async function closeDb(): Promise<void> {
  await client?.end({ timeout: 5 });
  client = null;
  database = null;
}
