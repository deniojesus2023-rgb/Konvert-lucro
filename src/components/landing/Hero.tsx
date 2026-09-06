import { Button } from "@/components/ui/Button";

const PREVIEW_METRICS = [
  { label: "Lucro estimado", value: "R$ 4.200" },
  { label: "Margem", value: "18%" },
  { label: "Sobra por R$100", value: "R$ 18" },
  { label: "Ponto de equilíbrio", value: "R$ 22.000" },
];

export function Hero() {
  return (
    <section className="bg-canvas px-6 py-16 sm:py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">
            Seu delivery vende. Mas você sabe quanto realmente sobra de cada R$100?
          </h1>
          <p className="text-lg text-ink-soft">
            Faça o Raio-X do Lucro gratuito e descubra se taxas, entregas e custos estão
            consumindo sua margem.
          </p>
          <p className="font-medium text-ink">
            O aplicativo mostra quanto você vendeu. A Konvert mostra quanto sobrou.
          </p>
          <div className="mt-2 flex flex-col items-start gap-2">
            <Button href="/raio-x">
              Calcular meu lucro grátis <span aria-hidden="true">→</span>
            </Button>
            <p className="text-sm text-ink-faint">Grátis · sem cartão · resultado imediato</p>
          </div>
        </div>

        <div aria-label="Exemplo ilustrativo de resultado" className="border border-line p-6 sm:p-8">
          <p className="mb-5 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Exemplo ilustrativo — não é o seu resultado
          </p>
          <div className="grid grid-cols-2 divide-x divide-y divide-line border-t border-l border-line">
            {PREVIEW_METRICS.map((metric) => (
              <div key={metric.label} className="p-4">
                <p className="text-xs text-ink-faint">{metric.label}</p>
                <p className="mt-1 text-xl font-semibold text-ink">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
