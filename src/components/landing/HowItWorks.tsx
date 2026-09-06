const STEPS = [
  { number: "1", text: "Informe vendas e custos." },
  { number: "2", text: "Veja quanto realmente sobra." },
  { number: "3", text: "Descubra onde sua margem está escapando." },
];

export function HowItWorks() {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-semibold text-navy sm:text-3xl">
          Como funciona
        </h2>
        <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.number} className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-primary text-lg font-semibold text-white">
                {step.number}
              </span>
              <p className="text-navy/80">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
