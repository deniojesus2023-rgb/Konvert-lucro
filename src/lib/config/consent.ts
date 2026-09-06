/**
 * Single source of truth for the consent text version. The server default
 * in `src/lib/env.ts` reads this same constant, and the wizard's capture
 * step sends it verbatim on finalize — so the two can never drift apart
 * silently. If the wording of the consent text ever changes, bump this
 * value (and it flows to both sides automatically).
 */
export const CONSENT_TEXT_VERSION = "2026-09-06.v1";
