import { FireFunnelEvent } from "@/components/analytics/FireFunnelEvent";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { PainPoints } from "@/components/landing/PainPoints";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhatDiagnosticShows } from "@/components/landing/WhatDiagnosticShows";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <FireFunnelEvent event={{ eventName: "landing_viewed" }} />
      <SiteHeader context="Do pedido ao lucro." actionLabel="Diagnóstico grátis" actionHref="/raio-x" />
      <main>
        <Hero />
        <PainPoints />
        <HowItWorks />
        <WhatDiagnosticShows />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
