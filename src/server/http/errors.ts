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
 * leaking internals. `ApiError`s pass through with their intended status.
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
    // Deliberately opaque to the client. The message is logged without any
    // request payload, so nothing personal reaches the logs either.
    console.error("[api] erro não tratado:", error instanceof Error ? error.message : "desconhecido");
    return errorResponse(new ApiError("internal_error", "Erro interno"));
  }
}

/** The 404 used whenever a session doesn't own a resource — never 401/403,
 * so an attacker can't tell "exists but not yours" from "doesn't exist". */
export function notFound(): ApiError {
  return new ApiError("not_found", "Não encontrado");
}
