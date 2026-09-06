interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Carregando…" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-16 text-ink-soft"
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-blue-primary motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  );
}
