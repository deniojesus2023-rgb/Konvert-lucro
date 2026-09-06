import { Button } from "@/components/ui/Button";
import { ReviseButton } from "./ReviseButton";

export function OfferBridge() {
  return (
    <section className="-mx-6 flex flex-col gap-4 bg-ink px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">Seu lucro muda todos os dias.</h2>
        <p className="text-white/70">
          Acompanhe vendas e custos para perceber desvios antes que eles cresçam.
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
        <Button href="/oferta">
          Quero acompanhar meu lucro <span aria-hidden="true">→</span>
        </Button>
        <ReviseButton />
      </div>
    </section>
  );
}
