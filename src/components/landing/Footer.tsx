import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <Logo className="h-6 w-auto" />
          <p className="text-sm text-ink-faint">Mais clareza para um delivery mais lucrativo.</p>
        </div>
        <Link href="/privacidade" className="text-sm text-blue-primary hover:underline">
          Política de privacidade
        </Link>
      </div>
    </footer>
  );
}
