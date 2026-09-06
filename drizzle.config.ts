import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so it doesn't get .env loading for free.
// Node 22 can load it natively — no `dotenv` dependency needed.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
    break;
  }
}

const url = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;

if (!url) {
  throw new Error(
    "Defina DATABASE_URL (ou TEST_DATABASE_URL) antes de rodar o drizzle-kit. Veja .env.example.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
