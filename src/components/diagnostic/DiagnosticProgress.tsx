interface DiagnosticProgressProps {
  current: number;
  total: number;
}

/** A segmented line — one dash per step, filled solid up to (and including) the current one. */
export function DiagnosticProgress({ current, total }: DiagnosticProgressProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Etapa ${current} de ${total}`}
      className="flex gap-1.5"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`h-[3px] w-8 rounded-full ${index < current ? "bg-blue-primary" : "bg-line"}`}
        />
      ))}
    </div>
  );
}
