import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section className="border-t border-line bg-ink px-6 py-14">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          Descubra se o seu delivery está vendendo ou lucrando.
        </h2>
        <Button href="/raio-x" variant="primary" className="shrink-0">
          Fazer meu Raio-X gratuito <span aria-hidden="true">→</span>
        </Button>
      </div>
    </section>
  );
}
