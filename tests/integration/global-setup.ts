import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Integration tests must never be silently skipped. If there's no test
 * database configured, the run FAILS with instructions — a green suite has
 * to mean "these actually ran against PostgreSQL".
 */
export default async function setup() {
  for (const file of [".env.test.local", ".env.local", ".env"]) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
      break;
    }
  }

  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error(
      [
        "",
        "TEST_DATABASE_URL não está definida — os testes de integração NÃO podem rodar.",
        "",
        "Estes testes exigem um PostgreSQL real (nunca SQLite ou banco em memória).",
        "",
        "  1. Suba o banco de teste:  pnpm db:test:up",
        "  2. Exporte a variável:     export TEST_DATABASE_URL=postgres://konvert:konvert@127.0.0.1:55432/konvert_test",
        "     (ou coloque-a em .env.local / .env.test.local)",
        "  3. Rode de novo:           pnpm test:integration",
        "",
      ].join("\n"),
    );
  }

  // Migrations must apply cleanly from whatever state the database is in —
  // including completely empty, which is the CI case.
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./src/server/db/migrations" });
  } catch (error) {
    throw new Error(
      `Falha ao aplicar as migrations no banco de teste: ${
        error instanceof Error ? error.message : "erro desconhecido"
      }`,
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}
