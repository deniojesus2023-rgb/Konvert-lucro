import { Button } from "@/components/ui/Button";
import { ReviseButton } from "./ReviseButton";

interface OfferBridgeProps {
  /** Total of every resolved cost group, in cents — carried into the offer page. */
  knownCostsTotalCents: number;
}

export function OfferBridge({ knownCostsTotalCents }: OfferBridgeProps) {
  return (
    <div className="result-cta">
      <div>
        <h2>Seu lucro muda todos os dias.</h2>
        <p>Acompanhe vendas e custos para perceber desvios antes que eles cresçam.</p>
      </div>
      <div className="result-cta-actions">
        <Button href={`/oferta?custos=${knownCostsTotalCents}`}>
          Quero acompanhar meu lucro <span aria-hidden="true">→</span>
        </Button>
        <ReviseButton />
      </div>
    </div>
  );
}
