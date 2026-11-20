/// <reference types="vite/client" />
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useRef, useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./atoms/Button";
import { Input } from "./atoms/Input";
import { Screen } from "./atoms/Screen";
import { Disclosure } from "./molecules/Disclosure";
import { EmptyState } from "./molecules/EmptyState";
import { Field } from "./molecules/Field";
import { NavList } from "./molecules/NavList";
import { Notice } from "./molecules/Notice";
import { Rail } from "./molecules/Rail";
import { SegmentedControl } from "./molecules/SegmentedControl";
import { Sheet } from "./molecules/Sheet";
import { TabBar } from "./molecules/TabBar";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./styles.css";
import { avaliar, dentroDe, REGRAS, type Valores } from "./test/folha";
import tokensCss from "./tokens/tokens.css?raw";

/**
 * As peças que a F0 do Basalto usa, cada uma com a prova que o cartão C0
 * (slipalison/basalto#164) pede, nos dois temas do "Relógio de Sol":
 *
 *   Screen e a casca      a barra de abas e o trilho, sem o vidro
 *   Field e Input         o rótulo visível e associado; o erro em texto junto do campo
 *   SegmentedControl      teclado e alvo (a escolha da data)
 *   Notice e EmptyState   render e acessibilidade
 *   Sheet                 o foco cai na confirmação e volta ao fechar (apagar a conta)
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
    // Texto e ícone, e não só a cor (ADR-005).
    expect(erro.closest(".co-field__error")?.querySelector("svg")).not.toBeNull();
    // Anunciado: o campo se declara inválido e é descrito pelo erro.
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription(expect.stringContaining("Escreva um número, como 72,5."));
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

function ApagarConta({ aoApagar }: { aoApagar: () => void }) {
  const [aberta, abrir] = useState(false);
  const confirmar = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button variant="danger" onClick={() => abrir(true)}>
        Apagar minha conta
      </Button>
      <Sheet
        open={aberta}
        onClose={() => abrir(false)}
        title="Apagar a conta?"
        initialFocus={confirmar}
        footer={
          <>
            <Button variant="secondary" onClick={() => abrir(false)}>
              Cancelar
            </Button>
            <Button
              ref={confirmar}
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

describe("Sheet de confirmação: o foco cai na confirmação e volta ao fechar", () => {
  it("abrir põe o foco em 'Apagar de vez'; Esc fecha e o foco volta a quem abriu", async () => {
    const usuario = userEvent.setup();
    render(<ApagarConta aoApagar={vi.fn()} />);
    const abrir = screen.getByRole("button", { name: "Apagar minha conta" });
    await usuario.click(abrir);
    const dialogo = screen.getByRole("dialog", { name: "Apagar a conta?" });
    expect(within(dialogo).getByRole("button", { name: "Apagar de vez" })).toHaveFocus();
    await usuario.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(abrir).toHaveFocus();
  });

  it("cancelar também devolve o foco, e só a confirmação apaga", async () => {
    const usuario = userEvent.setup();
    const aoApagar = vi.fn();
    render(<ApagarConta aoApagar={aoApagar} />);
    const abrir = screen.getByRole("button", { name: "Apagar minha conta" });
    await usuario.click(abrir);
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(abrir).toHaveFocus();
    expect(aoApagar).not.toHaveBeenCalled();
    await usuario.click(abrir);
    await usuario.keyboard("{Enter}");
    expect(aoApagar).toHaveBeenCalledTimes(1);
    expect(abrir).toHaveFocus();
  });

  it.each(TEMAS)("no tema %s, a confirmação aberta passa no axe", async (tema) => {
    function Aberta() {
      const confirmar = useRef<HTMLButtonElement>(null);
      return (
        <Sheet
          open
          onClose={vi.fn()}
          title="Apagar a conta?"
          initialFocus={confirmar}
          footer={
            <Button ref={confirmar} variant="danger">
              Apagar de vez
            </Button>
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
