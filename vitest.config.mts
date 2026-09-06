import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests: pure logic, no database, no network. Integration tests live
 * in `*.integration.test.ts` and run through `vitest.integration.config.mts`
 * against a real PostgreSQL.
 *
 * Component tests (`*.test.tsx`, React Testing Library) need a DOM: each
 * one opts in with a `// @vitest-environment jsdom` docblock at the top of
 * the file. Everything else (`*.test.ts`) stays under the lighter `node`
 * environment set as the default below.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["**/*.integration.test.ts", "**/node_modules/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
