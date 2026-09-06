const STEPS = [
  { number: "01", text: "Informe vendas e custos." },
  { number: "02", text: "Veja quanto realmente sobra." },
  { number: "03", text: "Descubra onde sua margem está escapando." },
];

export function HowItWorks() {
  return (
    <section className="border-t border-line bg-canvas px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Como funciona</h2>
        <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step) => (
            <li key={step.number} className="border-t-2 border-blue-primary pt-4">
              <span className="text-sm font-medium text-blue-primary">{step.number}</span>
              <p className="mt-2 text-lg text-ink">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
