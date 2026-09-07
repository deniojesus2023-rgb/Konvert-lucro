import Link from "next/link";

export function Hero() {
  return (
    <div className="landing-hero page-width">
      <div className="hero-copy">
        <p className="eyebrow">
          Raio-X do Lucro <span>•</span> Gratuito
        </p>
        <h1>
          Seu delivery vende.
          <br />
          Você sabe quanto
          <br />
          realmente sobra?
        </h1>
        <p className="hero-lede">Em menos de 1 minuto, transforme vendas e custos em uma visão clara do seu lucro.</p>
        <Link href="/raio-x" className="primary-button hero-button">
          Calcular meu lucro <span aria-hidden="true">→</span>
        </Link>
        <p className="button-note">Grátis · sem cartão · resultado imediato</p>
      </div>
      <div className="hero-example" aria-label="Exemplo de resultado">
        <p className="eyebrow muted">Exemplo</p>
        <div className="hero-number">
          <span>R$</span>16
        </div>
        <p className="example-line">é o que sobra de cada R$ 100 vendidos</p>
        <div className="example-metrics">
          <div>
            <span>Lucro estimado</span>
            <strong>R$ 8.000</strong>
          </div>
          <div>
            <span>Margem</span>
            <strong>16%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
