import { Logo } from "@/components/ui/Logo";

const ITEMS = [
  { label: "Vendas e pedidos", status: "Concluído" },
  { label: "Custos e impostos", status: "Concluído" },
  { label: "Lucro e ponto de equilíbrio", status: "Calculando…" },
] as const;

/**
 * Shown while `finalizeDiagnostic` is in flight — the real request, not a
 * timed animation. It disappears the moment the server responds (success
 * routes to the result page; failure falls back to the normal error
 * state on the capture screen).
 */
export function ProcessingScreen() {
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="border-b border-line px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-auto" />
            <span className="text-ink-faint">/</span>
            <span className="text-sm text-ink-soft">Raio-X do Lucro</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-medium tracking-wide text-blue-primary">DIAGNÓSTICO CONCLUÍDO</p>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">Organizando o seu resultado.</h1>
          <p className="text-lg text-ink-soft">
            Estamos transformando suas respostas em uma visão clara do seu lucro.
          </p>
        </div>

        <div
          role="progressbar"
          aria-valuetext="Calculando seu resultado"
          className="h-1 w-full overflow-hidden rounded-full bg-line"
        >
          <div className="h-full w-2/3 rounded-full bg-blue-primary motion-safe:animate-pulse" />
        </div>

        <ul className="flex w-full flex-col divide-y divide-line border-t border-line text-left">
          {ITEMS.map((item) => (
            <li key={item.label} className="flex items-center justify-between py-4">
              <span className="text-ink">{item.label}</span>
              <span className="text-ink-faint">{item.status}</span>
            </li>
          ))}
        </ul>

        <p className="text-sm text-ink-faint">Isso leva apenas alguns segundos.</p>
      </main>
    </div>
  );
}
