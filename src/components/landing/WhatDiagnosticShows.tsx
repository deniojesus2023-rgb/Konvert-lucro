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
    <section className="bg-blue-light/40 px-6 py-14">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-semibold text-navy sm:text-3xl">
          O que o diagnóstico mostra
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ITEMS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-xl border border-blue-light bg-white px-4 py-3 text-navy/80"
            >
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-blue-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
