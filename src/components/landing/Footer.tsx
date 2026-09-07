import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="landing-footer page-width">
      <Logo />
      <Link href="/privacidade" className="text-link">
        Política de privacidade
      </Link>
      <p>Uma estimativa autodeclarada, calculada a partir das suas respostas.</p>
    </footer>
  );
}
