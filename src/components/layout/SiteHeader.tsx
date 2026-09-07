import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

interface SiteHeaderProps {
  context: string;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
  hidden?: boolean;
}

/** The shared header — logo, context label, one action — identical across every screen. */
export function SiteHeader({ context, actionLabel, actionHref, onAction, hidden }: SiteHeaderProps) {
  if (hidden) return null;

  return (
    <header className="site-header">
      <Link href="/" className="brand-button" aria-label="Ir para o início">
        <Logo className="brand-logo" priority />
      </Link>
      <span className="header-context">{context}</span>
      {actionHref ? (
        <Link href={actionHref} className="header-action">
          {actionLabel}
        </Link>
      ) : (
        <button type="button" className="header-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </header>
  );
}
