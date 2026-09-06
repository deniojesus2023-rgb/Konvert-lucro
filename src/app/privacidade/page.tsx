import type { Metadata } from "next";
import Link from "next/link";
import { CONSENT_TEXT_VERSION } from "@/lib/config/consent";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Política de Privacidade — Konvert",
};

const SECTIONS: { number: string; title: string; body: React.ReactNode }[] = [
  {
    number: "01",
    title: "Dados coletados",
    body: (
      <p>
        Coletamos as respostas que você dá no Raio-X do Lucro — valores de vendas e custos,
        sempre nos estados que você escolher: exato, aproximado, faixa, &ldquo;não sei&rdquo;
        ou &ldquo;não tenho esse custo&rdquo; — e, ao final, seu nome e WhatsApp.
      </p>
    ),
  },
  {
    number: "02",
    title: "Uso do diagnóstico",
    body: (
      <p>
        Os dados são usados exclusivamente para calcular lucro, margem, ponto de equilíbrio e
        métricas relacionadas — nenhuma outra finalidade além do funcionamento do próprio
        Raio-X do Lucro.
      </p>
    ),
  },
  {
    number: "03",
    title: "Como o resultado é guardado",
    body: (
      <p>
        O acesso acontece por um link longo e aleatório, gerado só para você. Esse link não
        contém seu nome, seu WhatsApp nem nenhum outro dado pessoal — só o resultado do
        diagnóstico.
      </p>
    ),
  },
  {
    number: "04",
    title: "Marketing opcional",
    body: (
      <p>
        Você pode optar por receber dicas e novidades da Konvert pelo WhatsApp — essa opção
        vem desmarcada por padrão e recusá-la nunca impede que você veja o seu resultado.
      </p>
    ),
  },
  {
    number: "05",
    title: "Exclusão dos dados",
    body: (
      <p>
        Ainda não existe um fluxo automático de exclusão nesta fase do produto, mas você pode
        solicitar a remoção dos seus dados a qualquer momento pelos canais de contato da
        Konvert.
      </p>
    ),
  },
  {
    number: "06",
    title: "Natureza do resultado",
    body: (
      <p>
        O resultado é uma estimativa autodeclarada, calculada a partir das respostas que você
        informou — não é uma auditoria contábil nem substitui acompanhamento profissional.
      </p>
    ),
  },
];

export default function PrivacidadePage() {
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="border-b border-line px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-auto" />
            <span className="text-ink-faint">/</span>
            <span className="text-sm text-ink-soft">Privacidade</span>
          </div>
          <Link href="/" className="text-sm text-blue-primary hover:underline">
            Voltar ao início <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
          <div className="flex flex-col gap-3 lg:sticky lg:top-14 lg:self-start">
            <p className="text-sm font-medium tracking-wide text-blue-primary">PRIVACIDADE</p>
            <h1 className="text-4xl font-semibold leading-tight text-ink">
              Seus dados, em linguagem clara.
            </h1>
            <p className="text-lg text-ink-soft">
              O Raio-X usa apenas as informações necessárias para calcular e salvar o seu
              diagnóstico.
            </p>
            <p className="text-sm text-ink-faint">Versão {formatVersionDate(CONSENT_TEXT_VERSION)}</p>
          </div>

          <div>
            <div className="flex flex-col divide-y divide-line border-t border-line">
              {SECTIONS.map((section) => (
                <div key={section.number} className="flex gap-6 py-6">
                  <span className="w-8 shrink-0 text-lg text-ink-faint">{section.number}</span>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
                    <div className="text-ink-soft">{section.body}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-light/50 p-5 text-ink">
              <span className="font-semibold">WhatsApp não é senha.</span> O acesso ao
              resultado acontece pelo link ou pelo mesmo navegador/dispositivo usado no
              diagnóstico — não existe (e não existirá) uma tela onde basta digitar o número
              para recuperar um resultado.
            </div>

            <p className="mt-6 text-sm text-ink-faint">
              Última atualização: {formatVersionDate(CONSENT_TEXT_VERSION)}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatVersionDate(version: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(version);
  if (!match) return version;
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}
