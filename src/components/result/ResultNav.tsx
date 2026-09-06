"use client";

import Link from "next/link";
import { useRevise } from "@/lib/client/use-revise";

interface ResultNavProps {
  /** Total of every resolved cost group, in cents — carried into the offer page. */
  knownCostsTotalCents: number;
}

export function ResultNav({ knownCostsTotalCents }: ResultNavProps) {
  const { visible, loading, reviseNow } = useRevise();

  return (
    <div className="flex items-center gap-3 sm:gap-6">
      {visible && (
        <button
          type="button"
          onClick={() => void reviseNow()}
          disabled={loading}
          className="hidden text-sm text-ink-soft hover:text-ink disabled:opacity-50 sm:inline"
        >
          {loading ? "Abrindo…" : "Revisar respostas"}
        </button>
      )}
      <Link
        href={`/oferta?custos=${knownCostsTotalCents}`}
        className="inline-flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-[8px] bg-blue-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0f5adb]"
      >
        <span className="sm:hidden">Acompanhar</span>
        <span className="hidden sm:inline">Acompanhar meu lucro</span>
      </Link>
    </div>
  );
}
