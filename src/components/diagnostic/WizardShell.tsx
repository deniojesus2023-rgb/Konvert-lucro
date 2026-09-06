"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { TOTAL_STEPS } from "./wizard-types";

interface WizardShellProps {
  step: number;
  title: string;
  children: ReactNode;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled: boolean;
  continueBusy?: boolean;
  saving: boolean;
  savedMessageVisible: boolean;
  errorMessage: string | null;
  conflictMessage: string | null;
}

/**
 * The shared wizard chrome: small logo, "Raio-X do Lucro" label, real
 * progress, step title (focused on step change for screen readers), and
 * back/continue navigation. Autosave feedback and errors surface here via
 * a single `aria-live` region so the layout doesn't shift.
 */
export function WizardShell({
  step,
  title,
  children,
  onBack,
  onContinue,
  continueLabel = "Continuar",
  continueDisabled,
  continueBusy,
  saving,
  savedMessageVisible,
  errorMessage,
  conflictMessage,
}: WizardShellProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, [step]);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="border-b border-blue-light px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Logo className="h-6 w-auto" />
          <span className="text-sm font-medium text-navy/60">Raio-X do Lucro</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
        <Progress current={step} total={TOTAL_STEPS} />

        <h1
          ref={titleRef}
          tabIndex={-1}
          className="text-2xl font-semibold text-navy outline-none sm:text-3xl"
        >
          {title}
        </h1>

        <div className="flex-1">{children}</div>

        <div aria-live="polite" className="min-h-[1.5rem] text-sm">
          {saving && <p className="text-navy/60">Salvando…</p>}
          {!saving && savedMessageVisible && <p className="text-blue-primary">Resposta salva</p>}
          {conflictMessage && <p className="text-navy/80">{conflictMessage}</p>}
        </div>

        {errorMessage && (
          <p role="alert" className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        <div className="sticky bottom-0 flex gap-3 bg-white pb-2 pt-4">
          {onBack && (
            <Button variant="secondary" onClick={onBack} disabled={continueBusy}>
              Voltar
            </Button>
          )}
          <Button
            fullWidth
            onClick={onContinue}
            disabled={continueDisabled || continueBusy}
            aria-busy={continueBusy}
          >
            {continueBusy ? "Enviando…" : continueLabel}
          </Button>
        </div>
      </main>
    </div>
  );
}
