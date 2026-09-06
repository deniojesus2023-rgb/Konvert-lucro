import { FireFunnelEvent } from "@/components/analytics/FireFunnelEvent";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { PainPoints } from "@/components/landing/PainPoints";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhatDiagnosticShows } from "@/components/landing/WhatDiagnosticShows";
import { Transparency } from "@/components/landing/Transparency";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <FireFunnelEvent event={{ eventName: "landing_viewed" }} />
      <Header />
      <main className="flex-1">
        <Hero />
        <PainPoints />
        <HowItWorks />
        <WhatDiagnosticShows />
        <Transparency />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
