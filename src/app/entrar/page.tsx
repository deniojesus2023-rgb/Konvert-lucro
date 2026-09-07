"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { requestMagicLink } from "@/lib/client/auth-api";

export default function EntrarPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const result = await requestMagicLink(email);
      setSent(true);
      setDevVerifyUrl(result.devVerifyUrl ?? null);
    } catch {
      setError("Não foi possível enviar o link agora. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <SiteHeader context="Entrar" actionLabel="Voltar ao início" actionHref="/" />

      <section className="diagnostic-screen">
        <div className="diagnostic-wrap" style={{ maxWidth: 480 }}>
          <div className="question-meta" style={{ marginBottom: 32 }}>
            <p className="question-number">Acesso</p>
            <h1>Entrar na sua conta</h1>
            <p>Digite seu e-mail e enviaremos um link para entrar — sem senha.</p>
          </div>

          {sent ? (
            <div>
              <p className="help-text">{"Se o e-mail existir, enviaremos um link de acesso."}</p>
              {devVerifyUrl && (
                <p className="help-text">
                  Ambiente de desenvolvimento —{" "}
                  <Link href={devVerifyUrl} className="text-link">
                    clique aqui para entrar
                  </Link>
                  .
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email" className="field-label">
                  E-mail
                </label>
                <input
                  id="email"
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
              <button type="submit" className="primary-button" disabled={sending}>
                {sending ? "Enviando…" : "Enviar link de acesso"} <span aria-hidden="true">→</span>
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
