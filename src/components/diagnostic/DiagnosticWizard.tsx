"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { DiagnosticScreen } from "./DiagnosticScreen";
import { MonetaryAnswer } from "./MonetaryAnswer";
import { OrderAnswer } from "./OrderAnswer";
import { hydrateAnswers, hydrateProfile } from "./hydrate-draft";
import {
  DELIVERY_TYPE_OPTIONS,
  MAIN_CHANNEL_OPTIONS,
  emptyDraftAnswers,
  isMoneyFieldComplete,
  taxesNeedClassification,
  TOTAL_STEPS,
  type DraftAnswers,
  type ProfileAnswers,
  type TaxClassification,
} from "./wizard-types";
import {
  CaptureStep,
  CAPTURE_STEP_META,
  emptyContactFormState,
  isContactFormComplete,
  type ContactFormState,
} from "./steps/CaptureStep";

type Phase = "initializing" | "ready" | "error";

const STARTED_AT_STORAGE_KEY = "konvert:raiox:started-at";

const TAX_CLASSIFICATION_OPTIONS: Record<string, TaxClassification> = {
  "Sim, acompanham as vendas": "variable",
  "Não, são um valor fixo": "fixed",
  "Não sei responder": "unclassified",
};

interface Screen {
  kicker: string;
  heading: string;
  description?: string;
  footnote?: string;
  helper?: { summary: string; content: ReactNode };
  content: ReactNode;
  complete: boolean;
  nextPreview?: string;
}

export function DiagnosticWizard() {
  const router = useRouter();
  const initRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("initializing");
  const [fatalError, setFatalError] = useState<string | null>(null);

  const [diagnosticId, setDiagnosticId] = useState<string | null>(null);
  const [answersVersion, setAnswersVersion] = useState(0);
  const [step, setStep] = useState(1);
  const [screenIndex, setScreenIndex] = useState(0);

  const [answers, setAnswers] = useState<DraftAnswers>(emptyDraftAnswers());
  const [profile, setProfile] = useState<ProfileAnswers>({ deliveryType: null, mainChannel: null });
  const [taxClassification, setTaxClassification] = useState<TaxClassification | null>(null);
  const [contact, setContact] = useState<ContactFormState>(emptyContactFormState());

  const [saving, setSaving] = useState(false);
  const [savedMessageVisible, setSavedMessageVisible] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

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
        setScreenIndex(0);
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
      setScreenIndex(0);
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
    // Only fires once per macro step, matching the server's step model —
    // sub-screens inside a step aren't separately tracked here.
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
      setScreenIndex(0);
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

  function goToNextScreen(screensInStep: number, onLastScreen: () => void) {
    if (screenIndex < screensInStep - 1) {
      setStepError(null);
      setConflictMessage(null);
      setScreenIndex((current) => current + 1);
      return;
    }
    onLastScreen();
  }

  function goBack(previousStepScreenCount: number) {
    setStepError(null);
    setConflictMessage(null);
    if (screenIndex > 0) {
      setScreenIndex((current) => current - 1);
      return;
    }
    if (step === 1) return;
    const previousStep = step - 1;
    setStep(previousStep);
    setScreenIndex(Math.max(0, previousStepScreenCount - 1));
    if (diagnosticId) saveDraftRef({ id: diagnosticId, step: previousStep, answersVersion });
  }

  // --- Finalize ------------------------------------------------------------
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

  const screens = buildScreens(step, { answers, profile, taxClassification, contact });
  const previousStepScreens =
    step > 1 ? buildScreens(step - 1, { answers, profile, taxClassification, contact }) : [];
  const current = screens[Math.min(screenIndex, screens.length - 1)];
  const isLastMacroStep = step === TOTAL_STEPS;
  const isLastScreenOfStep = screenIndex === screens.length - 1;

  function handleContinue() {
    if (step === 1) {
      goToNextScreen(screens.length, () =>
        void saveCurrentStepAndAdvance({ profile }),
      );
      return;
    }
    if (step === 2) {
      goToNextScreen(screens.length, () =>
        void saveCurrentStepAndAdvance({ answers: { revenue: answers.revenue, orders: answers.orders } }),
      );
      return;
    }
    if (step === 3) {
      goToNextScreen(screens.length, () =>
        void saveCurrentStepAndAdvance({ answers: { cost_production: answers.cost_production } }),
      );
      return;
    }
    if (step === 4) {
      goToNextScreen(screens.length, () =>
        void saveCurrentStepAndAdvance({ answers: { cost_fees: answers.cost_fees } }),
      );
      return;
    }
    if (step === 5) {
      goToNextScreen(screens.length, () =>
        void saveCurrentStepAndAdvance({ answers: { cost_delivery: answers.cost_delivery } }),
      );
      return;
    }
    if (step === 6) {
      goToNextScreen(screens.length, () =>
        void saveCurrentStepAndAdvance({
          answers: { cost_fixed_structure: answers.cost_fixed_structure, taxes: answers.taxes },
          taxClassification: taxClassification ?? undefined,
        }),
      );
      return;
    }
    if (step === 7) {
      goToNextScreen(screens.length, () =>
        void saveCurrentStepAndAdvance({ answers: { goal: answers.goal } }),
      );
      return;
    }
    void handleFinalize();
  }

  return (
    <DiagnosticScreen
      step={step}
      kicker={current.kicker}
      heading={current.heading}
      description={current.description}
      footnote={current.footnote}
      helper={current.helper}
      onBack={step > 1 || screenIndex > 0 ? () => goBack(previousStepScreens.length) : undefined}
      onContinue={handleContinue}
      continueLabel={isLastMacroStep && isLastScreenOfStep ? "Ver meu resultado" : "Continuar"}
      continueDisabled={!current.complete}
      continueBusy={isLastMacroStep && isLastScreenOfStep ? finalizing : saving}
      nextPreview={current.nextPreview}
      saving={saving}
      savedMessageVisible={savedMessageVisible}
      errorMessage={stepError}
      conflictMessage={conflictMessage}
    >
      {current.content}
    </DiagnosticScreen>
  );

  function buildScreens(
    stepNumber: number,
    state: {
      answers: DraftAnswers;
      profile: ProfileAnswers;
      taxClassification: TaxClassification | null;
      contact: ContactFormState;
    },
  ): Screen[] {
    switch (stepNumber) {
      case 1:
        return [
          {
            kicker: "01 / PERFIL",
            heading: "Qual é o tipo do seu delivery?",
            description: "Selecione a opção mais próxima do seu negócio.",
            content: (
              <ChoiceGroup
                key="deliveryType"
                name="deliveryType"
                label="Escolha uma opção"
                options={DELIVERY_TYPE_OPTIONS}
                value={state.profile.deliveryType}
                onChange={(deliveryType) => setProfile((prev) => ({ ...prev, deliveryType }))}
              />
            ),
            complete: Boolean(state.profile.deliveryType),
            nextPreview: "A seguir: por onde entram mais pedidos",
          },
          {
            kicker: "01 / PERFIL",
            heading: "Por onde entram mais pedidos?",
            description: "Escolha o canal que mais representa suas vendas hoje.",
            footnote: "Você poderá informar outros canais depois.",
            content: (
              <ChoiceGroup
                key="mainChannel"
                name="mainChannel"
                label="Escolha uma opção"
                options={MAIN_CHANNEL_OPTIONS}
                value={state.profile.mainChannel}
                onChange={(mainChannel) => setProfile((prev) => ({ ...prev, mainChannel }))}
              />
            ),
            complete: Boolean(state.profile.mainChannel),
            nextPreview: "A seguir: faturamento dos últimos 30 dias",
          },
        ];
      case 2:
        return [
          {
            kicker: "02 / VENDAS",
            heading: "Quanto seu delivery vendeu?",
            description: "Nos últimos 30 dias.",
            footnote:
              "Informe o valor total cobrado dos clientes, antes das taxas e descontos do aplicativo. Não use somente o valor líquido que caiu na conta.",
            content: (
              <MonetaryAnswer
                key="revenue"
                id="revenue"
                label="Faturamento"
                zeroLabel="Não tive vendas no período"
                value={state.answers.revenue ?? undefined}
                onChange={(value) => setAnswers((prev) => ({ ...prev, revenue: value }))}
              />
            ),
            complete: isMoneyFieldComplete(state.answers.revenue),
            nextPreview: "A seguir: quantidade de pedidos",
          },
          {
            kicker: "02 / VENDAS",
            heading: "Quantos pedidos você teve?",
            description: "Nos últimos 30 dias.",
            footnote: "Use a quantidade total de pedidos, incluindo todos os canais.",
            helper: {
              summary: "Onde encontro esse número?",
              content:
                "Some os pedidos de todos os canais que você vende: apps de delivery, WhatsApp, Instagram, site próprio, telefone e balcão.",
            },
            content: (
              <OrderAnswer
                key="orders"
                id="orders"
                label="Número de pedidos"
                note="Pedidos concluídos e cancelados no período"
                value={state.answers.orders ?? undefined}
                onChange={(value) => setAnswers((prev) => ({ ...prev, orders: value }))}
              />
            ),
            complete: state.answers.orders !== null,
            nextPreview: "A seguir: custos de produção",
          },
        ];
      case 3:
        return [
          {
            kicker: "03 / PRODUÇÃO",
            heading: "Quanto você gastou com produção?",
            description: "Nos últimos 30 dias.",
            footnote: "Some ingredientes, bebidas, embalagens e descartáveis usados nos pedidos.",
            helper: {
              summary: "O que devo incluir?",
              content:
                "Use como aproximação o que foi consumido no período, não necessariamente tudo o que foi comprado para estoque.",
            },
            content: (
              <MonetaryAnswer
                key="cost_production"
                id="cost_production"
                label="Custo de produção"
                note="Ingredientes e embalagens"
                zeroLabel="Não tenho esse custo"
                value={state.answers.cost_production ?? undefined}
                onChange={(value) => setAnswers((prev) => ({ ...prev, cost_production: value }))}
              />
            ),
            complete: isMoneyFieldComplete(state.answers.cost_production),
            nextPreview: "A seguir: taxas das vendas",
          },
        ];
      case 4:
        return [
          {
            kicker: "04 / TAXAS",
            heading: "Quanto você pagou para vender?",
            description: "Nos últimos 30 dias.",
            footnote: "Considere comissões de aplicativos, taxas de pagamento, cupons e descontos.",
            helper: {
              summary: "Onde encontro essas taxas?",
              content:
                "Cada um desses valores entra uma única vez aqui — não repita comissão ou cupom em nenhuma outra etapa.",
            },
            content: (
              <MonetaryAnswer
                key="cost_fees"
                id="cost_fees"
                label="Taxas das vendas"
                note="Aplicativos, pagamentos e promoções"
                zeroLabel="Não tenho esse custo"
                value={state.answers.cost_fees ?? undefined}
                onChange={(value) => setAnswers((prev) => ({ ...prev, cost_fees: value }))}
              />
            ),
            complete: isMoneyFieldComplete(state.answers.cost_fees),
            nextPreview: "A seguir: custos com entregas",
          },
        ];
      case 5:
        return [
          {
            kicker: "05 / ENTREGAS",
            heading: "Quanto você gastou com entregas?",
            description: "Nos últimos 30 dias.",
            footnote: "Inclua motoboys, empresas terceirizadas, combustível e ajuda de custo.",
            helper: {
              summary: "O que devo incluir?",
              content:
                "Motoboys próprios, aplicativos de entrega terceirizados, combustível e ajuda de custo pagos pelo estabelecimento.",
            },
            content: (
              <MonetaryAnswer
                key="cost_delivery"
                id="cost_delivery"
                label="Custos com entregas"
                note="Motoboys, combustível e terceirização"
                zeroLabel="Não tenho esse custo"
                value={state.answers.cost_delivery ?? undefined}
                onChange={(value) => setAnswers((prev) => ({ ...prev, cost_delivery: value }))}
              />
            ),
            complete: isMoneyFieldComplete(state.answers.cost_delivery),
            nextPreview: "A seguir: custos da estrutura",
          },
        ];
      case 6: {
        const needsClassification = taxesNeedClassification(state.answers.taxes);
        const screens: Screen[] = [
          {
            kicker: "06 / ESTRUTURA",
            heading: "Quanto custa manter seu delivery?",
            description: "Por mês.",
            footnote: "Some aluguel, equipe, energia, água, internet, sistemas e outras despesas fixas.",
            helper: {
              summary: "Quais custos entram aqui?",
              content: "Aluguel, folha e pró-labore formal, água, energia, internet, sistemas e anúncios.",
            },
            content: (
              <MonetaryAnswer
                key="cost_fixed_structure"
                id="cost_fixed_structure"
                label="Custos da estrutura"
                note="Despesas fixas mensais"
                zeroLabel="Não tenho esse custo"
                value={state.answers.cost_fixed_structure ?? undefined}
                onChange={(value) => setAnswers((prev) => ({ ...prev, cost_fixed_structure: value }))}
              />
            ),
            complete: isMoneyFieldComplete(state.answers.cost_fixed_structure),
            nextPreview: "A seguir: impostos",
          },
          {
            kicker: "06 / ESTRUTURA",
            heading: "Quanto você pagou de impostos?",
            description: "Nos últimos 30 dias.",
            footnote: "Informe o total pago ou reservado para impostos do delivery.",
            helper: {
              summary: "Posso usar uma estimativa?",
              content:
                "Nunca estime por alíquota — use o valor que você realmente pagou ou reservou no período.",
            },
            content: (
              <MonetaryAnswer
                key="taxes"
                id="taxes"
                label="Impostos"
                note="Tributos sobre vendas e operação"
                zeroLabel="Não paguei imposto no período"
                value={state.answers.taxes ?? undefined}
                onChange={(value) => setAnswers((prev) => ({ ...prev, taxes: value }))}
              />
            ),
            complete: isMoneyFieldComplete(state.answers.taxes),
            nextPreview: needsClassification
              ? "A seguir: como seus impostos são calculados"
              : "A seguir: sua meta de lucro",
          },
        ];

        if (needsClassification) {
          const label = state.taxClassification
            ? Object.entries(TAX_CLASSIFICATION_OPTIONS).find(([, v]) => v === state.taxClassification)?.[0] ??
              null
            : null;
          screens.push({
            kicker: "06 / ESTRUTURA",
            heading: "Se vender mais, seus impostos aumentam?",
            description: "Essa informação ajuda a calcular seu ponto de equilíbrio corretamente.",
            footnote: "Se não souber, o restante do diagnóstico continua normalmente.",
            content: (
              <ChoiceGroup
                key="taxClassification"
                name="taxClassification"
                label="Escolha a opção mais próxima"
                options={Object.keys(TAX_CLASSIFICATION_OPTIONS)}
                value={label}
                onChange={(chosenLabel) => setTaxClassification(TAX_CLASSIFICATION_OPTIONS[chosenLabel])}
              />
            ),
            complete: state.taxClassification !== null,
            nextPreview: "A seguir: sua meta de lucro",
          });
        }

        return screens;
      }
      case 7:
        return [
          {
            kicker: "07 / META",
            heading: "Quanto você gostaria que sobrasse?",
            description: "Por mês.",
            footnote:
              "Defina uma meta de lucro para compararmos com o resultado atual. Você poderá mudar essa meta depois.",
            content: (
              <MonetaryAnswer
                key="goal"
                id="goal"
                label="Sua meta mensal"
                note="Valor que você gostaria de ter como lucro"
                zeroLabel="Prefiro não definir uma meta"
                value={state.answers.goal ?? undefined}
                onChange={(value) => setAnswers((prev) => ({ ...prev, goal: value }))}
                simplified
              />
            ),
            complete: isMoneyFieldComplete(state.answers.goal),
            nextPreview: "A seguir: abrir seu resultado",
          },
        ];
      case 8:
      default:
        return [
          {
            kicker: "08 / RESULTADO",
            heading: CAPTURE_STEP_META.title,
            description: "Só precisamos dos seus dados para criar o acesso seguro ao resultado.",
            footnote: "Nenhum cartão será solicitado.",
            content: <CaptureStep contact={state.contact} onChange={setContact} />,
            complete: isContactFormComplete(state.contact),
          },
        ];
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
