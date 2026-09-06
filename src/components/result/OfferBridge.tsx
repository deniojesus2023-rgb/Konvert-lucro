import { Button } from "@/components/ui/Button";
import { ReviseButton } from "./ReviseButton";

export function OfferBridge() {
  return (
    <section className="-mx-6 flex flex-col items-center gap-4 bg-ink px-6 py-14 text-center sm:-mx-10 sm:px-10">
      <h2 className="max-w-xl text-2xl font-semibold text-white sm:text-3xl">
        O diagnóstico é uma fotografia. O seu lucro muda todos os dias.
      </h2>
      <p className="max-w-lg text-white/70">
        A Konvert foi pensada para acompanhar vendas, taxas e custos e mostrar como o resultado
        do seu delivery muda ao longo do tempo.
      </p>
      <p className="font-medium text-white">
        Descobrir uma vez não impede que o lucro escape amanhã.
      </p>
      <Button href="/oferta" className="mt-2">
        Quero acompanhar meu lucro
      </Button>
      <ReviseButton />
    </section>
  );
}
