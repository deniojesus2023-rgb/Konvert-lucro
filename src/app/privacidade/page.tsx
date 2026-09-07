import type { Metadata } from "next";
import { CONSENT_TEXT_VERSION } from "@/lib/config/consent";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Política de Privacidade — Konvert",
};

const SECTIONS: { number: string; title: string; body: React.ReactNode }[] = [
  {
    number: "01",
    title: "Dados coletados",
    body: (
      <p>
        Coletamos as respostas que você dá no Raio-X do Lucro — valores de vendas e custos, sempre nos estados
        que você escolher: exato, aproximado, faixa, &ldquo;não sei&rdquo; ou &ldquo;não tenho esse custo&rdquo;
        — e, ao final, seu nome e WhatsApp.
      </p>
    ),
  },
  {
    number: "02",
    title: "Uso do diagnóstico",
    body: (
      <p>
        Os dados são usados exclusivamente para calcular lucro, margem, ponto de equilíbrio e métricas
        relacionadas — nenhuma outra finalidade além do funcionamento do próprio Raio-X do Lucro.
      </p>
    ),
  },
  {
    number: "03",
    title: "Como o resultado é guardado",
    body: (
      <p>
        O acesso acontece por um link longo e aleatório, gerado só para você. Esse link não contém seu nome,
        seu WhatsApp nem nenhum outro dado pessoal — só o resultado do diagnóstico.
      </p>
    ),
  },
  {
    number: "04",
    title: "Marketing opcional",
    body: (
      <p>
        Você pode optar por receber dicas e novidades da Konvert pelo WhatsApp — essa opção vem desmarcada por
        padrão e recusá-la nunca impede que você veja o seu resultado.
      </p>
    ),
  },
  {
    number: "05",
    title: "Exclusão dos dados",
    body: (
      <p>
        Ainda não existe um fluxo automático de exclusão nesta fase do produto, mas você pode solicitar a
        remoção dos seus dados a qualquer momento pelos canais de contato da Konvert.
      </p>
    ),
  },
  {
    number: "06",
    title: "Natureza do resultado",
    body: (
      <p>
        O resultado é uma estimativa autodeclarada, calculada a partir das respostas que você informou — não é
        uma auditoria contábil nem substitui acompanhamento profissional.
      </p>
    ),
  },
];

export default function PrivacidadePage() {
  return (
    <>
      <SiteHeader context="Privacidade" actionLabel="Voltar" actionHref="/" />

      <section className="privacy-screen">
        <div className="privacy-wrap page-width">
          <aside className="privacy-intro">
            <p className="eyebrow">Privacidade</p>
            <h1>
              Seus dados,
              <br />
              em linguagem clara.
            </h1>
            <p>O Raio-X usa apenas as informações necessárias para calcular e salvar o seu diagnóstico.</p>
            <span>Versão {formatVersionDate(CONSENT_TEXT_VERSION)}</span>
          </aside>

          <div className="legal-list">
            {SECTIONS.map((section) => (
              <article key={section.number}>
                <span>{section.number}</span>
                <div>
                  <h2>{section.title}</h2>
                  {section.body}
                </div>
              </article>
            ))}
            <div className="legal-note">
              <strong>WhatsApp não é senha.</strong> O acesso ao resultado acontece pelo link ou pelo mesmo
              navegador/dispositivo usado no diagnóstico — não existe (e não existirá) uma tela onde basta
              digitar o número para recuperar um resultado.
            </div>
          </div>
        </div>

        <div className="privacy-footer page-width">
          <span>Última atualização: {formatVersionDate(CONSENT_TEXT_VERSION)}</span>
        </div>
      </section>
    </>
  );
}

function formatVersionDate(version: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(version);
  if (!match) return version;
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}
