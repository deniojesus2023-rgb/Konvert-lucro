import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export function Header() {
  return (
    <header className="border-b border-line bg-canvas">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Logo priority className="h-7 w-auto sm:h-8" />
          <span className="hidden text-sm text-ink-faint sm:inline">Do pedido ao lucro.</span>
        </div>
        <Button href="/raio-x" size="compact">
          Fazer diagnóstico grátis
        </Button>
      </div>
    </header>
  );
}
