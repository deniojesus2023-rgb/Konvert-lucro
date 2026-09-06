"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { reviseDiagnostic } from "@/lib/client/api";
import { loadDraftRef, saveDraftRef } from "@/lib/client/draft-storage";

/**
 * Only shown when this browser still has a diagnostic id in
 * localStorage — the private edit session (httpOnly cookie) is what
 * actually authorizes the revision; the public result token this page
 * was loaded with never grants edit access on its own.
 */
export function ReviseButton() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reading localStorage only after mount avoids a server/client
    // hydration mismatch (the server has no `window` at all).
    async function checkStoredDraft() {
      setVisible(loadDraftRef() !== null);
    }
    void checkStoredDraft();
  }, []);

  if (!visible) return null;

  async function handleClick() {
    const stored = loadDraftRef();
    if (!stored) return;

    setLoading(true);
    setError(null);
    try {
      const revision = await reviseDiagnostic(stored.id);
      saveDraftRef({ id: revision.id, step: 1, answersVersion: revision.answersVersion });
      router.push("/raio-x");
    } catch {
      setError("Não foi possível abrir a revisão agora. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="ghost" onClick={handleClick} disabled={loading} aria-busy={loading}>
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
