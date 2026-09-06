import type { Metadata } from "next";
import Link from "next/link";
import { CONSENT_TEXT_VERSION } from "@/lib/config/consent";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Política de Privacidade — Konvert",
};

export default function PrivacidadePage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="border-b border-blue-light px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <Link href="/">
            <Logo className="h-7 w-auto" />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12 text-navy/80">
        <h1 className="text-3xl font-semibold text-navy">Política de privacidade</h1>
        <p className="text-sm text-navy/50">Versão do texto de consentimento: {CONSENT_TEXT_VERSION}</p>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-navy">Quais dados coletamos</h2>
          <p>
            Coletamos as respostas que você dá no Raio-X do Lucro (valores de vendas e custos,
            sempre nos estados que você escolher: exato, aproximado, faixa, &ldquo;não sei&rdquo;
            ou &ldquo;não tenho esse custo&rdquo;) e, ao final, seu nome e WhatsApp.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-navy">Para que usamos o diagnóstico</h2>
          <p>
            As respostas são usadas exclusivamente para calcular o seu resultado — lucro
            estimado, margem, ponto de equilíbrio e métricas relacionadas — e não para nenhuma
            outra finalidade além do funcionamento do próprio Raio-X do Lucro.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-navy">Como o resultado é guardado</h2>
          <p>
            O resultado calculado fica salvo e pode ser reaberto por um link com um código longo
            e aleatório, gerado só para você. Esse link não contém seu nome, seu WhatsApp nem
            nenhum outro dado pessoal — só o resultado do diagnóstico.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-navy">WhatsApp não é senha</h2>
          <p>
            O WhatsApp que você informa não funciona como forma de acessar diagnósticos
            anteriores — não existe (e não existirá) uma tela onde basta digitar o número para
            recuperar um resultado. O acesso é sempre pelo link do resultado ou pelo mesmo
            navegador/dispositivo usado para responder o diagnóstico.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-navy">Marketing é opcional</h2>
          <p>
            Você pode optar por receber dicas e novidades da Konvert pelo WhatsApp — essa opção
            fica desmarcada por padrão e recusá-la nunca impede que você veja o seu resultado.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-navy">Exclusão dos seus dados</h2>
          <p>
            Ainda não existe um fluxo automático de exclusão nesta fase do produto, mas você
            pode solicitar a remoção dos seus dados a qualquer momento entrando em contato pelos
            canais informados na landing page.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-navy">O resultado é uma estimativa</h2>
          <p>
            Todo resultado do Raio-X do Lucro é uma estimativa autodeclarada, calculada a partir
            das respostas que você informou — não é uma auditoria contábil nem substitui
            acompanhamento profissional.
          </p>
        </section>
      </main>
    </div>
  );
}
