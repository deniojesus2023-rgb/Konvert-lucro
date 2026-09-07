/**
 * Shown while `finalizeDiagnostic` is in flight — the real request, not a
 * timed animation. It disappears the moment the server responds (success
 * routes to the result page; failure falls back to the normal error
 * state on the capture screen).
 */
export function ProcessingScreen() {
  return (
    <section className="processing-screen" aria-live="polite">
      <div className="processing-content">
        <p className="eyebrow">Diagnóstico concluído</p>
        <h1>Organizando o seu resultado.</h1>
        <p className="processing-lede">Estamos transformando suas respostas em uma visão clara do seu lucro.</p>
        <div className="loading-line" role="progressbar" aria-valuetext="Calculando seu resultado">
          <span style={{ width: "70%" }} />
        </div>
        <div className="processing-rows">
          <div>
            <span>Vendas e pedidos</span>
            <strong>Concluído</strong>
          </div>
          <div>
            <span>Custos e impostos</span>
            <strong>Concluído</strong>
          </div>
          <div>
            <span>Lucro e ponto de equilíbrio</span>
            <strong>Calculando…</strong>
          </div>
        </div>
        <p className="processing-note">Isso leva apenas alguns segundos.</p>
      </div>
    </section>
  );
}
