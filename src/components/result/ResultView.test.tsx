// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ReviseButton/ResultNav (rendered via useRevise -> useRouter) live outside
// a real Next.js app router tree in these tests, which throws — mocked
// here since these tests are about the result content, not navigation.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
import { toCents } from "@/domain/money/cents";
import { calculateProfit } from "@/domain/diagnostic/calculate-profit";
import type { ResponseState } from "@/domain/diagnostic/response-state";
import type { DiagnosticInput } from "@/domain/diagnostic/types";
import { ResultView } from "./ResultView";

function informed(reais: number): ResponseState<import("@/domain/money/cents").Cents> {
  return { kind: "informed", value: toCents(reais * 100) };
}

const zeroConfirmed = { kind: "zero_confirmed" as const };
const unknown = { kind: "unknown" as const };

function baseInput(overrides: Partial<DiagnosticInput> = {}): DiagnosticInput {
  return {
    revenue: informed(50_000),
    costs: {
      production: informed(15_000),
      fees: informed(10_000),
      delivery: informed(5_000),
      fixedStructure: informed(10_000),
    },
    taxes: { classification: "variable", state: zeroConfirmed },
    orders: { kind: "informed", value: 1000 },
    goal: informed(5_000),
    ...overrides,
  };
}

function renderResult(input: DiagnosticInput) {
  const result = calculateProfit(input);
  render(
    <ResultView formulaVersion={result.formulaVersion} deliveryType={null} mainChannel={null} result={result} />,
  );
  return result;
}

describe("ResultView — profit available", () => {
  it("shows the take-home-per-R$100 headline and the profit/margin figures", () => {
    renderResult(baseInput());

    expect(screen.getByText(/De cada R\$100 vendidos, R\$20 ficaram no seu delivery\./)).toBeInTheDocument();
    const profitBlock = screen.getByText("Lucro mensal estimado").closest("div")!;
    expect(profitBlock.textContent).toContain("10.000,00");
    expect(screen.getByText("20,00%")).toBeInTheDocument();
  });

  it("always shows the self-reported disclaimer, even when fully available", () => {
    renderResult(baseInput());
    expect(screen.getByText(/estimativa autodeclarada/i)).toBeInTheDocument();
  });
});

describe("ResultView — loss", () => {
  it("shows the negative-result copy, not a hidden or humiliating message", () => {
    renderResult(
      baseInput({
        revenue: informed(10_000),
        costs: {
          production: informed(5_000),
          fees: informed(3_000),
          delivery: informed(2_000),
          fixedStructure: informed(2_000),
        },
      }),
    );

    expect(
      screen.getByText(/resultado negativo estimado de R\$2\.000,00 no período/),
    ).toBeInTheDocument();
  });
});

describe("ResultView — goal", () => {
  it("shows 'superou a meta' when the goal was already exceeded", () => {
    renderResult(baseInput({ goal: informed(5_000) })); // profit R$10.000 > goal R$5.000
    const row = screen.getByText("Superou a meta em").closest("div")!;
    expect(row.textContent).toContain("R$5.000,00");
  });

  it("shows how much is missing when the goal wasn't reached yet", () => {
    renderResult(baseInput({ goal: informed(50_000) })); // profit R$10.000 < goal R$50.000
    const row = screen.getByText("Faltam para a meta").closest("div")!;
    expect(row.textContent).toContain("R$40.000,00");
  });
});

describe("ResultView — partial result (profit unavailable)", () => {
  it("shows the 'saldo antes dos custos não informados' — never calling it profit", () => {
    renderResult(
      baseInput({
        costs: {
          production: informed(15_000),
          fees: informed(10_000),
          delivery: informed(5_000),
          fixedStructure: unknown,
        },
      }),
    );

    expect(screen.getByText("Ainda não dá para estimar seu lucro com segurança.")).toBeInTheDocument();
    expect(screen.getByText("Saldo antes dos custos não informados")).toBeInTheDocument();
    expect(screen.queryByText(/^Lucro mensal estimado$/)).not.toBeInTheDocument();
    // The blind spot is listed, never silently treated as zero.
    expect(screen.getByText("O que falta informar")).toBeInTheDocument();
    expect(screen.getByText("Estrutura")).toBeInTheDocument();
  });

  it("shows 'resultado antes dos impostos' when only taxes are missing", () => {
    renderResult(baseInput({ taxes: { classification: "variable", state: unknown } }));

    expect(screen.getByText("Resultado antes dos impostos")).toBeInTheDocument();
    expect(screen.getByText(/nunca deve ser lido como lucro final/)).toBeInTheDocument();
  });
});

describe("ResultView — estimated inputs", () => {
  it("shows the estimate badge when hasEstimatedInputs is true", () => {
    renderResult(
      baseInput({
        revenue: { kind: "estimated", origin: "typed", value: toCents(50_000_00) },
      }),
    );
    expect(screen.getByText("Contém valores aproximados")).toBeInTheDocument();
    expect(screen.getByText(/Estas respostas foram aproximadas/)).toBeInTheDocument();
  });

  it("does not show the badge when nothing was estimated", () => {
    renderResult(baseInput());
    expect(screen.queryByText("Contém valores aproximados")).not.toBeInTheDocument();
  });
});

describe("ResultView — blind spots never join the known-costs statement", () => {
  it("keeps an unknown cost out of 'O que já sabemos', listed only under 'O que falta informar'", () => {
    renderResult(
      baseInput({
        costs: {
          production: informed(15_000),
          fees: informed(10_000),
          delivery: unknown,
          fixedStructure: informed(10_000),
        },
      }),
    );
    const knownSection = screen.getByText("O que já sabemos").closest("div")!;
    expect(knownSection.textContent).not.toContain("Entregas");
    expect(screen.getByText("O que falta informar").closest("div")!.textContent).toContain("Entregas");
  });
});
