import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const PREVIEW_METRICS = [
  { label: "Lucro estimado", value: "R$ 4.200" },
  { label: "Margem", value: "18%" },
  { label: "Sobra por R$100", value: "R$ 18" },
  { label: "Ponto de equilíbrio", value: "R$ 22.000" },
];

export function Hero() {
  return (
    <section className="bg-white px-6 py-14 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-5 text-center lg:text-left">
          <h1 className="text-3xl font-semibold leading-tight text-navy sm:text-4xl">
            Seu delivery vende. Mas você sabe quanto realmente sobra de cada R$100?
          </h1>
          <p className="text-lg text-navy/70">
            Faça o Raio-X do Lucro gratuito e descubra se taxas, entregas e custos estão
            consumindo sua margem.
          </p>
          <p className="font-medium text-navy">
            O aplicativo mostra quanto você vendeu. A Konvert mostra quanto sobrou.
          </p>
          <div className="mt-2 flex flex-col items-center gap-2 lg:items-start">
            <Button href="/raio-x" fullWidth className="lg:w-auto">
              Calcular meu lucro grátis
            </Button>
            <p className="text-sm text-navy/50">Grátis · sem cartão · resultado imediato</p>
          </div>
        </div>

        <Card aria-label="Exemplo ilustrativo de resultado" className="mx-auto w-full max-w-md">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-navy/50">
            Exemplo ilustrativo — não é o seu resultado
          </p>
          <div className="grid grid-cols-2 gap-4">
            {PREVIEW_METRICS.map((metric) => (
              <div key={metric.label} className="rounded-xl bg-blue-light p-4">
                <p className="text-xs text-navy/60">{metric.label}</p>
                <p className="mt-1 text-xl font-semibold text-navy">{metric.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
