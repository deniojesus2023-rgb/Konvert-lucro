import { Button } from "@/components/ui/Button";
import { ReviseButton } from "./ReviseButton";

export function OfferBridge() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-2xl bg-navy px-6 py-10 text-center">
      <h2 className="text-2xl font-semibold text-white">
        O diagnóstico é uma fotografia. O seu lucro muda todos os dias.
      </h2>
      <p className="max-w-lg text-white/80">
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
