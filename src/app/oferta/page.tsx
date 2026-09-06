import type { Metadata } from "next";
import Link from "next/link";
import { formatOfferPricePerDay, formatOfferPricePerMonth } from "@/lib/config/pricing";
import { Logo } from "@/components/ui/Logo";
import { FireFunnelEvent } from "@/components/analytics/FireFunnelEvent";
import { OfferCtaButton } from "@/components/offer/OfferCtaButton";

export const metadata: Metadata = {
  title: "Oferta Konvert — Acompanhe seu lucro",
};

const FEATURES = [
  "Visão diária do lucro",
  "Lucro por período e por pedido",
  "Acompanhamento dos maiores custos",
  "Alertas de desvios",
  "Comparação com metas",
  "Histórico de resultados",
];

export default function OfertaPage() {
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <FireFunnelEvent event={{ eventName: "offer_viewed" }} />

      <header className="border-b border-line px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <Link href="/">
            <Logo className="h-7 w-auto" />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-6 py-14 sm:px-10">
        <div>
          <h1 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Pare de administrar vendas. Comece a administrar lucro.
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            Tenha uma visão clara do que entra, do que sai e do que realmente sobra no seu
            delivery.
          </p>
        </div>

        <ul className="grid grid-cols-1 divide-y divide-line border-t border-line sm:grid-cols-2 sm:divide-y-0 sm:gap-x-8">
          {FEATURES.map((feature) => (
            <li key={feature} className="border-line py-3 text-ink-soft sm:border-b">
              {feature}
            </li>
          ))}
        </ul>

        <div className="border-y border-line py-8 text-center">
          <p className="text-4xl font-semibold text-ink">{formatOfferPricePerMonth()}</p>
          <p className="mt-1 text-ink-faint">{formatOfferPricePerDay()}</p>
        </div>

        <OfferCtaButton />
      </main>
    </div>
  );
}
