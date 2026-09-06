import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        <Logo className="h-6 w-auto" />
        <p className="text-sm text-ink-faint">Do pedido ao lucro.</p>
        <Link href="/privacidade" className="text-sm text-blue-primary hover:underline">
          Política de privacidade
        </Link>
        <p className="max-w-md text-xs text-ink-faint">
          Todo resultado do Raio-X do Lucro é uma estimativa autodeclarada com base nas
          respostas informadas — não é uma auditoria contábil.
        </p>
      </div>
    </footer>
  );
}
