interface DiagnosticProgressProps {
  current: number;
  total: number;
}

/** One dash per step: filled blue up to and including the current one. */
export function DiagnosticProgress({ current, total }: DiagnosticProgressProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Etapa ${current} de ${total}`}
      className="progress-dashes"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={index + 1 < current ? "done" : index + 1 === current ? "active" : ""}
        />
      ))}
    </div>
  );
}
