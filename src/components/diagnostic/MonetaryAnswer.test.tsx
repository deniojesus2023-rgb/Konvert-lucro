// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonetaryAnswer } from "./MonetaryAnswer";

describe("MonetaryAnswer", () => {
  it("reports null (incomplete) until a value is typed, then informed once filled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MonetaryAnswer
        id="revenue"
        label="Quanto vendeu?"
        zeroLabel="Não tive vendas no período"
        value={undefined}
        onChange={onChange}
      />,
    );

    // Mounts on "exact" mode with an empty field -> incomplete.
    expect(onChange).toHaveBeenLastCalledWith(null);

    await user.type(screen.getByLabelText("Quanto vendeu?"), "5000");

    expect(onChange).toHaveBeenLastCalledWith({ kind: "informed", value: 500_000 });
  });

  it("switching to 'Não sei' reports the unknown state, never a zero", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MonetaryAnswer
        id="cost_production"
        label="Produção"
        zeroLabel="Não tenho esse custo"
        value={undefined}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Não sei informar" }));

    expect(onChange).toHaveBeenLastCalledWith({ kind: "unknown" });
  });

  it("switching to the zero option reports zero_confirmed with the field's own label", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MonetaryAnswer
        id="cost_production"
        label="Produção"
        zeroLabel="Não tenho esse custo"
        value={undefined}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Não tenho esse custo" }));

    expect(onChange).toHaveBeenLastCalledWith({ kind: "zero_confirmed" });
  });

  it("an open range (no 'até') never invents a midpoint", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MonetaryAnswer
        id="cost_fees"
        label="Taxas"
        zeroLabel="Não tenho esse custo"
        value={undefined}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Uma faixa" }));
    await user.type(screen.getByLabelText("Valor mínimo"), "5000");

    expect(onChange).toHaveBeenLastCalledWith({ kind: "range", min: 500_000, max: null });
  });
});
