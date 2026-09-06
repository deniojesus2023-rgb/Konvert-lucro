import type { NextRequest } from "next/server";
import { ApiError } from "@/server/http/errors";

/**
 * PROVISIONAL, DEVELOPMENT-ONLY rate limiter.
 *
 * The counters live in the memory of a single process. That means it does
 * NOT protect a production deployment: every serverless invocation or
 * horizontally-scaled instance keeps its own map, so the effective limit
 * multiplies by the number of instances and resets on every cold start.
 * It also keys off a client-supplied `x-forwarded-for` when present, which
 * is spoofable without a trusted proxy in front.
 *
 * Treat it as a speed bump against accidental loops in development. Real
 * protection needs a shared store (Redis/Upstash) or an edge/WAF rule, and
 * is explicitly out of scope for this phase — see README "Limitações".
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function enforceRateLimit(request: NextRequest): void {
  const key = clientKey(request);
  const now = Date.now();
  const current = windows.get(key);

  if (!current || now >= current.resetAt) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  current.count += 1;
  if (current.count > MAX_REQUESTS_PER_WINDOW) {
    throw new ApiError("rate_limited", "Muitas requisições. Tente novamente em instantes.");
  }
}

/** Test helper — the map is process-global state. */
export function resetRateLimit(): void {
  windows.clear();
}
