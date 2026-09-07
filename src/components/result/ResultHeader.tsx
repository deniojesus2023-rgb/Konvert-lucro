"use client";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { useRevise } from "@/lib/client/use-revise";

/** The result screen's header — "Revisar respostas" either reopens the stored draft or falls back to a fresh diagnostic. */
export function ResultHeader() {
  const { visible, reviseNow } = useRevise();

  if (visible) {
    return <SiteHeader context="Raio-X do Lucro" actionLabel="Revisar respostas" onAction={() => void reviseNow()} />;
  }
  return <SiteHeader context="Raio-X do Lucro" actionLabel="Revisar respostas" actionHref="/raio-x" />;
}
