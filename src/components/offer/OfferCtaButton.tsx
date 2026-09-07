"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { activateAccount, sendFunnelEvent } from "@/lib/client/api";
import { loadDraftRef } from "@/lib/client/draft-storage";

/**
 * Activates a subscriber account from the diagnostic still owned by this
 * browser's session cookie. There's no checkout yet — activation only
 * creates the account and establishment; billing is a later phase.
 */
export function OfferCtaButton() {
  const [email, setEmail] = useState("");
  const [establishmentName, setEstablishmentName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draft = loadDraftRef();

  if (sent) {
    return (
      <div role="status">
        <p>
          <strong>Conta criada!</strong>
        </p>
        <p className="help-text">Confira seu e-mail para acessar o painel.</p>
        {devVerifyUrl && (
          <p className="help-text">
            Ambiente de desenvolvimento —{" "}
            <a href={devVerifyUrl} className="text-link">
              clique aqui para entrar
            </a>
            .
          </p>
        )}
      </div>
    );
  }

  if (!draft) {
    // No draft session in this browser (e.g. a shared/expired link) — fall
    // back to registering interest instead of a dead-end form.
    return (
      <>
        <Button fullWidth onClick={() => sendFunnelEvent({ eventName: "checkout_clicked" })}>
          Começar a acompanhar meu lucro <span aria-hidden="true">→</span>
        </Button>
        <small>Abra esta oferta a partir do seu Raio-X do Lucro para ativar sua conta.</small>
      </>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      sendFunnelEvent({ eventName: "checkout_clicked" });
      const result = await activateAccount(draft!.id, { email, establishmentName });
      setSent(true);
      setDevVerifyUrl(result.devVerifyUrl ?? null);
    } catch {
      setError("Não foi possível ativar sua conta agora. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-group">
        <label htmlFor="establishmentName" className="field-label">
          Nome do seu delivery
        </label>
        <input
          id="establishmentName"
          type="text"
          required
          value={establishmentName}
          onChange={(event) => setEstablishmentName(event.target.value)}
          placeholder="Ex.: Pizzaria da Maria"
          className="line-input small"
        />
      </div>
      <div className="input-group">
        <label htmlFor="activateEmail" className="field-label">
          Seu e-mail
        </label>
        <input
          id="activateEmail"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@exemplo.com"
          className="line-input small"
        />
      </div>
      {error && (
        <p className="question-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth disabled={sending}>
        {sending ? "Ativando…" : "Começar a acompanhar meu lucro"} <span aria-hidden="true">→</span>
      </Button>
      <small>Sem cartão agora. Você confirma o e-mail para acessar o painel.</small>
    </form>
  );
}
