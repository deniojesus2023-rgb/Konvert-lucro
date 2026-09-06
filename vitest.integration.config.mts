import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Integration tests run against a REAL PostgreSQL — never SQLite, never an
 * in-memory stand-in, never a mocked driver. Start one with
 * `pnpm db:test:up`.
 *
 * Files run sequentially: they share one database and truncate between
 * tests, and several of them deliberately exercise row-level locking and
 * concurrent transactions.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.integration.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
