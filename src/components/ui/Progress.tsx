interface ProgressProps {
  current: number;
  total: number;
}

/** Real progress — the fraction reflects the actual step, not a fake animation. */
export function Progress({ current, total }: ProgressProps) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <p className="mb-1.5 text-sm font-medium text-navy/70">
        Etapa {current} de {total}
      </p>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Etapa ${current} de ${total}`}
        className="h-2 w-full overflow-hidden rounded-full bg-blue-light"
      >
        <div
          className="h-full rounded-full bg-blue-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
