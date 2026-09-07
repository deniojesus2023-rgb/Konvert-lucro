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
      <div role="status">
        <p>
          <strong>Interesse registrado!</strong>
        </p>
        <p className="help-text">Vamos avisar você assim que o acesso à Konvert estiver disponível.</p>
      </div>
    );
  }

  return (
    <>
      <Button
        fullWidth
        onClick={() => {
          sendFunnelEvent({ eventName: "checkout_clicked" });
          setClicked(true);
        }}
      >
        Começar a acompanhar meu lucro <span aria-hidden="true">→</span>
      </Button>
      <small>A contratação ainda não está disponível. Ao continuar, você registra interesse no lançamento da Konvert.</small>
    </>
  );
}
