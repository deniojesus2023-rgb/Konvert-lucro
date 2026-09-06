import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section className="border-t border-line bg-ink px-6 py-20 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          Descubra se o seu delivery está vendendo ou lucrando.
        </h2>
        <div className="mt-8 flex justify-center">
          <Button href="/raio-x" variant="primary">
            Fazer meu Raio-X gratuito <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
