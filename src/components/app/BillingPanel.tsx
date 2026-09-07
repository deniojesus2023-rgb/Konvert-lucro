"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { startCheckout, openBillingPortal, type SubscriptionStatusView } from "@/lib/client/api";

interface BillingPanelProps {
  establishmentId: string;
  subscription: SubscriptionStatusView;
}

const STATUS_LABEL: Record<SubscriptionStatusView["status"], string> = {
  none: "Sem assinatura",
  trialing: "Em teste",
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  incomplete: "Incompleta",
};

export function BillingPanel({ establishmentId, subscription }: BillingPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await startCheckout(establishmentId);
      window.location.href = url;
    } catch {
      setError("Não foi possível iniciar o checkout agora.");
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await openBillingPortal(establishmentId);
      window.location.href = url;
    } catch {
      setError("Não foi possível abrir o portal de cobrança agora.");
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="statement-row">
        <span>Assinatura</span>
        <strong>{STATUS_LABEL[subscription.status]}</strong>
      </div>
      {error && (
        <p className="question-error" role="alert">
          {error}
        </p>
      )}
      {subscription.isActive ? (
        <Button onClick={() => void handlePortal()} disabled={loading} fullWidth>
          {loading ? "Abrindo…" : "Gerenciar assinatura"}
        </Button>
      ) : (
        <Button onClick={() => void handleCheckout()} disabled={loading} fullWidth>
          {loading ? "Redirecionando…" : "Assinar agora"}
        </Button>
      )}
    </section>
  );
}
