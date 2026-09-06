const COLUMN_A = ["Lucro e margem", "Lucro por pedido", "Ponto de equilíbrio"];
const COLUMN_B = ["Distância da meta", "Maiores custos", "Pontos cegos"];

export function WhatDiagnosticShows() {
  return (
    <section id="o-que-voce-recebe" className="border-t border-line bg-canvas px-6 py-14">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2 lg:gap-16">
        <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          Você recebe números para decidir.
        </h2>
        <div>
          <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            <ul className="flex flex-col divide-y divide-line border-t border-line">
              {COLUMN_A.map((item) => (
                <li key={item} className="py-3 text-ink-soft">
                  {item}
                </li>
              ))}
            </ul>
            <ul className="flex flex-col divide-y divide-line border-t border-line sm:border-t-0 sm:pt-0">
              {COLUMN_B.map((item) => (
                <li key={item} className="py-3 text-ink-soft">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-sm text-ink-faint">
            Uma estimativa autodeclarada, calculada a partir das suas respostas.
          </p>
        </div>
      </div>
    </section>
  );
}
