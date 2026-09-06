"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { reviseDiagnostic } from "./api";
import { loadDraftRef, saveDraftRef } from "./draft-storage";

/**
 * Shared logic behind every "revise my answers" affordance on the result
 * page. Only shown when this browser still has a diagnostic id in
 * localStorage — the private edit session (httpOnly cookie) is what
 * actually authorizes the revision; the public result token this page
 * was loaded with never grants edit access on its own.
 */
export function useRevise() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkStoredDraft() {
      setVisible(loadDraftRef() !== null);
    }
    void checkStoredDraft();
  }, []);

  async function reviseNow() {
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

  return { visible, loading, error, reviseNow };
}
