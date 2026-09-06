export function PainPoints() {
  return (
    <section className="border-t border-line bg-canvas px-6 py-14">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2 lg:gap-16">
        <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          Faturamento alto não garante lucro.
        </h2>
        <div className="flex flex-col gap-4">
          <p className="text-lg text-ink-soft">
            Taxas, entrega, produção e estrutura podem consumir a margem sem aparecer no saldo
            da conta.
          </p>
          <a href="#o-que-voce-recebe" className="text-blue-primary hover:underline">
            Veja o que o diagnóstico mostra <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
