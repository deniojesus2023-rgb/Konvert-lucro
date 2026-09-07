interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Carregando…" }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className="loading-state">
      <span aria-hidden="true" className="loading-spinner" />
      <span>{label}</span>
    </div>
  );
}
