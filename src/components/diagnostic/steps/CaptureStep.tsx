import Link from "next/link";

export interface ContactFormState {
  name: string;
  whatsapp: string;
  contactConsent: boolean;
  marketingOptIn: boolean;
}

export function emptyContactFormState(): ContactFormState {
  return { name: "", whatsapp: "", contactConsent: false, marketingOptIn: false };
}

export function isContactFormComplete(contact: ContactFormState): boolean {
  const digits = contact.whatsapp.replace(/\D/g, "");
  return contact.name.trim().length > 0 && digits.length >= 10 && contact.contactConsent;
}

interface CaptureStepProps {
  contact: ContactFormState;
  onChange: (contact: ContactFormState) => void;
}

export function CaptureStep({ contact, onChange }: CaptureStepProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-name" className="text-sm text-ink-soft">
          Seu nome
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          value={contact.name}
          onChange={(event) => onChange({ ...contact, name: event.target.value })}
          className="border-b border-line-strong bg-transparent pb-2 text-2xl font-semibold text-ink outline-none transition-colors focus:border-blue-primary sm:text-3xl"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-whatsapp" className="text-sm text-ink-soft">
          WhatsApp
        </label>
        <input
          id="contact-whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 98888-7777"
          value={contact.whatsapp}
          onChange={(event) => onChange({ ...contact, whatsapp: event.target.value })}
          className="border-b border-line-strong bg-transparent pb-2 text-2xl font-semibold text-ink outline-none placeholder:font-normal placeholder:text-ink-faint transition-colors focus:border-blue-primary sm:text-3xl"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={contact.contactConsent}
          onChange={(event) => onChange({ ...contact, contactConsent: event.target.checked })}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-line-strong text-blue-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-primary"
        />
        <span>
          Autorizo a Konvert a armazenar meu nome, WhatsApp e respostas para gerar, salvar e
          permitir o acesso a este diagnóstico. Veja a{" "}
          <Link href="/privacidade" className="text-blue-primary hover:underline">
            política de privacidade
          </Link>
          .
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={contact.marketingOptIn}
          onChange={(event) => onChange({ ...contact, marketingOptIn: event.target.checked })}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-line-strong text-blue-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-primary"
        />
        <span>
          Quero receber dicas e novidades da Konvert pelo WhatsApp.{" "}
          <span className="text-ink-faint">Opcional</span>
        </span>
      </label>
    </div>
  );
}

export const CAPTURE_STEP_META = {
  title: "Seu diagnóstico está pronto.",
};
