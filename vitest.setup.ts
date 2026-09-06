import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Our vitest config doesn't enable `globals: true`, so React Testing
// Library's automatic cleanup (which relies on finding a global
// `afterEach`) never registers. Wire it explicitly, or component tests in
// the same file leak DOM nodes across `it()` blocks — the leaked node
// from a previous test's render(...) collides with the next test's query
// and made e.g. `getByRole("radio", { name: ... })` match twice.
afterEach(() => {
  cleanup();
});
