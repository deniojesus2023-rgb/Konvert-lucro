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
    <div className="contact-fields">
      <div className="input-group">
        <label htmlFor="contact-name" className="field-label">
          Nome
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Como podemos te chamar?"
          value={contact.name}
          onChange={(event) => onChange({ ...contact, name: event.target.value })}
          className="line-input small"
        />
      </div>

      <div className="input-group">
        <label htmlFor="contact-whatsapp" className="field-label">
          WhatsApp
        </label>
        <input
          id="contact-whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={contact.whatsapp}
          onChange={(event) => onChange({ ...contact, whatsapp: event.target.value })}
          className="line-input small"
        />
      </div>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={contact.contactConsent}
          onChange={(event) => onChange({ ...contact, contactConsent: event.target.checked })}
        />
        <span>
          Autorizo a Konvert a armazenar meu nome, WhatsApp e respostas para gerar, salvar e permitir o acesso a
          este diagnóstico. Veja a{" "}
          <Link href="/privacidade" className="text-link">
            política de privacidade
          </Link>
          .
        </span>
      </label>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={contact.marketingOptIn}
          onChange={(event) => onChange({ ...contact, marketingOptIn: event.target.checked })}
        />
        <span>Quero receber dicas e novidades da Konvert pelo WhatsApp.</span>
      </label>
    </div>
  );
}

export const CAPTURE_STEP_META = {
  title: "Seu diagnóstico está pronto.",
};
