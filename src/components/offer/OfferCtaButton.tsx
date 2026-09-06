"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { sendFunnelEvent } from "@/lib/client/api";

/**
 * There is no checkout yet: clicking only records interest and shows a
 * confirmation — no payment form, no card request, no promise of
 * immediate access.
 */
export function OfferCtaButton() {
  const [clicked, setClicked] = useState(false);

  if (clicked) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-blue-light bg-blue-light/40 p-6 text-center"
      >
        <p className="font-semibold text-navy">Interesse registrado!</p>
        <p className="mt-1 text-sm text-navy/70">
          Vamos avisar você assim que o acesso à Konvert estiver disponível.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        onClick={() => {
          sendFunnelEvent({ eventName: "checkout_clicked" });
          setClicked(true);
        }}
      >
        Quero acompanhar meu lucro
      </Button>
      <p className="max-w-md text-center text-sm text-navy/60">
        A contratação ainda não está disponível. Ao continuar, você registra interesse no
        lançamento da Konvert.
      </p>
    </div>
  );
}
