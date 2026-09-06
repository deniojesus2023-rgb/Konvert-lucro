import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="bg-canvas px-6 py-14 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium tracking-wide text-blue-primary">
            RAIO-X DO LUCRO • GRATUITO
          </p>
          <h1 className="text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">
            Seu delivery vende. Você sabe quanto realmente sobra?
          </h1>
          <p className="text-lg text-ink-soft">
            Em menos de 1 minuto, transforme vendas e custos em uma visão clara do seu lucro.
          </p>
          <div className="mt-2 flex flex-col items-start gap-2">
            <Button href="/raio-x">
              Calcular meu lucro <span aria-hidden="true">→</span>
            </Button>
            <p className="text-sm text-ink-faint">Grátis · sem cartão · resultado imediato</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Exemplo</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl text-ink-faint">R$</span>
            <span className="text-6xl font-semibold text-ink">16</span>
          </div>
          <p className="mt-1 text-lg text-ink-soft">é o que sobra de cada R$ 100 vendidos</p>

          <div className="mt-6 flex gap-10 border-t border-line pt-6">
            <div>
              <p className="text-sm text-ink-faint">Lucro estimado</p>
              <p className="mt-1 text-xl font-semibold text-ink">R$ 8.000</p>
            </div>
            <div>
              <p className="text-sm text-ink-faint">Margem</p>
              <p className="mt-1 text-xl font-semibold text-ink">16%</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
