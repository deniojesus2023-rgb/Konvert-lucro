"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useRevise } from "@/lib/client/use-revise";

export function PartialCtaBand() {
  const { visible, loading, error, reviseNow } = useRevise();

  return (
    <section className="-mx-6 flex flex-col gap-4 bg-ink px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          Complete os pontos cegos e veja o número que importa.
        </h2>
        <p className="text-white/70">
          Informe os custos que faltam para ter seu lucro, margem e ponto de equilíbrio.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-200">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-6">
        {visible ? (
          <Button onClick={() => void reviseNow()} disabled={loading} aria-busy={loading}>
            {loading ? "Abrindo…" : "Completar diagnóstico"} <span aria-hidden="true">→</span>
          </Button>
        ) : (
          <Button href="/raio-x">
            Completar diagnóstico <span aria-hidden="true">→</span>
          </Button>
        )}
        <Link href="/oferta" className="whitespace-nowrap text-sm text-white/80 underline hover:text-white">
          Continuar mesmo assim
        </Link>
      </div>
    </section>
  );
}
