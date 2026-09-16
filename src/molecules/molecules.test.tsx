import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ListRow } from "./ListRow";
import { MacroBar } from "./MacroBar";
import { Notice } from "./Notice";
import { SegmentedControl } from "./SegmentedControl";
import { Stat } from "./Stat";
import { Stepper } from "./Stepper";

const ESTRATEGIAS = [
  { value: "padrao", label: "Padrão" },
  { value: "baixo", label: "Baixa em carbo" },
  { value: "ceto", label: "Cetogênica" },
] as const;

function Segmentado() {
  const [valor, definir] = useState<(typeof ESTRATEGIAS)[number]["value"]>("padrao");
  return (
    <SegmentedControl
      label="Estratégia de macros"
      options={ESTRATEGIAS}
      value={valor}
      onChange={definir}
    />
  );
}

describe("SegmentedControl", () => {
  it("é um radiogroup, e não um punhado de botões", () => {
    render(<Segmentado />);
    expect(screen.getByRole("radiogroup", { name: "Estratégia de macros" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Padrão" })).toBeChecked();
  });

  it("só a opção marcada entra na ordem do Tab", () => {
    render(<Segmentado />);
    expect(screen.getByRole("radio", { name: "Padrão" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Cetogênica" })).toHaveAttribute("tabindex", "-1");
  });

  it("anda com as setas e dá a volta na ponta", async () => {
    const usuario = userEvent.setup();
    render(<Segmentado />);
    const primeira = screen.getByRole("radio", { name: "Padrão" });
    primeira.focus();

    await usuario.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Baixa em carbo" })).toBeChecked();

    // Da última para a direita volta à primeira: parar na ponta obriga a
    // atravessar o grupo inteiro de volta.
    await usuario.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Padrão" })).toBeChecked();

    await usuario.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Cetogênica" })).toBeChecked();
  });

  it("Home e End vão para as pontas", async () => {
    const usuario = userEvent.setup();
    render(<Segmentado />);
    screen.getByRole("radio", { name: "Padrão" }).focus();

    await usuario.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "Cetogênica" })).toBeChecked();

    await usuario.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "Padrão" })).toBeChecked();
  });

  it("clique também escolhe", async () => {
    const usuario = userEvent.setup();
    render(<Segmentado />);
    await usuario.click(screen.getByRole("radio", { name: "Cetogênica" }));
    expect(screen.getByRole("radio", { name: "Cetogênica" })).toBeChecked();
  });
});

describe("Stepper", () => {
  it("respeita piso e teto desabilitando o botão", () => {
    const { rerender } = render(<Stepper label="porções" value={1} min={1} max={6} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Diminuir porções" })).toBeDisabled();

    rerender(<Stepper label="porções" value={6} min={1} max={6} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Aumentar porções" })).toBeDisabled();
  });

  it("anda pelo passo", async () => {
    const usuario = userEvent.setup();
    const aoMudar = vi.fn();
    render(<Stepper label="gramas" value={100} step={10} min={10} onChange={aoMudar} />);

    await usuario.click(screen.getByRole("button", { name: "Aumentar gramas" }));
    expect(aoMudar).toHaveBeenCalledWith(110);

    await usuario.click(screen.getByRole("button", { name: "Diminuir gramas" }));
    expect(aoMudar).toHaveBeenCalledWith(90);
  });

  it("formata o que aparece sem mexer no valor", () => {
    render(
      <Stepper label="porções" value={4} onChange={vi.fn()} format={(n) => `${n} colheres`} />,
    );
    expect(screen.getByText("4 colheres")).toBeInTheDocument();
  });
});

describe("ListRow", () => {
  it("com onClick sai botão de verdade, e responde ao Enter", async () => {
    const usuario = userEvent.setup();
    const aoClicar = vi.fn();
    render(<ListRow onClick={aoClicar}>Almoço</ListRow>);

    const linha = screen.getByRole("button", { name: "Almoço" });
    linha.focus();
    await usuario.keyboard("{Enter}");

    // Um div com onClick não faria isto — e é por isso que ele não é opção.
    expect(aoClicar).toHaveBeenCalledOnce();
  });

  it("sem onClick não vira controle", () => {
    render(<ListRow>Café da manhã</ListRow>);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("anuncia aberto e fechado", () => {
    const { rerender } = render(
      <ListRow expanded={false} onClick={vi.fn()} marker selected>
        Almoço
      </ListRow>,
    );
    expect(screen.getByRole("button", { name: "Almoço" })).toHaveAttribute("aria-expanded", "false");

    rerender(
      <ListRow expanded onClick={vi.fn()} marker selected trailing={<span>612</span>}>
        Almoço
      </ListRow>,
    );
    expect(screen.getByRole("button", { name: /Almoço/ })).toHaveAttribute("aria-expanded", "true");
  });
});

describe("Notice, Stat e MacroBar", () => {
  it("o aviso é status, e não alerta", () => {
    // Alerta interrompe o leitor de tela; aqui o aviso INFORMA e nada bloqueia.
    render(<Notice title="Ritmo ajustado">A conta usou 0,85 kg por semana.</Notice>);
    const aviso = screen.getByRole("status");
    expect(aviso).toHaveAttribute("aria-live", "polite");
    expect(aviso).toHaveTextContent("Ritmo ajustado");
  });

  it("o aviso aceita o tom neutro", () => {
    render(
      <Notice title="Sem rede" tone="status" live="off">
        O registro entra na fila.
      </Notice>,
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-tone", "status");
  });

  it("Stat mostra rótulo, número e a procedência", () => {
    render(<Stat label="Restante hoje" value="995" unit="kcal" caption="de 1.917 kcal" size="hero" />);
    expect(screen.getByText("Restante hoje")).toBeInTheDocument();
    expect(screen.getByText("995")).toBeInTheDocument();
    expect(screen.getByText("de 1.917 kcal")).toBeInTheDocument();
  });

  it("MacroBar não grampeia o excedente, porque passar do alvo é informação", () => {
    render(<MacroBar name="Proteína" value={150} target={135} />);
    const barra = screen.getByRole("progressbar", { name: /Proteína/ });
    // A ripa satura em 100% no desenho; o número ao lado continua contando a verdade.
    expect(barra).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("150 / 135 g")).toBeInTheDocument();
  });

  it("MacroBar com alvo zero não divide por zero", () => {
    render(<MacroBar name="Carboidrato" value={30} target={0} />);
    expect(screen.getByRole("progressbar", { name: /Carboidrato/ })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });
});
