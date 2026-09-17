import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Group } from "./Group";
import { ListRow } from "./ListRow";
import { MacroBar } from "./MacroBar";
import { Notice } from "./Notice";
import { Reckoning } from "./Reckoning";
import { SegmentedControl } from "./SegmentedControl";
import { Stat } from "./Stat";
import { Stepper } from "./Stepper";
import { TabBar } from "./TabBar";

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
      <ListRow expanded={false} onClick={vi.fn()} selected>
        Almoço
      </ListRow>,
    );
    expect(screen.getByRole("button", { name: "Almoço" })).toHaveAttribute("aria-expanded", "false");

    rerender(
      <ListRow expanded onClick={vi.fn()} selected trailing={<span>612</span>}>
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
    expect(screen.getByText("150 de 135 g")).toBeInTheDocument();
  });

  it("MacroBar com alvo zero não divide por zero", () => {
    render(<MacroBar name="Carboidrato" value={30} target={0} />);
    expect(screen.getByRole("progressbar", { name: /Carboidrato/ })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });
});

describe("Group", () => {
  it("nao intercala elemento nenhum entre os filhos", () => {
    // O fio sai de `::before` no proprio filho. Se o grupo inserisse um `<div>`
    // separador, uma lista de 5 linhas viraria 9 nos — e a ultima ganharia um
    // fio que ninguem pediu.
    const { container } = render(
      <Group>
        <ListRow>Primeira</ListRow>
        <ListRow>Segunda</ListRow>
        <ListRow>Terceira</ListRow>
      </Group>,
    );
    expect(container.querySelector(".co-group")?.children).toHaveLength(3);
  });

  it("o recuo do fio vai para o DOM, que e onde o CSS le", () => {
    const { container } = render(
      <Group inset="dot">
        <ListRow>Proteina</ListRow>
      </Group>,
    );
    expect(container.querySelector(".co-group")).toHaveAttribute("data-inset", "dot");
  });

  it("rotulo e nota ficam FORA da caixa", () => {
    const { container } = render(
      <Group label="Macros" note="A soma encosta na meta.">
        <ListRow>Proteina</ListRow>
      </Group>,
    );
    const caixa = container.querySelector(".co-group");
    expect(caixa).not.toHaveTextContent("Macros");
    expect(caixa).not.toHaveTextContent("A soma encosta na meta.");
    expect(screen.getByText("Macros")).toBeInTheDocument();
    expect(screen.getByText("A soma encosta na meta.")).toBeInTheDocument();
  });
});

describe("ListRow com marca de escolha", () => {
  it("vira radio de verdade, e nao um botao que parece marcado", () => {
    render(
      <Group inset="mark" role="radiogroup" aria-label="Formula">
        <ListRow mark selected onClick={vi.fn()}>
          Katch-McArdle
        </ListRow>
        <ListRow mark onClick={vi.fn()}>
          Mifflin-St Jeor
        </ListRow>
      </Group>,
    );
    expect(screen.getByRole("radio", { name: "Katch-McArdle" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Mifflin-St Jeor" })).not.toBeChecked();
  });
});

describe("Reckoning", () => {
  it("separa a linha do resultado das parcelas", () => {
    const { container } = render(
      <Reckoning
        lines={[
          { label: "Meta do dia", value: "1.917" },
          { label: "Alimentos registrados", value: "− 922" },
          { label: "Restante", value: "995", total: true },
        ]}
      />,
    );
    const linhas = container.querySelectorAll(".co-reckoning__line");
    expect(linhas).toHaveLength(3);
    expect(linhas[0]).not.toHaveAttribute("data-total");
    expect(linhas[2]).toHaveAttribute("data-total", "true");
  });

  it("mostra a expressao junto do resultado", () => {
    // O arredondamento aparece porque ele existe: 1.433,4 + 937,5 = 2.370,9,
    // e esconder a casa decimal daria uma soma que nao fecha para quem confere.
    render(
      <Reckoning
        lines={[
          { label: "Formula", expression: "2.312 × 62%", value: "1.433,4" },
          { label: "Gasto de hoje", expression: "2.370,9 arredondado", value: "2.371", total: true },
        ]}
      />,
    );
    expect(screen.getByText("2.312 × 62%")).toBeInTheDocument();
    expect(screen.getByText("2.370,9 arredondado")).toBeInTheDocument();
  });
});

describe("TabBar", () => {
  const ABAS = [
    { value: "diario", label: "Diário", icon: "book" },
    { value: "gasto", label: "Gasto", icon: "chart" },
  ] as const;

  it("a aba atual nao depende so da cor", () => {
    // Cor, peso e `aria-current`. Aqui da para conferir o terceiro, que e o
    // unico que o teste alcanca — e o que o leitor de tela usa.
    render(<TabBar label="Seções" items={ABAS} value="gasto" onChange={vi.fn()} position="static" />);
    expect(screen.getByRole("button", { name: "Gasto" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Diário" })).not.toHaveAttribute("aria-current");
  });

  it("e uma navegacao com nome", () => {
    render(<TabBar label="Seções do Basalto" items={ABAS} value="diario" onChange={vi.fn()} position="static" />);
    expect(screen.getByRole("navigation", { name: "Seções do Basalto" })).toBeInTheDocument();
  });

  it("troca de aba pelo clique", async () => {
    const usuario = userEvent.setup();
    const aoTrocar = vi.fn();
    render(<TabBar label="Seções" items={ABAS} value="diario" onChange={aoTrocar} position="static" />);
    await usuario.click(screen.getByRole("button", { name: "Gasto" }));
    expect(aoTrocar).toHaveBeenCalledWith("gasto");
  });
});
