/// <reference types="vite/client" />
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useRef, useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./atoms/Button";
import { Icon } from "./atoms/Icon";
import { Input } from "./atoms/Input";
import { Screen } from "./atoms/Screen";
import { Disclosure } from "./molecules/Disclosure";
import { EmptyState } from "./molecules/EmptyState";
import { Field } from "./molecules/Field";
import { Group } from "./molecules/Group";
import { NavList } from "./molecules/NavList";
import { Notice } from "./molecules/Notice";
import { Rail } from "./molecules/Rail";
import { SegmentedControl } from "./molecules/SegmentedControl";
import { Sheet } from "./molecules/Sheet";
import { TabBar } from "./molecules/TabBar";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./styles.css";
import { avaliar, bloco, dentroDe, REGRAS, type Valores } from "./test/folha";
import tokensCss from "./tokens/tokens.css?raw";

/**
 * As peças que a F0 do Basalto usa, cada uma com a prova que o cartão C0
 * (slipalison/basalto#164) pede, nos dois temas do "Relógio de Sol":
 *
 *   Screen e a casca      a barra de abas e o trilho, sem o vidro
 *   Field e Input         o rótulo visível e associado; o erro em texto junto do campo
 *   SegmentedControl      teclado e alvo (a escolha da data)
 *   Notice e EmptyState   render e acessibilidade
 *   Sheet                 o foco cai em Cancelar e volta ao fechar (apagar a conta)
 *   NavList e Disclosure  teclado e acessibilidade (Você, Privacidade, "Por que perguntamos")
 *
 * O resto de cada peça já tem a sua prova no arquivo dela (`atoms.test.tsx`,
 * `molecules.test.tsx`, `corpo-focavel.test.tsx`, `area-segura.test.tsx`,
 * `barra-de-acao.test.tsx`); este arquivo junta o que o cartão nomeia.
 */

const TEMAS = ["light", "dark"] as const;

async function semViolacao(conteudo: ReactNode, tema: (typeof TEMAS)[number]) {
  const { container, unmount } = render(
    <ThemeProvider theme={tema} attachTo="element" storageKey={null}>
      {conteudo}
    </ThemeProvider>,
  );
  const resultado = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    // O happy-dom não pinta: o contraste é provado em `tokens/contraste.test.ts`
    // e, no navegador de verdade, com o axe sobre o catálogo (ADR-022).
    rules: { "color-contrast": { enabled: false } },
  });
  unmount();
  return resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

// ------------------------------------------------------------ a casca --

function Casca({ forma }: { forma: "celular" | "desktop" }) {
  const destinos = [
    { value: "hoje", label: "Hoje", icon: "book" },
    { value: "livro", label: "Livro", icon: "book" },
    { value: "voce", label: "Você", icon: "user" },
  ] as const;
  if (forma === "desktop") {
    return (
      <div style={{ display: "flex" }}>
        <Rail label="Principal" value="hoje" onChange={vi.fn()} items={[...destinos]} />
        <Screen>Hoje</Screen>
      </div>
    );
  }
  return (
    <Screen tabBar={<TabBar label="Principal" value="hoje" onChange={vi.fn()} items={[...destinos]} />}>Hoje</Screen>
  );
}

describe("a casca: barra de abas no celular e trilho no desktop, sem o vidro", () => {
  it("no celular, a barra de abas marca o destino atual com aria-current", () => {
    render(<Casca forma="celular" />);
    const barra = screen.getByRole("navigation", { name: "Principal" });
    expect(within(barra).getByRole("button", { name: "Hoje" })).toHaveAttribute("aria-current", "page");
    expect(within(barra).getByRole("button", { name: "Livro" })).not.toHaveAttribute("aria-current");
  });

  it("no desktop, o trilho marca o destino atual com aria-current", () => {
    render(<Casca forma="desktop" />);
    const trilho = screen.getByRole("navigation", { name: "Principal" });
    expect(within(trilho).getByRole("button", { name: "Hoje" })).toHaveAttribute("aria-current", "page");
  });

  it("nem a barra de abas, nem a de ação, nem o trilho têm desfoque de fundo", () => {
    const comVidro = REGRAS.filter((regra) =>
      regra.seletores.some((s) => /co-(tabbar|rail|screen__actionbar)/.test(s)),
    ).filter((regra) => regra.declaracoes.some(([p]) => /backdrop-filter$/.test(p)));
    expect(comVidro).toEqual([]);
  });

  it.each(TEMAS)("no tema %s, as duas cascas passam no axe", async (tema) => {
    expect(await semViolacao(<Casca forma="celular" />, tema)).toEqual([]);
    expect(await semViolacao(<Casca forma="desktop" />, tema)).toEqual([]);
  });
});

// ------------------------------------------------------- campo e input --

describe("Field e Input: o rótulo visível e associado, e o erro em texto junto do campo", () => {
  function Peso({ erro }: { erro?: string }) {
    return (
      <Field label="Peso" hint="Em quilos." error={erro}>
        {(controle) => <Input {...controle} unit="kg" />}
      </Field>
    );
  }

  it("o rótulo é texto visível e é o nome do campo", () => {
    render(<Peso />);
    const campo = screen.getByRole("textbox", { name: "Peso" });
    const rotulo = screen.getByText("Peso");
    // Visível: não é o `VisuallyHidden`, nem `aria-label`, nem `placeholder`.
    expect(rotulo.closest(".co-visually-hidden")).toBeNull();
    expect(campo).not.toHaveAttribute("aria-label");
    expect(campo).not.toHaveAttribute("placeholder");
    // Associado: o `<label>` aponta para o campo.
    expect(rotulo.closest("label")).toHaveAttribute("for", campo.id);
  });

  it("o erro aparece em texto, com ícone, junto do campo, e o campo o anuncia", () => {
    render(<Peso erro="Escreva um número, como 72,5." />);
    const campo = screen.getByRole("textbox", { name: "Peso" });
    const erro = screen.getByText("Escreva um número, como 72,5.");
    // Junto: no mesmo campo, depois do controle.
    const field = campo.closest(".co-field");
    expect(field).not.toBeNull();
    expect(field?.contains(erro)).toBe(true);
    expect(campo.compareDocumentPosition(erro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Texto e ícone, e não só a cor (ADR-005). O ícone é o de ALERTA (o "!"
    // no círculo), e não o de informação: o erro não é uma nota.
    const desenho = (nome: "alert" | "info") => {
      const { container, unmount } = render(<Icon name={nome} />);
      const d = container.querySelector("path")?.getAttribute("d");
      unmount();
      return d;
    };
    const doErro = erro.closest(".co-field__error")?.querySelector("svg path")?.getAttribute("d");
    expect(doErro, "o ícone do erro do campo").toBe(desenho("alert"));
    expect(desenho("alert")).not.toBe(desenho("info"));
    // Anunciado: o campo se declara inválido e é descrito pelo erro.
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription(expect.stringContaining("Escreva um número, como 72,5."));
  });

  it("o erro do grupo também vem com o ícone de alerta", () => {
    const { container } = render(
      <Group label="Refeições" error="Escolha ao menos uma.">
        <p>Almoço</p>
      </Group>,
    );
    const doErro = container.querySelector(".co-group__error svg path")?.getAttribute("d");
    const { container: alerta } = render(<Icon name="alert" />);
    expect(doErro, "o ícone do erro do grupo").toBe(alerta.querySelector("path")?.getAttribute("d"));
  });

  it.each(TEMAS)("no tema %s, o campo com dica e erro passa no axe", async (tema) => {
    expect(await semViolacao(<Peso erro="Escreva um número." />, tema)).toEqual([]);
  });
});

// ---------------------------------------------------------- o segmentado --

const DIAS = [
  { value: "ontem", label: "Ontem" },
  { value: "hoje", label: "Hoje" },
  { value: "amanha", label: "Amanhã" },
] as const;

function EscolhaDoDia() {
  const [dia, definir] = useState<(typeof DIAS)[number]["value"]>("hoje");
  return <SegmentedControl label="Dia" options={DIAS} value={dia} onChange={definir} />;
}

const TOKENS: Valores = Object.fromEntries(
  [...tokensCss.matchAll(/(--co-[\w-]+)\s*:\s*([^;]+);/g)].reverse().map((achado) => [achado[1] ?? "", (achado[2] ?? "").trim()]),
);

describe("SegmentedControl para a data: teclado e alvo", () => {
  it("o Tab entra na escolha marcada, as setas trocam o dia e o Tab sai do grupo", async () => {
    const usuario = userEvent.setup();
    render(
      <>
        <EscolhaDoDia />
        <button type="button">Depois</button>
      </>,
    );
    await usuario.tab();
    expect(screen.getByRole("radio", { name: "Hoje" })).toHaveFocus();
    await usuario.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Amanhã" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Amanhã" })).toBeChecked();
    await usuario.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Ontem" })).toBeChecked();
    await usuario.tab();
    expect(screen.getByRole("button", { name: "Depois" })).toHaveFocus();
  });

  it("cada opção tem o alvo de 44px no toque e com ponteiro fino", () => {
    const opcao = REGRAS.filter((r) => r.profundidade === 0 && r.seletores.join() === ".co-segmented__option")
      .flatMap((r) => r.declaracoes)
      .find(([p]) => p === "min-height")?.[1];
    expect(avaliar(opcao ?? "0px", TOKENS)).toBeGreaterThanOrEqual(44);
    // O ponteiro fino não mexe no segmentado.
    expect(dentroDe("@media (pointer: fine)").filter((r) => r.seletores.some((s) => s.includes("segmented")))).toEqual([]);
  });

  it.each(TEMAS)("no tema %s, passa no axe", async (tema) => {
    expect(await semViolacao(<EscolhaDoDia />, tema)).toEqual([]);
  });
  /*
   * A dimensão a 320px. O happy-dom não faz layout, então a conta é a da
   * quebra de linha do flexbox, com os números LIDOS da folha: o tamanho
   * hipotético de cada opção é o maior entre o conteúdo e o `min-width`, a
   * fileira cabe o que couber na largura de dentro do grupo, e a sobra se
   * reparte pelo `flex-grow`. Um número de 1 a 8 a 13px mede bem menos que os
   * 44px, então a opção dele É o mínimo — a conta não depende da fonte. Os
   * rótulos longos dependem da fonte: para eles a prova é a regra que impede o
   * transbordo (o grupo e a opção limitados a 100%, com quebra), e o número
   * medido no Chromium está na entrega do lote.
   */
  const ultima = (declaracoes: readonly (readonly [string, string])[], propriedade: string) =>
    declaracoes.filter(([p]) => p === propriedade).at(-1)?.[1];

  function fileirasA(largura: number, opcoes: number, full: boolean) {
    const grupo = bloco(".co-segmented");
    const opcao = bloco(".co-segmented__option");
    const larguraMinima = ultima(opcao, "min-width");
    expect(larguraMinima, "a opção tem min-width").toBeDefined();
    const minimo = avaliar(larguraMinima ?? "0px", TOKENS);
    const vao = avaliar(ultima(grupo, "gap") ?? "0px", TOKENS);
    const respiro = avaliar(ultima(grupo, "padding") ?? "0px", TOKENS);
    const contorno = avaliar((ultima(grupo, "border") ?? "0px").split(" ")[0] ?? "0px", TOKENS);
    const dentro = largura - 2 * (respiro + contorno);
    const quebra = ultima(grupo, "flex-wrap") === "wrap";
    // `flex-shrink: 0`: a opção não encolhe abaixo do hipotético.
    const encolhe = !/^\S+ 0(\s|$)/.test(ultima(opcao, "flex") ?? "") && ultima(opcao, "flex-shrink") !== "0";
    const fileiras: number[][] = [];
    let atual: number[] = [];
    let ocupado = 0;
    for (let k = 0; k < opcoes; k++) {
      const extra = atual.length === 0 ? minimo : vao + minimo;
      if (quebra && atual.length > 0 && ocupado + extra > dentro) {
        fileiras.push(atual);
        atual = [];
        ocupado = 0;
      }
      ocupado += atual.length === 0 ? minimo : vao + minimo;
      atual.push(minimo);
    }
    fileiras.push(atual);
    // A sobra (ou a falta) de cada fileira se reparte igual: todas têm o mesmo
    // `flex-grow`, e sem `full` a opção só cresce até a largura do grupo.
    return fileiras.map((fileira) => {
      const soma = fileira.reduce((a, b) => a + b, 0) + vao * (fileira.length - 1);
      const sobra = dentro - soma;
      const passo = sobra < 0 && encolhe ? sobra / fileira.length : full || fileiras.length > 1 ? Math.max(sobra, 0) / fileira.length : 0;
      return { larguras: fileira.map((l) => l + passo), soma: soma + passo * fileira.length, dentro };
    });
  }

  it.each([
    [6, true],
    [8, true],
    [8, false],
  ] as const)("a 320px (288px dentro do respiro de 16px), com %i opções (full: %s), cada uma tem 44px de largura e nada passa da largura", (opcoes, full) => {
    for (const largura of [288, 320]) {
      const fileiras = fileirasA(largura, opcoes, full);
      for (const { larguras, soma, dentro } of fileiras) {
        for (const l of larguras) {
          expect(l, `opção a ${largura}px com ${opcoes} opções mediu ${l.toFixed(1)}px`).toBeGreaterThanOrEqual(44);
        }
        expect(soma, `fileira a ${largura}px com ${opcoes} opções`).toBeLessThanOrEqual(dentro + 0.01);
      }
    }
  });

  it("os quatro rótulos longos ('Padrão / Baixa em carbo / Cetogênica / Alta em carbo') não transbordam: o grupo e a opção param em 100% e quebram em linhas", () => {
    const grupo = bloco(".co-segmented");
    const opcao = bloco(".co-segmented__option");
    expect(ultima(grupo, "max-width"), "o grupo para na largura de quem o contém").toBe("100%");
    expect(ultima(grupo, "flex-wrap"), "o grupo quebra em linhas").toBe("wrap");
    expect(ultima(opcao, "max-width"), "uma opção sozinha para na largura do grupo").toBe("100%");
    // Sem `nowrap`: a opção que sozinha passaria da largura quebra o próprio
    // rótulo, em vez de empurrar a página para o lado.
    expect(ultima(opcao, "white-space"), "o rótulo pode quebrar").not.toBe("nowrap");
    render(
      <SegmentedControl
        label="Estilo"
        value="padrao"
        onChange={vi.fn()}
        options={[
          { value: "padrao", label: "Padrão" },
          { value: "low", label: "Baixa em carbo" },
          { value: "keto", label: "Cetogênica" },
          { value: "high", label: "Alta em carbo" },
        ]}
      />,
    );
    // Quebrar em linhas não tira o grupo do papel dele: continua um radiogroup
    // de quatro, com uma parada do Tab.
    const grupoNaTela = screen.getByRole("radiogroup", { name: "Estilo" });
    expect(within(grupoNaTela).getAllByRole("radio")).toHaveLength(4);
    expect(within(grupoNaTela).getAllByRole("radio").filter((r) => r.tabIndex === 0)).toHaveLength(1);
  });

  it("quebrado em linhas, o grupo continua pílula na fileira e a opção do canto não sai da borda", () => {
    // O raio do grupo é meia altura de UMA fileira (a opção de 44px, o respiro
    // e o contorno), e não 999px: com duas fileiras, 999px viraria meia altura
    // do grupo inteiro, e a pílula escolhida no canto sairia da curva.
    const grupo = bloco(".co-segmented");
    const raio = avaliar(ultima(grupo, "border-radius") ?? "0px", TOKENS);
    const fileira =
      avaliar("var(--co-target-min)", TOKENS) +
      2 * avaliar(ultima(grupo, "padding") ?? "0px", TOKENS) +
      2 * avaliar((ultima(grupo, "border") ?? "0px").split(" ")[0] ?? "0px", TOKENS);
    expect(raio).toBeCloseTo(fileira / 2, 5);
  });
});

// ------------------------------------------------- o aviso e o vazio --

describe("Notice e EmptyState: render e acessibilidade", () => {
  const Aviso = () => (
    <Notice title="Ajustamos a meta" tone="status">
      O peso parou por 3 semanas, e a meta desceu 100 kcal.
    </Notice>
  );
  const Vazio = () => (
    <EmptyState title="Nenhuma receita no livro" icon="book" action={<Button>Criar à mão</Button>}>
      As receitas que você guardar aparecem aqui.
    </EmptyState>
  );

  it("o aviso é um status com título e corpo; o vazio diz o que falta e oferece a saída", () => {
    render(
      <>
        <Aviso />
        <Vazio />
      </>,
    );
    const aviso = screen.getByRole("status");
    expect(aviso).toHaveTextContent("Ajustamos a meta");
    expect(aviso).toHaveTextContent("O peso parou por 3 semanas");
    expect(screen.getByText("Nenhuma receita no livro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar à mão" })).toBeInTheDocument();
  });

  it.each(TEMAS)("no tema %s, os dois passam no axe", async (tema) => {
    expect(
      await semViolacao(
        <>
          <Aviso />
          <Vazio />
        </>,
        tema,
      ),
    ).toEqual([]);
  });
});

// ----------------------------------------- a confirmação de apagar a conta --

/**
 * A folha de confirmação como o app a monta: o foco inicial vai para
 * "Cancelar", a ação MENOS destrutiva (o padrão de diálogo de alerta da
 * WAI-ARIA). Abrir pelo teclado e teclar Enter de novo não pode apagar a conta:
 * o segundo Enter de quem abriu sem olhar cai em "Cancelar", e apagar pede um
 * Tab a mais, de propósito.
 */
function ApagarConta({ aoApagar }: { aoApagar: () => void }) {
  const [aberta, abrir] = useState(false);
  const cancelar = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button variant="danger" onClick={() => abrir(true)}>
        Apagar minha conta
      </Button>
      <Sheet
        open={aberta}
        onClose={() => abrir(false)}
        title="Apagar a conta?"
        initialFocus={cancelar}
        footer={
          <>
            <Button ref={cancelar} variant="secondary" onClick={() => abrir(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                aoApagar();
                abrir(false);
              }}
            >
              Apagar de vez
            </Button>
          </>
        }
      >
        Isto apaga o seu livro, a sua meta e o seu histórico.
      </Sheet>
    </>
  );
}

describe("Sheet de confirmação: o foco cai em Cancelar e volta ao fechar", () => {
  it("abrir põe o foco em 'Cancelar'; Esc fecha e o foco volta a quem abriu", async () => {
    const usuario = userEvent.setup();
    render(<ApagarConta aoApagar={vi.fn()} />);
    const abrir = screen.getByRole("button", { name: "Apagar minha conta" });
    await usuario.click(abrir);
    const dialogo = screen.getByRole("dialog", { name: "Apagar a conta?" });
    expect(within(dialogo).getByRole("button", { name: "Cancelar" })).toHaveFocus();
    await usuario.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(abrir).toHaveFocus();
  });

  it("aberta pelo teclado, o Enter logo ao abrir NÃO apaga: cancela, e o foco volta a quem abriu", async () => {
    const usuario = userEvent.setup();
    const aoApagar = vi.fn();
    render(<ApagarConta aoApagar={aoApagar} />);
    const abrir = screen.getByRole("button", { name: "Apagar minha conta" });
    await usuario.tab();
    expect(abrir).toHaveFocus();
    await usuario.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "Apagar a conta?" })).toBeInTheDocument();
    await usuario.keyboard("{Enter}");
    expect(aoApagar, "o Enter logo ao abrir chamou a ação destrutiva").not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(abrir).toHaveFocus();
  });

  it("apagar pede um Tab a mais: Tab + Enter chama a ação, e o foco volta a quem abriu", async () => {
    const usuario = userEvent.setup();
    const aoApagar = vi.fn();
    render(<ApagarConta aoApagar={aoApagar} />);
    const abrir = screen.getByRole("button", { name: "Apagar minha conta" });
    await usuario.tab();
    await usuario.keyboard("{Enter}");
    await usuario.tab();
    expect(screen.getByRole("button", { name: "Apagar de vez" })).toHaveFocus();
    await usuario.keyboard("{Enter}");
    expect(aoApagar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(abrir).toHaveFocus();
  });

  it("cancelar com o ponteiro também devolve o foco, e só a confirmação apaga", async () => {
    const usuario = userEvent.setup();
    const aoApagar = vi.fn();
    render(<ApagarConta aoApagar={aoApagar} />);
    const abrir = screen.getByRole("button", { name: "Apagar minha conta" });
    await usuario.click(abrir);
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(abrir).toHaveFocus();
    expect(aoApagar).not.toHaveBeenCalled();
    await usuario.click(abrir);
    await usuario.click(screen.getByRole("button", { name: "Apagar de vez" }));
    expect(aoApagar).toHaveBeenCalledTimes(1);
    expect(abrir).toHaveFocus();
  });

  it.each(TEMAS)("no tema %s, a confirmação aberta passa no axe", async (tema) => {
    function Aberta() {
      const cancelar = useRef<HTMLButtonElement>(null);
      return (
        <Sheet
          open
          onClose={vi.fn()}
          title="Apagar a conta?"
          initialFocus={cancelar}
          footer={
            <>
              <Button ref={cancelar} variant="secondary">
                Cancelar
              </Button>
              <Button variant="danger">Apagar de vez</Button>
            </>
          }
        >
          Isto apaga os seus dados.
        </Sheet>
      );
    }
    expect(await semViolacao(<Aberta />, tema)).toEqual([]);
  });
});

// ------------------------------------------- os menus de Você e o porquê --

function MenuVoce({ aoAbrir }: { aoAbrir: (valor: string) => void }) {
  return (
    <NavList
      label="Você"
      opens="page"
      value="objetivo"
      onChange={aoAbrir}
      items={[
        { value: "objetivo", label: "Objetivo e meta", description: "Perder · 1.950 kcal" },
        { value: "corpo", label: "Corpo" },
        { value: "privacidade", label: "Privacidade" },
      ]}
    />
  );
}

describe("NavList e Disclosure: teclado e acessibilidade", () => {
  it("o menu de Você se percorre pelo Tab e abre a seção pelo Enter e pelo Espaço", async () => {
    const usuario = userEvent.setup();
    const aoAbrir = vi.fn();
    render(<MenuVoce aoAbrir={aoAbrir} />);
    await usuario.tab();
    expect(screen.getByRole("button", { name: /Objetivo e meta/ })).toHaveFocus();
    await usuario.tab();
    expect(screen.getByRole("button", { name: "Corpo" })).toHaveFocus();
    await usuario.keyboard("{Enter}");
    expect(aoAbrir).toHaveBeenLastCalledWith("corpo");
    await usuario.tab();
    await usuario.keyboard(" ");
    expect(aoAbrir).toHaveBeenLastCalledWith("privacidade");
  });

  it("'Por que perguntamos' é um <details> do navegador: o resumo é uma parada do Tab e abre e fecha", async () => {
    // O Enter e o Espaço no resumo são do navegador (o HTML os liga ao clique
    // do `<summary>`); o happy-dom não os imita, e a prova de teclado de
    // verdade é a do Chromium sobre o catálogo (ADR-022). Aqui: o resumo
    // recebe o foco pelo Tab, e a ativação dele abre e fecha.
    const usuario = userEvent.setup();
    render(<Disclosure summary="Por que perguntamos">Para calcular a meta do dia.</Disclosure>);
    const resumo = screen.getByText("Por que perguntamos").closest("summary") as HTMLElement;
    const detalhes = resumo.closest("details") as HTMLDetailsElement;
    await usuario.tab();
    expect(resumo).toHaveFocus();
    expect(detalhes.open).toBe(false);
    await usuario.click(resumo);
    expect(detalhes.open).toBe(true);
    await usuario.click(resumo);
    expect(detalhes.open).toBe(false);
  });

  it.each(TEMAS)("no tema %s, o menu e o porquê passam no axe", async (tema) => {
    expect(
      await semViolacao(
        <>
          <MenuVoce aoAbrir={vi.fn()} />
          <Disclosure summary="Por que perguntamos" defaultOpen>
            Para calcular a meta do dia.
          </Disclosure>
        </>,
        tema,
      ),
    ).toEqual([]);
  });
});
