const STEPS = [
  { number: "01", text: "Informe vendas e custos" },
  { number: "02", text: "Veja quanto realmente sobra" },
  { number: "03", text: "Descubra o que mais pesa na margem" },
];

export function HowItWorks() {
  return (
    <section className="border-t border-line bg-[#F5F5F7] px-6 py-14">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
          Um minuto para enxergar o seu negócio de outro jeito.
        </h2>
        <ol className="mt-10 flex flex-col divide-y divide-line sm:grid sm:grid-cols-3 sm:gap-6 sm:divide-y-0">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="flex items-center gap-4 py-4 sm:flex-col sm:items-start sm:gap-1 sm:border-t sm:border-line sm:py-0 sm:pt-4"
            >
              <span className="text-4xl font-semibold text-ink-faint sm:text-5xl">
                {step.number}
              </span>
              <p className="text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
