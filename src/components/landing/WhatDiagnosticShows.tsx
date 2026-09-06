const ITEMS = [
  "Lucro mensal estimado",
  "Margem estimada",
  "Lucro médio por pedido",
  "Quanto sobra de cada R$100 vendidos",
  "Ponto de equilíbrio",
  "Distância para a meta",
  "Maiores grupos de custo",
  "Custos que ainda são pontos cegos",
];

export function WhatDiagnosticShows() {
  return (
    <section className="border-t border-line bg-canvas px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">O que o diagnóstico mostra</h2>
        <ul className="mt-8 grid grid-cols-1 divide-y divide-line border-t border-line sm:grid-cols-2 sm:divide-y-0 sm:gap-x-8">
          {ITEMS.map((item) => (
            <li key={item} className="border-line py-3 text-ink-soft sm:border-b">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
