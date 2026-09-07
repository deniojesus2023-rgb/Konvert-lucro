"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DiagnosticProgress } from "./DiagnosticProgress";
import { TOTAL_STEPS } from "./wizard-types";

interface HelperDisclosure {
  summary: string;
  content: ReactNode;
}

interface DiagnosticScreenProps {
  step: number;
  kicker: string;
  heading: string;
  description?: string;
  footnote?: string;
  helper?: HelperDisclosure;
  children: ReactNode;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled: boolean;
  continueBusy?: boolean;
  nextPreview?: string;
  saving: boolean;
  savedMessageVisible: boolean;
  errorMessage: string | null;
  conflictMessage: string | null;
  onExit: () => void;
}

/** The shared question screen: kicker/heading/description on the left, the answer on the right. */
export function DiagnosticScreen({
  step,
  kicker,
  heading,
  description,
  footnote,
  helper,
  children,
  onBack,
  onContinue,
  continueLabel = "Continuar",
  continueDisabled,
  continueBusy,
  nextPreview,
  saving,
  savedMessageVisible,
  errorMessage,
  conflictMessage,
  onExit,
}: DiagnosticScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [heading]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter") return;
    const target = event.target as HTMLElement;
    if (target.closest("details") || target.tagName === "TEXTAREA" || target.tagName === "A") return;
    if (continueDisabled || continueBusy) return;
    event.preventDefault();
    onContinue();
  }

  return (
    <div onKeyDown={handleKeyDown}>
      <SiteHeader context="Raio-X do Lucro" actionLabel="Sair" onAction={onExit} />

      <section className="diagnostic-screen" aria-live="polite">
        <div className="diagnostic-wrap">
          <div className="progress-head">
            <span>
              Etapa {step} de {TOTAL_STEPS}
            </span>
            <span>{saving ? "Salvando…" : savedMessageVisible ? "Resposta salva" : "Rascunho salvo neste dispositivo"}</span>
          </div>
          <DiagnosticProgress current={step} total={TOTAL_STEPS} />

          <div className="question-layout">
            <div className="question-meta">
              <p className="question-number">{kicker}</p>
              <h1 ref={headingRef} tabIndex={-1}>
                {heading}
              </h1>
              {description && <p>{description}</p>}
              {footnote && <p>{footnote}</p>}
              {helper && (
                <details style={{ marginTop: "16px" }}>
                  <summary className="text-link" style={{ cursor: "pointer" }}>
                    {helper.summary}
                  </summary>
                  <p className="help-text">{helper.content}</p>
                </details>
              )}
            </div>

            <div className="question-content">
              {children}

              <p className="question-error" role="alert">
                {errorMessage}
              </p>

              <div className="question-actions">
                <button type="button" className="back-button" onClick={onBack}>
                  {step === 1 ? "Voltar ao início" : "← Voltar"}
                </button>
                <button
                  type="button"
                  className="primary-button continue-button"
                  onClick={onContinue}
                  disabled={continueDisabled || continueBusy}
                  aria-busy={continueBusy}
                >
                  {continueBusy ? "Enviando…" : continueLabel} <span aria-hidden="true">→</span>
                </button>
              </div>

              {conflictMessage && <p className="help-text">{conflictMessage}</p>}
              {nextPreview && <p className="help-text">{nextPreview}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
