import type { NextRequest } from "next/server";
import type { ZodType } from "zod";
import { getEnv } from "@/lib/env";
import { ApiError } from "./errors";

/** 64 KB is far above any legitimate diagnostic payload. */
export const MAX_BODY_BYTES = 64 * 1024;

/**
 * Guards every mutating request before a single byte reaches the services:
 * JSON only, declared content type, bounded body, and an `Origin` that
 * matches the configured app origin when the header is present (browsers
 * always send it on cross-origin writes). There is no CORS allowance —
 * these endpoints are same-origin by design.
 */
export async function readJsonBody<T>(
  request: NextRequest,
  schema: ZodType<T>,
): Promise<T> {
  assertJsonContentType(request);
  assertAllowedOrigin(request);

  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > MAX_BODY_BYTES) {
    throw new ApiError("payload_too_large", "Corpo da requisição muito grande");
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw new ApiError("payload_too_large", "Corpo da requisição muito grande");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw === "" ? "{}" : raw);
  } catch {
    throw new ApiError("invalid_json", "Corpo da requisição não é JSON válido");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    // Only field paths and messages — never the submitted values, which
    // may contain the contact's name or phone number.
    throw new ApiError("validation_failed", "Dados inválidos", {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  return result.data;
}

function assertJsonContentType(request: NextRequest): void {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.toLowerCase().startsWith("application/json")) {
    throw new ApiError("unsupported_media_type", "Envie o corpo como application/json");
  }
}

export function assertAllowedOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  if (!origin) return; // Non-browser clients and same-origin GETs omit it.

  const configured = getEnv().APP_ORIGIN;
  const expected = configured ?? request.nextUrl.origin;

  if (origin !== expected) {
    throw new ApiError("invalid_origin", "Origem não permitida");
  }
}
