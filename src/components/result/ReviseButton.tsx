"use client";

import { useRevise } from "@/lib/client/use-revise";

export function ReviseButton() {
  const { visible, loading, error, reviseNow } = useRevise();

  if (!visible) return null;

  return (
    <>
      <button type="button" className="text-link" onClick={() => void reviseNow()} disabled={loading} aria-busy={loading}>
        {loading ? "Abrindo revisão…" : "Revisar minhas respostas"}
      </button>
      {error && (
        <p role="alert" className="question-error">
          {error}
        </p>
      )}
    </>
  );
}
