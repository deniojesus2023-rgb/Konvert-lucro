import type { Metadata } from "next";
import { formatOfferPricePerDay, OFFER_PRICE_CENTS } from "@/lib/config/pricing";
import { formatWholeReais } from "@/lib/client/currency";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FireFunnelEvent } from "@/components/analytics/FireFunnelEvent";
import { OfferCtaButton } from "@/components/offer/OfferCtaButton";
import { BackToResultLink } from "@/components/offer/BackToResultLink";

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
    <>
      <FireFunnelEvent event={{ eventName: "offer_viewed" }} />

      <SiteHeader context="Plano Konvert" actionLabel="Voltar ao início" actionHref="/" />

      <section className="offer-screen">
        <div className="offer-wrap page-width">
          <div className="offer-copy">
            <p className="eyebrow">Do diagnóstico ao controle</p>
            <h1>
              Seu lucro muda todos os dias.
              <br />A Konvert mostra por quê.
            </h1>
            <p className="offer-lede">Registre vendas e custos e perceba desvios antes que eles cresçam.</p>
            <h2>O que você passa a enxergar</h2>
            <ul className="benefit-list">
              {FEATURES.map((feature) => (
                <li key={feature}>
                  <span>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <aside className="price-panel">
            <p className="eyebrow">Acesso completo</p>
            <div className="price">
              <span>R$</span>
              {Math.round(OFFER_PRICE_CENTS / 100)}
              <small>/mês</small>
            </div>
            <p>{formatOfferPricePerDay()}.</p>
            <hr />
            <p>
              Cancele quando quiser.
              <br />
              Seus dados continuam sendo seus.
            </p>
            <OfferCtaButton />
          </aside>
        </div>

        {showCostsLine && (
          <div className="offer-proof page-width">
            <span>No seu diagnóstico,</span>
            <strong>{formatWholeReais(knownCostsCents as number)} saíram em custos.</strong>
            <span>Acompanhar onde esse valor muda é o começo do controle.</span>
          </div>
        )}

        <div className="offer-back">
          <BackToResultLink />
          <p className="help-text">
            O seu diagnóstico já está salvo.
            <br />
            Você continua de onde parou.
          </p>
        </div>
      </section>
    </>
  );
}
