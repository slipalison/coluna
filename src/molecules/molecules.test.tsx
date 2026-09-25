import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Diff } from "./Diff";
import { Disclosure } from "./Disclosure";
import { EmptyState } from "./EmptyState";
import { Field } from "./Field";
import { Group } from "./Group";
import { Legend } from "./Legend";
import { ListRow } from "./ListRow";
import { MacroBar } from "./MacroBar";
import { NavList } from "./NavList";
import { Notice } from "./Notice";
import { PageHeader } from "./PageHeader";
import { Pager } from "./Pager";
import { Rail } from "./Rail";
import { Reckoning } from "./Reckoning";
import { SegmentedControl } from "./SegmentedControl";
import { Sheet } from "./Sheet";
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

  it("sem resposta escolhida, o grupo NAO some da ordem do Tab", () => {
    // O tabindex itinerante tinha um buraco: com `value` fora da lista, toda
    // opcao caia em `-1` e o grupo inteiro deixava de ser alcancavel pelo
    // teclado — de forma silenciosa, porque na tela nada mudava. Quem chegasse
    // pelo Tab passava por cima e nao tinha como responder.
    render(
      <SegmentedControl
        label="Estratégia de macros"
        options={ESTRATEGIAS}
        value={"" as (typeof ESTRATEGIAS)[number]["value"]}
        onChange={vi.fn()}
      />,
    );

    const opcoes = screen.getAllByRole("radio");
    expect(opcoes.filter((opcao) => opcao.getAttribute("tabindex") === "0")).toHaveLength(1);
    expect(opcoes[0]).toHaveAttribute("tabindex", "0");
    // E nenhuma delas mente dizendo que esta marcada.
    for (const opcao of opcoes) expect(opcao).not.toBeChecked();
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

  it("escolha unica e redonda; marque-quantas-quiser e quadrada", () => {
    // O que este caso protege nao e estetica: a forma da marca e a unica coisa
    // que separa as duas perguntas antes de a pessoa tocar em qualquer lugar.
    // Uma marca quadrada num `role="radio"` diz "marque quantas quiser" a quem
    // enxerga e "escolha uma" a quem escuta.
    const { container } = render(
      <>
        <ListRow mark="single" onClick={vi.fn()}>
          Feminino
        </ListRow>
        <ListRow mark="multiple" onClick={vi.fn()}>
          Sem gluten
        </ListRow>
      </>,
    );

    expect(screen.getByRole("radio", { name: "Feminino" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Sem gluten" })).toBeInTheDocument();

    const marcas = container.querySelectorAll(".co-list-row__mark");
    expect(marcas[0]).toHaveAttribute("data-mark", "single");
    expect(marcas[1]).toHaveAttribute("data-mark", "multiple");
  });

  it("`mark` booleano continua sendo escolha unica", () => {
    // Compatibilidade: `mark` nasceu booleano e ja emitia `role="radio"`. O que
    // mudou foi a forma passar a concordar com o papel, e nao o papel.
    const { container } = render(
      <ListRow mark onClick={vi.fn()}>
        Katch-McArdle
      </ListRow>,
    );
    expect(screen.getByRole("radio", { name: "Katch-McArdle" })).toBeInTheDocument();
    expect(container.querySelector(".co-list-row__mark")).toHaveAttribute("data-mark", "single");
  });

  it("`mark={false}` nao desenha marca nenhuma nem inventa papel", () => {
    const { container } = render(
      <ListRow mark={false} onClick={vi.fn()}>
        Almoco
      </ListRow>,
    );
    expect(container.querySelector(".co-list-row__mark")).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.getByRole("button", { name: "Almoco" })).not.toHaveAttribute("aria-checked");
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

describe("Field", () => {
  it("o rótulo aponta para o controle", () => {
    // `getByLabelText` só acha se a amarração existir de verdade. Um `<label>`
    // solto passa na revisão visual e falha aqui.
    render(
      <Field label="Peso de hoje">
        {(controle) => <Input {...controle} unit="kg" />}
      </Field>,
    );
    expect(screen.getByLabelText("Peso de hoje")).toBeInTheDocument();
  });

  it("a dica e o erro chegam ao campo, e o campo se declara inválido", () => {
    render(
      <Field label="Peso" hint="Entre 30 e 300 kg." error="830 parece um dígito a mais.">
        {(controle) => <Input {...controle} invalid />}
      </Field>,
    );
    const campo = screen.getByLabelText("Peso");
    expect(campo).toHaveAttribute("aria-invalid", "true");

    const ids = (campo.getAttribute("aria-describedby") ?? "").split(" ");
    const textos = ids.map((id) => document.getElementById(id)?.textContent ?? "");
    expect(textos.join(" ")).toContain("Entre 30 e 300 kg.");
    expect(textos.join(" ")).toContain("830 parece um dígito a mais.");
  });

  it("sem erro o campo não se declara inválido", () => {
    render(<Field label="Peso">{(controle) => <Input {...controle} />}</Field>);
    expect(screen.getByLabelText("Peso")).not.toHaveAttribute("aria-invalid");
  });
});

describe("Disclosure", () => {
  it("nasce fechada e abre no clique", async () => {
    const usuario = userEvent.setup();
    const { container } = render(<Disclosure>A conta usa 7.700 kcal por quilo.</Disclosure>);
    const detalhe = container.querySelector("details");
    expect(detalhe).not.toHaveAttribute("open");

    await usuario.click(screen.getByText("por quê?"));
    expect(detalhe).toHaveAttribute("open");
  });

  it("o texto fechado continua na página", () => {
    // É o que faz a busca do navegador (Ctrl+F) encontrar a explicação e a
    // impressão sair com ela. Um acordeão que desmonta o conteúdo perde os dois.
    render(<Disclosure>A conta usa 7.700 kcal por quilo.</Disclosure>);
    expect(screen.getByText("A conta usa 7.700 kcal por quilo.")).toBeInTheDocument();
  });

  it("avisa quem perguntou", async () => {
    const usuario = userEvent.setup();
    const aoAbrir = vi.fn();
    render(<Disclosure onToggle={aoAbrir}>Por isso.</Disclosure>);
    await usuario.click(screen.getByText("por quê?"));
    expect(aoAbrir).toHaveBeenCalledWith(true);
  });
});

describe("EmptyState", () => {
  it("diz o que está vazio e oferece uma saída", () => {
    render(
      <EmptyState
        icon="utensils"
        title="Nada registrado hoje"
        action={<Button>Registrar a primeira refeição</Button>}
      >
        O dia começa em branco.
      </EmptyState>,
    );
    expect(screen.getByText("Nada registrado hoje")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar a primeira refeição" }),
    ).toBeInTheDocument();
  });

  it("sem ação continua sendo uma tela inteira", () => {
    render(<EmptyState title="O gasto medido começa no 14º dia" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Diff", () => {
  it("o par riscado é desenho; a frase é o que se ouve", () => {
    // `<s>` não é anunciado por leitor de tela nenhum e a seta sairia como
    // "seta para a direita". Então o visível some da árvore e a frase entra.
    render(<Diff label="Meta diária" before="1.677" after="1.540" unit="kcal" />);
    expect(screen.getByText("Meta diária: de 1.677 kcal para 1.540 kcal")).toBeInTheDocument();
  });

  it("sem mudança não some da tela", () => {
    // Sumir faria a tela pular por baixo do dedo quando a pessoa volta o valor
    // ao original.
    const { container } = render(<Diff label="Meta diária" before="1.677" after="1.677" />);
    expect(container.firstElementChild).toHaveAttribute("data-changed", "false");
    expect(screen.getByText("Meta diária: 1.677, sem mudança")).toBeInTheDocument();
  });
});

describe("Sheet", () => {
  function Abridor({ mode = "overlay" }: { mode?: "overlay" | "inline" }) {
    const [aberto, definir] = useState(false);
    return (
      <div>
        <button type="button" onClick={() => definir(true)}>
          Trocar a porção
        </button>
        <Sheet open={aberto} mode={mode} title="Trocar a porção" onClose={() => definir(false)}>
          <button type="button">1 unidade média</button>
          <button type="button">100 g</button>
        </Sheet>
      </div>
    );
  }

  it("fechado não existe no documento", () => {
    render(<Abridor />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sobreposto é um diálogo com nome, e o foco entra nele", async () => {
    const usuario = userEvent.setup();
    render(<Abridor />);
    await usuario.click(screen.getByRole("button", { name: "Trocar a porção" }));

    const painel = screen.getByRole("dialog", { name: "Trocar a porção" });
    expect(painel).toHaveAttribute("aria-modal", "true");
    expect(document.activeElement).toBe(painel);
  });

  it("Esc fecha e o foco VOLTA para quem abriu", async () => {
    // O que mais falta por aí: sem a volta, fechar o painel joga o teclado no
    // começo da página e a pessoa perde o lugar que levou vinte teclas para
    // alcançar.
    const usuario = userEvent.setup();
    render(<Abridor />);
    const abridor = screen.getByRole("button", { name: "Trocar a porção" });
    await usuario.click(abridor);
    await usuario.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(abridor);
  });

  it("o botão de fechar tem nome", async () => {
    const usuario = userEvent.setup();
    render(<Abridor />);
    await usuario.click(screen.getByRole("button", { name: "Trocar a porção" }));
    await usuario.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dentro do cartão não é diálogo e não prende ninguém", async () => {
    // "Largura nunca vira modal": no desktop o painel abre dentro do cartão, e
    // a conta do dia continua visível ao lado — que é o motivo de existir a
    // versão larga.
    const usuario = userEvent.setup();
    render(<Abridor mode="inline" />);
    await usuario.click(screen.getByRole("button", { name: "Trocar a porção" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Trocar a porção" })).toBeInTheDocument();
  });
});

describe("Rail", () => {
  const DESTINOS = [
    { value: "diario", label: "Diário", icon: "book", group: "Todo dia" },
    { value: "registrar", label: "Registrar", icon: "plus", group: "Todo dia" },
    { value: "ajustes", label: "Ajustes", icon: "gear", group: "De vez em quando" },
  ] as const;

  it("é uma navegação com nome, e o destino atual se anuncia", () => {
    render(<Rail label="Seções do Basalto" items={DESTINOS} value="registrar" onChange={vi.fn()} />);
    expect(screen.getByRole("navigation", { name: "Seções do Basalto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Diário" })).not.toHaveAttribute("aria-current");
  });

  it("os grupos têm nome — inclusive recolhido", () => {
    const { rerender } = render(
      <Rail label="Seções" items={DESTINOS} value="diario" onChange={vi.fn()} />,
    );
    expect(screen.getByRole("group", { name: "Todo dia" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "De vez em quando" })).toBeInTheDocument();

    // Recolhido, o versalete sai da tela mas continua nomeando o grupo: tirar a
    // hierarquia junto com a largura deixaria sete botões soltos para quem ouve.
    rerender(<Rail label="Seções" items={DESTINOS} value="diario" onChange={vi.fn()} collapsed />);
    expect(screen.getByRole("group", { name: "Todo dia" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajustes" })).toBeInTheDocument();
  });

  it("troca de destino pelo clique", async () => {
    const usuario = userEvent.setup();
    const aoTrocar = vi.fn();
    render(<Rail label="Seções" items={DESTINOS} value="diario" onChange={aoTrocar} />);
    await usuario.click(screen.getByRole("button", { name: "Ajustes" }));
    expect(aoTrocar).toHaveBeenCalledWith("ajustes");
  });

  it("item sem grupo não inventa um", () => {
    const soltos = [{ value: "diario", label: "Diário", icon: "book" }] as const;
    render(<Rail label="Seções" items={soltos} value="diario" onChange={vi.fn()} />);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });
});

describe("Rail com marca", () => {
  it("a marca abre o trilho e não vira destino", () => {
    const DESTINOS = [{ value: "diario", label: "Diário", icon: "book" }] as const;
    render(
      <Rail
        label="Seções"
        items={DESTINOS}
        value="diario"
        onChange={vi.fn()}
        header={<span>Basalto</span>}
      />,
    );
    expect(screen.getByText("Basalto")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});

describe("MacroBar em linha", () => {
  it("põe barra e número na mesma linha, e o número diz a verdade", () => {
    const { container } = render(
      <MacroBar name="Proteína" value={68} target={135} kind="protein" layout="inline" />,
    );
    expect(container.firstElementChild).toHaveAttribute("data-layout", "inline");
    expect(screen.getByText("68 de 135 g")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Proteína: 68 de 135 g" })).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });

  it("o número mostrado pode não ser o par da barra, e a conta vem embaixo", () => {
    // As macros da meta: a barra é a fatia da energia do dia (540 de 1.917),
    // o número é o que a pessoa conhece — os gramas.
    render(
      <MacroBar
        name="Proteína"
        value={540}
        target={1917}
        layout="inline"
        valueText="135 g"
        expression="135 × 4 = 540"
      />,
    );
    expect(screen.getByText("135 g")).toBeInTheDocument();
    expect(screen.getByText("135 × 4 = 540")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Proteína: 135 g" })).toHaveAttribute(
      "aria-valuenow",
      "28",
    );
  });

  it("empilhada também aceita a conta", () => {
    render(<MacroBar name="Gordura" value={30} target={53} kind="fat" expression="30 × 9 = 270" />);
    expect(screen.getByText("30 × 9 = 270")).toBeInTheDocument();
  });
});

describe("Pager", () => {
  function Mes() {
    const [mes, setMes] = useState(8);
    const NOMES = ["julho", "agosto", "setembro"];
    return (
      <Pager
        label="Mês"
        previousLabel="Mês anterior"
        nextLabel="Próximo mês"
        hasPrevious={mes > 6}
        hasNext={mes < 8}
        onPrevious={() => setMes((m) => m - 1)}
        onNext={() => setMes((m) => m + 1)}
        current={`${NOMES[mes - 6]} de 2026`}
      />
    );
  }

  it("é um grupo com nome, e cada botão diz para onde vai", () => {
    render(<Mes />);
    expect(screen.getByRole("group", { name: "Mês" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mês anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próximo mês" })).toBeInTheDocument();
  });

  it("anuncia o período novo depois de cada toque", async () => {
    const usuario = userEvent.setup();
    render(<Mes />);
    expect(screen.getByText("setembro de 2026")).toHaveAttribute("aria-live", "polite");
    await usuario.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(screen.getByText("agosto de 2026")).toBeInTheDocument();
  });

  it("na ponta o botão apaga, mas o foco não cai fora da página", async () => {
    // Quem volta até o primeiro mês apertando Enter tem o botão desligado
    // debaixo do próprio foco no último toque. Com `disabled` o foco sumiria
    // para o começo da página; com `aria-disabled` ele fica onde estava.
    const usuario = userEvent.setup();
    render(<Mes />);
    const voltar = screen.getByRole("button", { name: "Mês anterior" });
    voltar.focus();
    await usuario.keyboard("{Enter}{Enter}");
    expect(screen.getByText("julho de 2026")).toBeInTheDocument();
    expect(voltar).toHaveAttribute("aria-disabled", "true");
    expect(document.activeElement).toBe(voltar);

    // E apertar de novo na ponta não anda para lugar nenhum.
    await usuario.keyboard("{Enter}");
    expect(screen.getByText("julho de 2026")).toBeInTheDocument();
  });

  it("hoje é a ponta da direita", () => {
    render(<Mes />);
    expect(screen.getByRole("button", { name: "Próximo mês" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Mês anterior" })).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  it("sem período, não inventa um anúncio", () => {
    const { container } = render(
      <Pager
        label="Dia"
        previousLabel="Dia anterior"
        nextLabel="Próximo dia"
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );
    expect(container.querySelector("[aria-live]")).toBeNull();
  });
});

describe("Legend", () => {
  it("é uma lista de nomes, e a amostra não fala", () => {
    const { container } = render(
      <Legend
        label="Legenda do calendário"
        items={[
          { label: "dia fechado", tone: "accent" },
          { label: "parcial", tone: "carb" },
          { label: "sem registro", tone: "neutral" },
        ]}
      />,
    );
    const lista = screen.getByRole("list", { name: "Legenda do calendário" });
    expect(lista.querySelectorAll("li")).toHaveLength(3);
    for (const amostra of container.querySelectorAll(".co-legend__swatch")) {
      expect(amostra).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("a amostra leva a forma da marca que explica", () => {
    const { container } = render(
      <Legend
        items={[
          { label: "pesagem do dia", swatch: "point", tone: "neutral" },
          { label: "tendência", swatch: "line" },
          { label: "projeção", swatch: "dashed" },
          { label: "faixa da meta", swatch: "band" },
        ]}
      />,
    );
    const formas = [...container.querySelectorAll(".co-legend__swatch")].map((a) =>
      a.getAttribute("data-swatch"),
    );
    expect(formas).toEqual(["point", "line", "dashed", "band"]);
  });

  it("sem forma nem tom, é o quadrado do acento", () => {
    const { container } = render(<Legend items={[{ label: "dia fechado" }]} />);
    const amostra = container.querySelector(".co-legend__swatch");
    expect(amostra).toHaveAttribute("data-swatch", "square");
    expect(amostra).toHaveAttribute("data-tone", "accent");
  });
});

describe("NavList", () => {
  const SECOES = [
    { value: "meta", label: "Meta e ritmo", description: "perder 0,5 kg/semana", group: "A sua conta" },
    { value: "macros", label: "Estratégia de macros", description: "padrão", group: "A sua conta" },
    { value: "dados", label: "Seus dados", description: "exportar, sair, apagar", group: "Conta e dados" },
  ] as const;

  it("de páginas: é navegação, e a seção aberta é a página atual", () => {
    render(<NavList label="Ajustes" items={SECOES} value="macros" onChange={vi.fn()} />);
    expect(screen.getByRole("navigation", { name: "Ajustes" })).toBeInTheDocument();
    const aberta = screen.getByRole("button", { name: "Estratégia de macros" });
    expect(aberta).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Meta e ritmo" })).not.toHaveAttribute("aria-current");
  });

  it("o nome é o rótulo; o que a seção guarda é descrição", () => {
    // Sem isso o nome seria a linha inteira, e quem pula de item em item
    // ouviria a conta antes de saber em que seção está.
    render(<NavList label="Ajustes" items={SECOES} value="meta" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Meta e ritmo" })).toHaveAccessibleDescription(
      "perder 0,5 kg/semana",
    );
  });

  it("os grupos têm nome e os itens são lista", () => {
    render(<NavList label="Ajustes" items={SECOES} value="meta" onChange={vi.fn()} />);
    const grupo = screen.getByRole("group", { name: "A sua conta" });
    expect(grupo.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getByRole("group", { name: "Conta e dados" })).toBeInTheDocument();
  });

  it("de detalhe: não é navegação, e o item aberto é o atual do grupo", () => {
    // Lista e detalhe: a página não muda, muda o painel ao lado. Anunciar
    // "página atual" ali seria mentir sobre o que o clique fez.
    const RECEITAS = [
      { value: "frango", label: "Frango com batata-doce", trailing: "519", description: "4 porções · 30 min" },
      { value: "omelete", label: "Omelete de três ovos", trailing: "341" },
    ] as const;
    render(
      <NavList label="Receitas" items={RECEITAS} value="frango" onChange={vi.fn()} opens="detail" />,
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Receitas" })).toBeInTheDocument();
    const aberta = screen.getByRole("button", { name: "Frango com batata-doce" });
    expect(aberta).toHaveAttribute("aria-current", "true");
    expect(aberta).toHaveAccessibleDescription("4 porções · 30 min 519");
  });

  it("troca de item pelo clique", async () => {
    const usuario = userEvent.setup();
    const aoTrocar = vi.fn();
    render(<NavList label="Ajustes" items={SECOES} value="meta" onChange={aoTrocar} />);
    await usuario.click(screen.getByRole("button", { name: "Seus dados" }));
    expect(aoTrocar).toHaveBeenCalledWith("dados");
  });

  it("item sem grupo não inventa um, e o que abre a linha aparece", () => {
    const FONTES = [
      { value: "taco", label: "TACO", leading: <span data-testid="ponto" />, trailing: "597" },
    ] as const;
    render(<NavList label="Bases" items={FONTES} value="taco" onChange={vi.fn()} opens="detail" />);
    expect(screen.getAllByRole("group")).toHaveLength(1);
    expect(screen.getByTestId("ponto")).toBeInTheDocument();
  });
});

describe("PageHeader", () => {
  it("o título é o h1 da página, e as ações ficam no cabeçalho", () => {
    render(
      <PageHeader
        title="Hoje"
        subtitle="quarta, 16 de setembro"
        navigation={
          <Pager
            label="Dia"
            previousLabel="Dia anterior"
            nextLabel="Próximo dia"
            hasNext={false}
            onPrevious={vi.fn()}
            onNext={vi.fn()}
          />
        }
        actions={<Button icon="plus">Registrar</Button>}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Hoje" })).toBeInTheDocument();
    expect(screen.getByText("quarta, 16 de setembro")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Dia" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar" })).toBeInTheDocument();
  });

  it("dentro de um painel o título desce um nível, e o que não veio não ocupa lugar", () => {
    const { container } = render(<PageHeader as="h2" title="Frango com batata-doce" />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(container.querySelector(".co-page-header__navigation")).toBeNull();
    expect(container.querySelector(".co-page-header__actions")).toBeNull();
  });
});
