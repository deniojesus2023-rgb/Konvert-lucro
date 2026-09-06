const PAINS = [
  "Taxas, cupons e comissões espalhadas.",
  "Custos operacionais que passam despercebidos.",
  "Decisões tomadas olhando apenas o faturamento.",
];

export function PainPoints() {
  return (
    <section className="border-t border-line bg-canvas px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
          Faturamento alto não significa lucro alto.
        </h2>
        <ul className="mt-8 flex flex-col divide-y divide-line border-t border-line">
          {PAINS.map((pain) => (
            <li key={pain} className="py-4 text-lg text-ink-soft">
              {pain}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-lg font-medium text-ink">
          Você não precisa vender mais antes de saber se as vendas atuais dão lucro.
        </p>
      </div>
    </section>
  );
}
