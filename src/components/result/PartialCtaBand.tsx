"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useRevise } from "@/lib/client/use-revise";

export function PartialCtaBand() {
  const { visible, loading, error, reviseNow } = useRevise();

  return (
    <div className="result-cta">
      <div>
        <h2>Complete os pontos cegos e veja o número que importa.</h2>
        <p>Informe os custos que faltam para ter seu lucro, margem e ponto de equilíbrio.</p>
        {error && (
          <p role="alert" className="question-error">
            {error}
          </p>
        )}
      </div>
      <div className="result-cta-actions">
        {visible ? (
          <Button onClick={() => void reviseNow()} disabled={loading} aria-busy={loading}>
            {loading ? "Abrindo…" : "Completar diagnóstico"} <span aria-hidden="true">→</span>
          </Button>
        ) : (
          <Button href="/raio-x">
            Completar diagnóstico <span aria-hidden="true">→</span>
          </Button>
        )}
        <Link href="/oferta" className="text-link">
          Continuar mesmo assim
        </Link>
      </div>
    </div>
  );
}
