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
      <div role="status" className="border-l-2 border-blue-primary py-2 pl-4">
        <p className="font-semibold text-ink">Interesse registrado!</p>
        <p className="mt-1 text-sm text-ink-soft">
          Vamos avisar você assim que o acesso à Konvert estiver disponível.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        fullWidth
        onClick={() => {
          sendFunnelEvent({ eventName: "checkout_clicked" });
          setClicked(true);
        }}
      >
        Começar a acompanhar meu lucro <span aria-hidden="true">→</span>
      </Button>
      <p className="text-xs text-ink-faint">
        A contratação ainda não está disponível. Ao continuar, você registra interesse no
        lançamento da Konvert.
      </p>
    </div>
  );
}
