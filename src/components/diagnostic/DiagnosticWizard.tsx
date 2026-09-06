"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiRequestError,
  createDraft,
  finalizeDiagnostic,
  getDraft,
  patchAnswers,
  sendFunnelEvent,
} from "@/lib/client/api";
import {
  clearDraftRef,
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
  loadDraftRef,
  saveDraftRef,
} from "@/lib/client/draft-storage";
import { ERROR_MESSAGES } from "@/lib/client/error-messages";
import { CONSENT_TEXT_VERSION } from "@/lib/config/consent";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { WizardShell } from "./WizardShell";
import { hydrateAnswers, hydrateProfile } from "./hydrate-draft";
import {
  emptyDraftAnswers,
  isMoneyFieldComplete,
  taxesNeedClassification,
  TOTAL_STEPS,
  type DraftAnswers,
  type ProfileAnswers,
  type TaxClassification,
} from "./wizard-types";
import { ProfileStep, PROFILE_STEP_META } from "./steps/ProfileStep";
import { SalesStep, SALES_STEP_META } from "./steps/SalesStep";
import { ProductionStep, PRODUCTION_STEP_META } from "./steps/ProductionStep";
import { FeesStep, FEES_STEP_META } from "./steps/FeesStep";
import { DeliveryStep, DELIVERY_STEP_META } from "./steps/DeliveryStep";
import { StructureStep, STRUCTURE_STEP_META } from "./steps/StructureStep";
import { GoalStep, GOAL_STEP_META } from "./steps/GoalStep";
import {
  CaptureStep,
  CAPTURE_STEP_META,
  emptyContactFormState,
  isContactFormComplete,
  type ContactFormState,
} from "./steps/CaptureStep";

type Phase = "initializing" | "ready" | "error";

const STARTED_AT_STORAGE_KEY = "konvert:raiox:started-at";

export function DiagnosticWizard() {
  const router = useRouter();
  const initRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("initializing");
  const [fatalError, setFatalError] = useState<string | null>(null);

  const [diagnosticId, setDiagnosticId] = useState<string | null>(null);
  const [answersVersion, setAnswersVersion] = useState(0);
  const [step, setStep] = useState(1);

  const [answers, setAnswers] = useState<DraftAnswers>(emptyDraftAnswers());
  const [profile, setProfile] = useState<ProfileAnswers>({ deliveryType: null, mainChannel: null });
  const [taxClassification, setTaxClassification] = useState<TaxClassification | null>(null);
  const [contact, setContact] = useState<ContactFormState>(emptyContactFormState());

  const [saving, setSaving] = useState(false);
  const [savedMessageVisible, setSavedMessageVisible] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // --- Initialization / resume -----------------------------------------
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    setPhase("initializing");
    setFatalError(null);

    const stored = loadDraftRef();
    if (stored) {
      try {
        const draft = await getDraft(stored.id);

        if (draft.status === "completed" && draft.resultPath) {
          router.replace(draft.resultPath);
          return;
        }

        setDiagnosticId(draft.id);
        setAnswersVersion(draft.answersVersion);
        setAnswers(hydrateAnswers(draft.answers));
        setProfile(hydrateProfile(draft));
        setTaxClassification((draft.taxClassification as TaxClassification | null) ?? null);
        setStep(clampStep(stored.step));
        setPhase("ready");
        return;
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) {
          clearDraftRef();
          // Falls through to create a brand-new draft below.
        } else {
          setFatalError(ERROR_MESSAGES.generic);
          setPhase("error");
          return;
        }
      }
    }

    try {
      const created = await createDraft();
      saveDraftRef({ id: created.id, step: 1, answersVersion: created.answersVersion });
      setDiagnosticId(created.id);
      setAnswersVersion(created.answersVersion);
      setStep(1);
      setPhase("ready");
      try {
        window.sessionStorage.setItem(STARTED_AT_STORAGE_KEY, String(Date.now()));
      } catch {
        // Timing is a nice-to-have for Fase 1D, not essential.
      }
      sendFunnelEvent({ eventName: "diagnostic_started", diagnosticId: created.id });
    } catch {
      setFatalError(ERROR_MESSAGES.generic);
      setPhase("error");
    }
  }

  useEffect(() => {
    if (phase !== "ready" || !diagnosticId) return;
    sendFunnelEvent({
      eventName: "diagnostic_step_viewed",
      diagnosticId,
      metadata: { step },
    });
  }, [phase, step, diagnosticId]);

  // --- Recovery from a 409 (stale expectedVersion) ----------------------
  async function recoverFromConflict(): Promise<boolean> {
    if (!diagnosticId) return false;
    try {
      const fresh = await getDraft(diagnosticId);
      setAnswersVersion(fresh.answersVersion);
      setAnswers(hydrateAnswers(fresh.answers));
      setProfile(hydrateProfile(fresh));
      setTaxClassification((fresh.taxClassification as TaxClassification | null) ?? null);
      saveDraftRef({ id: diagnosticId, step, answersVersion: fresh.answersVersion });
      setConflictMessage(ERROR_MESSAGES.conflictRecovered);
      return true;
    } catch {
      setStepError(ERROR_MESSAGES.saveFailed);
      return false;
    }
  }

  async function handleSessionExpired() {
    clearDraftRef();
    clearIdempotencyKey();
    setDiagnosticId(null);
    initRef.current = false;
    await init();
  }

  // --- Step navigation ----------------------------------------------------
  async function saveCurrentStepAndAdvance(payload: {
    answers?: Record<string, unknown>;
    profile?: ProfileAnswers;
    taxClassification?: TaxClassification;
  }) {
    if (!diagnosticId) return;
    setStepError(null);
    setConflictMessage(null);
    setSaving(true);

    try {
      const result = await patchAnswers(diagnosticId, {
        expectedVersion: answersVersion,
        ...(payload.answers ? { answers: payload.answers } : {}),
        ...(payload.profile
          ? { profile: { deliveryType: payload.profile.deliveryType, mainChannel: payload.profile.mainChannel } }
          : {}),
        ...(payload.taxClassification ? { taxClassification: payload.taxClassification } : {}),
      });

      setAnswersVersion(result.answersVersion);
      const nextStep = Math.min(step + 1, TOTAL_STEPS);
      saveDraftRef({ id: diagnosticId, step: nextStep, answersVersion: result.answersVersion });
      sendFunnelEvent({ eventName: "diagnostic_step_completed", diagnosticId, metadata: { step } });

      setSavedMessageVisible(true);
      window.setTimeout(() => setSavedMessageVisible(false), 2000);
      setStep(nextStep);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 404) {
          await handleSessionExpired();
          return;
        }
        if (error.code === "version_conflict") {
          await recoverFromConflict();
          setSaving(false);
          return;
        }
        if (error.code === "already_completed") {
          // The diagnostic was finalized elsewhere (another tab). Send the
          // user to their result instead of a dead-end error.
          const fresh = await getDraft(diagnosticId).catch(() => null);
          if (fresh?.resultPath) {
            router.replace(fresh.resultPath);
            return;
          }
        }
      }
      setStepError(ERROR_MESSAGES.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    setStepError(null);
    setConflictMessage(null);
    setStep((current) => Math.max(1, current - 1));
    if (diagnosticId) saveDraftRef({ id: diagnosticId, step: Math.max(1, step - 1), answersVersion });
  }

  // --- Finalize ------------------------------------------------------------
  const [finalizing, setFinalizing] = useState(false);

  async function handleFinalize() {
    if (!diagnosticId) return;
    setStepError(null);
    setFinalizing(true);

    const idempotencyKey = getOrCreateIdempotencyKey();

    try {
      const result = await finalizeDiagnostic(diagnosticId, {
        expectedVersion: answersVersion,
        idempotencyKey,
        contact: {
          name: contact.name.trim(),
          whatsapp: contact.whatsapp,
          contactConsent: true,
          marketingOptIn: contact.marketingOptIn,
          consentTextVersion: CONSENT_TEXT_VERSION,
        },
      });

      clearIdempotencyKey();
      saveDraftRef({ id: diagnosticId, step: TOTAL_STEPS, answersVersion });

      const startedAtRaw = safeSessionStorageGet(STARTED_AT_STORAGE_KEY);
      const durationMs = startedAtRaw ? Date.now() - Number(startedAtRaw) : undefined;
      sendFunnelEvent({
        eventName: "diagnostic_completed",
        diagnosticId,
        metadata: durationMs && Number.isFinite(durationMs) ? { durationMs } : undefined,
      });
      try {
        window.sessionStorage.removeItem(STARTED_AT_STORAGE_KEY);
      } catch {
        // Non-essential cleanup.
      }

      router.push(result.resultPath);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 404) {
          await handleSessionExpired();
          return;
        }
        if (error.code === "version_conflict") {
          const recovered = await recoverFromConflict();
          setFinalizing(false);
          if (recovered) {
            setStepError(null);
          }
          return;
        }
      }
      setStepError(ERROR_MESSAGES.finalizeFailed);
      setFinalizing(false);
    }
  }

  // --- Render ---------------------------------------------------------------
  if (phase === "initializing") {
    return <LoadingState label="Preparando seu diagnóstico…" />;
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <ErrorState message={fatalError ?? ERROR_MESSAGES.generic} onRetry={() => void init()} />
      </div>
    );
  }

  const stepConfig = getStepConfig(step, {
    answers,
    profile,
    taxClassification,
    contact,
  });

  return (
    <WizardShell
      step={step}
      title={stepConfig.title}
      onBack={step > 1 ? goBack : undefined}
      onContinue={stepConfig.onContinue}
      continueLabel={step === TOTAL_STEPS ? "Ver meu resultado" : "Continuar"}
      continueDisabled={!stepConfig.complete}
      continueBusy={step === TOTAL_STEPS ? finalizing : saving}
      saving={saving}
      savedMessageVisible={savedMessageVisible}
      errorMessage={stepError}
      conflictMessage={conflictMessage}
    >
      {stepConfig.content}
    </WizardShell>
  );

  function getStepConfig(
    current: number,
    state: {
      answers: DraftAnswers;
      profile: ProfileAnswers;
      taxClassification: TaxClassification | null;
      contact: ContactFormState;
    },
  ): { title: string; content: React.ReactNode; complete: boolean; onContinue: () => void } {
    switch (current) {
      case 1:
        return {
          title: PROFILE_STEP_META.title,
          content: <ProfileStep profile={state.profile} onChange={setProfile} />,
          complete: Boolean(state.profile.deliveryType && state.profile.mainChannel),
          onContinue: () => void saveCurrentStepAndAdvance({ profile: state.profile }),
        };
      case 2:
        return {
          title: SALES_STEP_META.title,
          content: (
            <SalesStep
              revenue={state.answers.revenue}
              orders={state.answers.orders}
              onRevenueChange={(value) => setAnswers((prev) => ({ ...prev, revenue: value }))}
              onOrdersChange={(value) => setAnswers((prev) => ({ ...prev, orders: value }))}
            />
          ),
          complete:
            isMoneyFieldComplete(state.answers.revenue) && state.answers.orders !== null,
          onContinue: () =>
            void saveCurrentStepAndAdvance({
              answers: { revenue: state.answers.revenue, orders: state.answers.orders },
            }),
        };
      case 3:
        return {
          title: PRODUCTION_STEP_META.title,
          content: (
            <ProductionStep
              value={state.answers.cost_production}
              onChange={(value) => setAnswers((prev) => ({ ...prev, cost_production: value }))}
            />
          ),
          complete: isMoneyFieldComplete(state.answers.cost_production),
          onContinue: () =>
            void saveCurrentStepAndAdvance({
              answers: { cost_production: state.answers.cost_production },
            }),
        };
      case 4:
        return {
          title: FEES_STEP_META.title,
          content: (
            <FeesStep
              value={state.answers.cost_fees}
              onChange={(value) => setAnswers((prev) => ({ ...prev, cost_fees: value }))}
            />
          ),
          complete: isMoneyFieldComplete(state.answers.cost_fees),
          onContinue: () =>
            void saveCurrentStepAndAdvance({ answers: { cost_fees: state.answers.cost_fees } }),
        };
      case 5:
        return {
          title: DELIVERY_STEP_META.title,
          content: (
            <DeliveryStep
              value={state.answers.cost_delivery}
              onChange={(value) => setAnswers((prev) => ({ ...prev, cost_delivery: value }))}
            />
          ),
          complete: isMoneyFieldComplete(state.answers.cost_delivery),
          onContinue: () =>
            void saveCurrentStepAndAdvance({
              answers: { cost_delivery: state.answers.cost_delivery },
            }),
        };
      case 6: {
        const needsClassification = taxesNeedClassification(state.answers.taxes);
        const complete =
          isMoneyFieldComplete(state.answers.cost_fixed_structure) &&
          isMoneyFieldComplete(state.answers.taxes) &&
          (!needsClassification || state.taxClassification !== null);
        return {
          title: STRUCTURE_STEP_META.title,
          content: (
            <StructureStep
              fixedStructure={state.answers.cost_fixed_structure}
              taxes={state.answers.taxes}
              taxClassification={state.taxClassification}
              onFixedStructureChange={(value) =>
                setAnswers((prev) => ({ ...prev, cost_fixed_structure: value }))
              }
              onTaxesChange={(value) => setAnswers((prev) => ({ ...prev, taxes: value }))}
              onTaxClassificationChange={setTaxClassification}
            />
          ),
          complete,
          onContinue: () =>
            void saveCurrentStepAndAdvance({
              answers: {
                cost_fixed_structure: state.answers.cost_fixed_structure,
                taxes: state.answers.taxes,
              },
              taxClassification: state.taxClassification ?? undefined,
            }),
        };
      }
      case 7:
        return {
          title: GOAL_STEP_META.title,
          content: (
            <GoalStep
              value={state.answers.goal}
              onChange={(value) => setAnswers((prev) => ({ ...prev, goal: value }))}
            />
          ),
          complete: isMoneyFieldComplete(state.answers.goal),
          onContinue: () =>
            void saveCurrentStepAndAdvance({ answers: { goal: state.answers.goal } }),
        };
      case 8:
      default:
        return {
          title: CAPTURE_STEP_META.title,
          content: <CaptureStep contact={state.contact} onChange={setContact} />,
          complete: isContactFormComplete(state.contact),
          onContinue: () => void handleFinalize(),
        };
    }
  }
}

function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 1;
  return Math.min(Math.max(1, Math.trunc(step)), TOTAL_STEPS);
}

function safeSessionStorageGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
