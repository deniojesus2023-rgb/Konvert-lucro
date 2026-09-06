import type { Metadata } from "next";
import Link from "next/link";
import { formatOfferPricePerDay, formatOfferPricePerMonth } from "@/lib/config/pricing";
import { Card } from "@/components/ui/Card";
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
    <div className="flex min-h-full flex-col bg-white">
      <FireFunnelEvent event={{ eventName: "offer_viewed" }} />

      <header className="border-b border-blue-light px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/">
            <Logo className="h-7 w-auto" />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-navy sm:text-4xl">
            Pare de administrar vendas. Comece a administrar lucro.
          </h1>
          <p className="mt-4 text-lg text-navy/70">
            Tenha uma visão clara do que entra, do que sai e do que realmente sobra no seu
            delivery.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 rounded-xl border border-blue-light bg-white px-4 py-3 text-navy/80"
            >
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-blue-primary" />
              {feature}
            </li>
          ))}
        </ul>

        <Card className="mx-auto flex w-full max-w-sm flex-col items-center gap-2 text-center">
          <p className="text-3xl font-semibold text-navy">{formatOfferPricePerMonth()}</p>
          <p className="text-navy/60">{formatOfferPricePerDay()}</p>
        </Card>

        <OfferCtaButton />
      </main>
    </div>
  );
}
