const POINTS = [
  "Valores aproximados são aceitos.",
  "“Não sei” nunca vira zero escondido.",
  "O resultado é uma estimativa autodeclarada.",
  "Não substitui acompanhamento contábil.",
  "Nenhum cartão é solicitado.",
];

export function Transparency() {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-2xl font-semibold text-navy sm:text-3xl">Transparência</h2>
        <ul className="mt-8 flex flex-col gap-3">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3 text-navy/80">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-primary" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
