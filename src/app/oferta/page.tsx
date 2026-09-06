import type { Metadata } from "next";
import Link from "next/link";
import { formatOfferPricePerDay, OFFER_PRICE_CENTS } from "@/lib/config/pricing";
import { formatWholeReais } from "@/lib/client/currency";
import { Logo } from "@/components/ui/Logo";
import { FireFunnelEvent } from "@/components/analytics/FireFunnelEvent";
import { OfferCtaButton } from "@/components/offer/OfferCtaButton";

export const metadata: Metadata = {
  title: "Oferta Konvert — Acompanhe seu lucro",
};

const FEATURES = [
  "Lucro do dia, do período e por pedido",
  "Custos que mais pressionam sua margem",
  "Distância até sua meta",
  "Histórico para comparar decisões",
];

interface OfertaPageProps {
  searchParams: Promise<{ custos?: string }>;
}

export default async function OfertaPage({ searchParams }: OfertaPageProps) {
  const { custos } = await searchParams;
  const knownCostsCents = custos ? Number(custos) : null;
  const showCostsLine = knownCostsCents !== null && Number.isFinite(knownCostsCents) && knownCostsCents > 0;

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <FireFunnelEvent event={{ eventName: "offer_viewed" }} />

      <header className="border-b border-line px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-auto" />
            <span className="text-ink-faint">/</span>
            <span className="text-sm text-ink-soft">Plano Konvert</span>
          </div>
          <Link href="/" className="text-sm text-blue-primary hover:underline">
            Voltar ao início <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px] lg:gap-16">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium tracking-wide text-blue-primary">
                DO DIAGNÓSTICO AO CONTROLE
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                Seu lucro muda todos os dias. A Konvert mostra por quê.
              </h1>
              <p className="text-lg text-ink-soft">
                Registre vendas e custos e perceba desvios antes que eles cresçam.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-ink">O que você passa a enxergar</h2>
              <ul className="mt-4 flex flex-col divide-y divide-line border-t border-line">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 py-3">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="h-5 w-5 shrink-0 text-blue-primary"
                      fill="none"
                    >
                      <path
                        d="M4 10.5l3.5 3.5L16 5.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-ink-soft">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {showCostsLine && (
              <div className="border-t border-line pt-6">
                <p className="text-ink-soft">No seu diagnóstico,</p>
                <p className="text-2xl font-semibold text-ink">
                  {formatWholeReais(knownCostsCents as number)} saíram em custos.
                </p>
                <p className="mt-1 text-ink-soft">Acompanhar onde esse valor muda é o começo do controle.</p>
              </div>
            )}
          </div>

          <div>
            <div className="rounded-[8px] border border-line-strong p-6">
              <p className="text-sm font-medium tracking-wide text-blue-primary">ACESSO COMPLETO</p>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl text-ink-faint">R$</span>
                <span className="text-5xl font-semibold text-ink">
                  {Math.round(OFFER_PRICE_CENTS / 100)}
                </span>
                <span className="text-lg text-ink-faint">/mês</span>
              </p>
              <p className="mt-1 text-ink-soft">{formatOfferPricePerDay()}.</p>

              <div className="mt-4 border-t border-line pt-4 text-ink-soft">
                <p>Cancele quando quiser.</p>
                <p>Seus dados continuam sendo seus.</p>
              </div>

              <div className="mt-4">
                <OfferCtaButton />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-faint">
                <span aria-hidden="true">🔒</span> Pagamento seguro. Acesso imediato.
              </p>
            </div>

            <p className="mt-4 text-center text-sm text-ink-faint">
              O seu diagnóstico já está salvo.
              <br />
              Você continua de onde parou.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
