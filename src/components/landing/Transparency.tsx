const POINTS = [
  "Valores aproximados são aceitos.",
  "“Não sei” nunca vira zero escondido.",
  "O resultado é uma estimativa autodeclarada.",
  "Não substitui acompanhamento contábil.",
  "Nenhum cartão é solicitado.",
];

export function Transparency() {
  return (
    <section className="border-t border-line bg-canvas px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Transparência</h2>
        <ul className="mt-8 flex flex-col divide-y divide-line border-t border-line">
          {POINTS.map((point) => (
            <li key={point} className="py-4 text-ink-soft">
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
