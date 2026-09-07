import Link from "next/link";

export function FinalCta() {
  return (
    <section className="landing-cta">
      <div className="page-width">
        <h2>
          Descubra se o seu delivery
          <br />
          está vendendo ou lucrando.
        </h2>
        <Link href="/raio-x" className="primary-button">
          Fazer meu Raio-X gratuito <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
