"use client";

import { Button } from "./Button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * A simple, honest error message — never a stack trace, SQL, or an
 * internal error code. See `src/lib/client/error-messages.ts` for the
 * approved copy per situation.
 */
export function ErrorState({ message, onRetry, retryLabel = "Tentar de novo" }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 border-l-2 border-red-400 py-4 pl-4 text-center sm:text-left"
    >
      <p className="text-ink">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
