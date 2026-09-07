"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { verifyMagicLink } from "@/lib/client/auth-api";

export default function VerificarPage() {
  return (
    <Suspense fallback={<LoadingState label="Entrando…" />}>
      <VerificarContent />
    </Suspense>
  );
}

function VerificarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    Promise.resolve(token)
      .then((value) => {
        if (!value) throw new Error("missing_token");
        return verifyMagicLink(value);
      })
      .then(() => router.replace("/app"))
      .catch((thrown: unknown) => {
        const missing = thrown instanceof Error && thrown.message === "missing_token";
        setError(missing ? "Link inválido." : "Este link é inválido ou já expirou. Peça um novo.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <SiteHeader context="Entrar" actionLabel="Voltar ao início" actionHref="/" />
      <section className="diagnostic-screen">
        <div className="diagnostic-wrap" style={{ maxWidth: 480 }}>
          {error ? (
            <ErrorState message={error} onRetry={() => router.push("/entrar")} retryLabel="Pedir novo link" />
          ) : (
            <LoadingState label="Entrando…" />
          )}
        </div>
      </section>
    </>
  );
}
