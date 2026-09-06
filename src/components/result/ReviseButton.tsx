"use client";

import { Button } from "@/components/ui/Button";
import { useRevise } from "@/lib/client/use-revise";

export function ReviseButton() {
  const { visible, loading, error, reviseNow } = useRevise();

  if (!visible) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="ghost" onClick={() => void reviseNow()} disabled={loading} aria-busy={loading}>
        {loading ? "Abrindo revisão…" : "Revisar minhas respostas"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
