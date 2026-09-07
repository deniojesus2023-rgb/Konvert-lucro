import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Standardized error envelope. Responses never carry a stack trace, a SQL
 * message, a driver detail or any echo of the personal data in the
 * request — only a stable machine-readable code and a short human message.
 */
export type ApiErrorCode =
  | "not_found"
  | "invalid_json"
  | "unsupported_media_type"
  | "payload_too_large"
  | "invalid_origin"
  | "validation_failed"
  | "version_conflict"
  | "already_completed"
  | "not_completed"
  | "incomplete_diagnostic"
  | "rate_limited"
  | "unauthorized"
  | "invalid_signature"
  | "internal_error";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  not_found: 404,
  invalid_json: 400,
  unsupported_media_type: 415,
  payload_too_large: 413,
  invalid_origin: 403,
  validation_failed: 422,
  version_conflict: 409,
  already_completed: 409,
  not_completed: 409,
  incomplete_diagnostic: 422,
  rate_limited: 429,
  unauthorized: 401,
  invalid_signature: 400,
  internal_error: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: ApiErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

export function errorResponse(error: ApiError): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    },
    { status: STATUS_BY_CODE[error.code], headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Wraps a handler so an unexpected throw becomes a generic 500 instead of
 * leaking internals. `ApiError`s pass through with their intended status
 * (they carry only messages this codebase wrote itself, never a driver's).
 *
 * An UNEXPECTED error (a bug, a database failure) is a different story:
 * `error.message` can be a Drizzle/postgres.js message that embeds raw SQL,
 * bind parameters, a constraint name — anything the failing query touched,
 * which may well be the contact's name or WhatsApp. `error.stack` can
 * reveal file paths and internals. Neither ever reaches the client NOR the
 * log — only a fixed, constant string. A random `correlationId` (no user
 * data, safe to log and to return) is the only thing that varies, so a
 * report from the client can still be cross-referenced with the log line.
 */
export async function handleRoute(
  run: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error);
    }
    const correlationId = randomUUID();
    console.error("[api] erro interno não tratado", { correlationId });
    return errorResponse(new ApiError("internal_error", "Erro interno", { correlationId }));
  }
}

/** The 404 used whenever a session doesn't own a resource — never 401/403,
 * so an attacker can't tell "exists but not yours" from "doesn't exist". */
export function notFound(): ApiError {
  return new ApiError("not_found", "Não encontrado");
}

/** No app session at all — distinct from `notFound()`, which guards
 * ownership of a specific resource once a caller is authenticated. */
export function unauthorized(): ApiError {
  return new ApiError("unauthorized", "Não autenticado");
}
