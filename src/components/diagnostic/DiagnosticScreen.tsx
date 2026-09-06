"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
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
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled: boolean;
  continueBusy?: boolean;
  nextPreview?: string;
  saving: boolean;
  savedMessageVisible: boolean;
  errorMessage: string | null;
  conflictMessage: string | null;
}

/**
 * The shared question screen: a two-column editorial layout on desktop
 * (kicker/heading/description on the left, the answer on the right)
 * collapsing to one stacked column on mobile. One question per screen —
 * the 8-step progress in the footer tracks the macro step, several
 * screens can share the same segment (e.g. "Estrutura" has three).
 */
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
    <div className="flex min-h-full flex-col bg-canvas" onKeyDown={handleKeyDown}>
      <header className="border-b border-line px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-auto" />
            <span className="text-ink-faint">/</span>
            <span className="text-sm text-ink-soft">Raio-X do Lucro</span>
          </div>
          <Link href="/" className="text-sm text-ink-soft hover:text-ink">
            Sair
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10 sm:py-14">
        <div className="grid flex-1 grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium tracking-wide text-blue-primary">{kicker}</p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-3xl font-semibold leading-[1.1] text-ink outline-none sm:text-4xl lg:text-[2.75rem]"
            >
              {heading}
            </h1>
            {description && <p className="text-lg text-ink-soft">{description}</p>}
            {footnote && <p className="text-ink-faint">{footnote}</p>}
            {helper && (
              <details className="group mt-2">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink [&::-webkit-details-marker]:hidden">
                  {helper.summary}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
                    fill="none"
                  >
                    <path
                      d="M5 7.5l5 5 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <div className="mt-3 max-w-sm text-sm text-ink-soft">{helper.content}</div>
              </details>
            )}
          </div>

          <div className="flex flex-col gap-8">
            {children}

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <Button
                  onClick={onContinue}
                  disabled={continueDisabled || continueBusy}
                  aria-busy={continueBusy}
                >
                  {continueBusy ? "Enviando…" : continueLabel}
                  <span aria-hidden="true">→</span>
                </Button>
                <span className="hidden text-sm text-ink-faint sm:inline">Enter ↵</span>
              </div>

              <div aria-live="polite" className="min-h-[1.25rem] text-sm">
                {saving && <span className="text-ink-faint">Salvando…</span>}
                {!saving && savedMessageVisible && <span className="text-blue-primary">Resposta salva</span>}
                {conflictMessage && <span className="text-ink-soft">{conflictMessage}</span>}
              </div>

              {errorMessage && (
                <p role="alert" className="text-sm text-red-600">
                  {errorMessage}
                </p>
              )}

              {nextPreview && <p className="text-sm text-ink-faint">{nextPreview}</p>}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-line px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
            >
              <span aria-hidden="true">←</span> Voltar
            </button>
          ) : (
            <span />
          )}
          <div className="flex flex-col items-center gap-1.5">
            <DiagnosticProgress current={step} total={TOTAL_STEPS} />
            <span className="text-xs text-ink-faint">
              Etapa {step} de {TOTAL_STEPS}
            </span>
          </div>
          <span className="text-xs text-ink-faint">Rascunho salvo</span>
        </div>
      </footer>
    </div>
  );
}
