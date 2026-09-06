const PAINS = [
  "Taxas, cupons e comissões espalhadas.",
  "Custos operacionais que passam despercebidos.",
  "Decisões tomadas olhando apenas o faturamento.",
];

export function PainPoints() {
  return (
    <section className="bg-blue-light/40 px-6 py-14">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold text-navy sm:text-3xl">
          Faturamento alto não significa lucro alto.
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PAINS.map((pain) => (
            <li
              key={pain}
              className="rounded-2xl border border-blue-light bg-white p-5 text-left text-navy/80"
            >
              {pain}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-lg font-medium text-navy">
          Você não precisa vender mais antes de saber se as vendas atuais dão lucro.
        </p>
      </div>
    </section>
  );
}
