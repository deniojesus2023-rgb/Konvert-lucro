"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { createEstablishment } from "@/lib/client/api";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createEstablishment({ name: name.trim() });
      router.replace("/app");
      router.refresh();
    } catch {
      setError("Não foi possível criar seu estabelecimento agora. Tente novamente.");
      setSaving(false);
    }
  }

  return (
    <>
      <SiteHeader context="Configuração inicial" actionLabel="Sair" actionHref="/entrar" />
      <section className="diagnostic-screen">
        <div className="diagnostic-wrap" style={{ maxWidth: 480 }}>
          <div className="question-meta" style={{ marginBottom: 32 }}>
            <p className="question-number">Antes de começar</p>
            <h1>Qual é o nome do seu delivery?</h1>
            <p>Vamos usar esse nome no seu painel e nos seus relatórios.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="name" className="field-label">
                Nome do delivery
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Burger da Vila"
                className="line-input small"
              />
            </div>
            {error && (
              <p className="question-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Criando…" : "Criar estabelecimento"} <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
