/// <reference types="vite/client" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Deck } from "./molecules/Deck";
import { Sheet, type SheetProps } from "./molecules/Sheet";
import { Tabs } from "./molecules/Tabs";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./styles.css";
import { REGRAS, SEM_AREA, aparelho, avaliar, bloco, dentroDe, lugar, raiz, type Valores } from "./test/folha";

/**
 * A folha de altura cheia (`size="full"`, ADR-020): o card flutuante em tela
 * cheia que a receita do Basalto abre no telefone (slipalison/basalto#155).
 *
 * O happy-dom não faz layout: a marca, o foco e o axe se provam na árvore, e a
 * geometria (a altura estável, a faixa do véu, o corpo que rola inteiro) pelo
 * texto das regras, avaliado como a cascata faria. O número em pixel é o do
 * navegador, medido na história "Receita em tela cheia" e escrito no ADR.
 */

const RECEITAS = ["Arroz, feijão e frango", "Macarrão com carne", "Omelete de legumes"] as const;

const abas = (prato: string) =>
  [
    {
      value: "ingredientes",
      label: "Ingredientes",
      content: (
        <ul>
          {["Arroz", "Feijão", "Frango", "Salada", "Azeite", "Banana"].map((alimento) => (
            <li key={alimento}>{alimento}</li>
          ))}
        </ul>
      ),
    },
    { value: "preparo", label: "Preparo", content: <p>Grelhe e sirva: {prato}.</p> },
    { value: "macros", label: "Macros", content: <p>620 kcal.</p> },
  ] as const;

/** A composição de referência do Basalto: o carrossel direto no corpo, as abas no card e dois botões no rodapé. */
function Receita({ aoFechar = () => undefined, ...resto }: Partial<SheetProps> & { aoFechar?: () => void }) {
  return (
    <Sheet
      open
      title="Almoço"
      onClose={aoFechar}
      footer={
        <>
          <button type="button">Trocar</button>
          <button type="button">Comi</button>
        </>
      }
      {...resto}
    >
      <Deck label="Receitas do almoço" cardLabel={(i, total) => `${RECEITAS[i]}, ${i + 1} de ${total}`}>
        {RECEITAS.map((prato) => (
          <article key={prato}>
            <h3>{prato}</h3>
            <Tabs label={`Receita: ${prato}`} items={abas(prato)} />
          </article>
        ))}
      </Deck>
    </Sheet>
  );
}

/** A árvore sem os ids do `useId`, que mudam a cada montagem. */
const semIds = (html: string) => html.replace(/(id|aria-labelledby|aria-controls)="[^"]*"/g, '$1=""');

function arvore(props: Partial<SheetProps>) {
  const { container, unmount } = render(<Receita {...props} />);
  const html = semIds(container.innerHTML);
  unmount();
  return html;
}

async function varrer(raizDoTeste: HTMLElement) {
  const resultado = await axe.run(raizDoTeste, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    // O happy-dom não pinta: o contraste é provado em `tokens/contraste.test.ts`.
    rules: { "color-contrast": { enabled: false } },
  });
  return resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

const CHEIA = '.co-sheet[data-size="full"]';
const CORPO = `${CHEIA} > .co-sheet__body`;
const FILHOS = `${CORPO} > *`;
const CARROSSEL = `${CORPO} > .co-deck`;

describe("a marca: size diz a altura, e só em overlay", () => {
  it('size="full" marca o painel com data-size="full", e o resto do diálogo é o de sempre', () => {
    render(<Receita size="full" />);
    const painel = screen.getByRole("dialog", { name: "Almoço" });
    expect(painel).toHaveClass("co-sheet");
    expect(painel).toHaveAttribute("data-size", "full");
    expect(painel).toHaveAttribute("aria-modal", "true");
    expect(painel).not.toHaveAttribute("data-mode");
    expect(painel.parentElement).toHaveClass("co-sheet-overlay");
  });

  it('sem a prop e com size="auto" a árvore é a mesma, nó por nó, e sem data-size', () => {
    const padrao = arvore({});
    expect(arvore({ size: "auto" })).toBe(padrao);
    expect(padrao).not.toContain("data-size");
    // A isca: a mesma comparação acusa a folha cheia, e só pela marca.
    const cheia = arvore({ size: "full" });
    expect(cheia).not.toBe(padrao);
    expect(cheia.replace(' data-size="full"', "")).toBe(padrao);
  });

  it("em inline, size não muda nada: nem a marca", () => {
    const inline = arvore({ mode: "inline" });
    expect(arvore({ mode: "inline", size: "full" })).toBe(inline);
    expect(inline).not.toContain("data-size");
    // E nenhuma regra da folha junta as duas marcas: não há o que desfazer.
    const juntam = REGRAS.flatMap((r) => r.seletores).filter((s) => s.includes("data-size") && s.includes("data-mode"));
    expect(juntam).toEqual([]);
  });
});

describe("o diálogo continua inteiro na folha cheia", () => {
  function Abridor() {
    const [aberto, definir] = useState(false);
    return (
      <>
        <button type="button" onClick={() => definir(true)}>
          Ver a receita
        </button>
        <Receita open={aberto} size="full" aoFechar={() => definir(false)} />
      </>
    );
  }

  it("o foco entra no painel, o Esc fecha e o foco volta a quem abriu; o ✕ também", async () => {
    const usuario = userEvent.setup();
    render(<Abridor />);
    const abridor = screen.getByRole("button", { name: "Ver a receita" });
    await usuario.click(abridor);
    expect(document.activeElement).toBe(screen.getByRole("dialog", { name: "Almoço" }));
    await usuario.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(abridor);

    await usuario.click(abridor);
    await usuario.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(abridor);
  });

  it("o Tab passa pelo fechar, pelo corpo, pelo card e pelo rodapé, e dá a volta dentro da folha", async () => {
    const usuario = userEvent.setup();
    render(<Abridor />);
    await usuario.click(screen.getByRole("button", { name: "Ver a receita" }));

    // O corpo que rola é parada do Tab e região com o nome do título (ADR-018).
    const ordem = [
      screen.getByRole("button", { name: "Fechar" }),
      screen.getByRole("region", { name: "Almoço" }),
      screen.getByRole("tab", { name: "Ingredientes" }),
      screen.getByRole("tabpanel", { name: "Ingredientes" }),
      screen.getByRole("button", { name: "Card anterior" }),
      screen.getByRole("button", { name: "Próximo card" }),
      screen.getByRole("button", { name: "Trocar" }),
      screen.getByRole("button", { name: "Comi" }),
      screen.getByRole("button", { name: "Fechar" }),
    ];
    for (const [k, parada] of ordem.entries()) {
      await usuario.tab();
      expect(document.activeElement, `parada ${k + 1} do Tab`).toBe(parada);
    }
    expect(screen.getByRole("region", { name: "Almoço" })).toHaveClass("co-sheet__body");
    await usuario.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Comi" }));
  });

  it.each(["light", "dark"] as const)("no tema %s, a receita em tela cheia passa no axe", async (tema) => {
    const { container } = render(
      <ThemeProvider theme={tema} attachTo="element" storageKey={null}>
        <Receita size="full" />
      </ThemeProvider>,
    );
    expect(await varrer(container)).toEqual([]);
  });
});

describe("a geometria, pela folha", () => {
  /** A altura do painel numa janela de `janela` px: o `100%` é o da camada, que é a janela. */
  const altura = (janela: number, valores: Valores) =>
    avaliar((Object.fromEntries(bloco(CHEIA))["height"] ?? "").replace("100%", `${janela}px`), valores);

  it("a altura é a da janela menos a faixa do véu, abaixo do relógio; é height, e não teto", () => {
    expect(bloco(CHEIA)).toEqual([
      ["height", "calc(100% - var(--co-statusbar-height) - var(--co-space-24))"],
      ["max-height", "none"],
    ]);
    // iPhone 16 (852px, 59px em cima): a faixa do véu tem 24px abaixo do relógio.
    expect(altura(852, aparelho(59, 0, 34, 0))).toBe(852 - 59 - 24);
    // Sem área segura (o navegador comum), 24px de véu.
    expect(altura(852, SEM_AREA)).toBe(828);
    expect(altura(568, SEM_AREA)).toBe(544);
    // A área segura de baixo é o `padding-bottom` da folha de sempre, por dentro da altura.
    expect(Object.fromEntries(bloco(".co-sheet"))["padding-bottom"]).toBe("env(safe-area-inset-bottom, 0px)");
    // A folha `auto` continua com o teto dela, e sem altura própria.
    const auto = Object.fromEntries(bloco(".co-sheet"));
    expect(auto["max-height"]).toBe("88%");
    expect(auto["height"]).toBeUndefined();
  });

  it("a largura, a cor e o movimento são os da folha de sempre: as regras da cheia só mexem na altura e no corpo", () => {
    const daCheia = REGRAS.filter((r) => r.seletores.some((s) => s.includes('data-size="full"')));
    expect(daCheia.map((r) => [lugar(r), r.declaracoes.map(([p]) => p)])).toEqual([
      [CHEIA, ["height", "max-height"]],
      [CORPO, ["display", "flex", "flex-direction", "min-height"]],
      [FILHOS, ["flex-shrink"]],
      [CARROSSEL, ["flex-grow"]],
    ]);
    // 520px de teto: numa janela larga a linha não passa de 80 caracteres.
    expect(Object.fromEntries(bloco(".co-sheet"))["max-width"]).toBe("520px");
  });

  it("o corpo ocupa o que sobra e é ele que rola; o cabeçalho e o rodapé ficam fora dele", () => {
    expect(bloco(CORPO)).toEqual([
      ["display", "flex"],
      ["flex", "1 1 auto"],
      ["flex-direction", "column"],
      ["min-height", "0"],
    ]);
    expect(Object.fromEntries(bloco(".co-sheet__body"))["overflow-y"]).toBe("auto");
    const folha = Object.fromEntries(bloco(".co-sheet"));
    expect([folha["display"], folha["flex-direction"]]).toEqual(["flex", "column"]);

    render(<Receita size="full" />);
    const painel = screen.getByRole("dialog", { name: "Almoço" });
    expect([...painel.children].map((filho) => filho.className)).toEqual([
      "co-sheet__header",
      "co-sheet__body",
      "co-sheet__footer",
    ]);
  });

  it("nada que está direto no corpo encolhe: quem rola é o corpo inteiro, e não o painel da aba", () => {
    expect(bloco(FILHOS)).toEqual([["flex-shrink", "0"]]);
    // Por que a regra existe (a isca): as abas encolhem e o painel delas rola
    // por dentro. Num corpo em coluna flex, sem o `flex-shrink: 0`, elas
    // cederiam a altura, e o painel rolaria com uma linha de altura.
    expect(Object.fromEntries(bloco(".co-tabs"))["min-height"]).toBe("0");
    const painelDaAba = Object.fromEntries(bloco(".co-tabs__panel"));
    expect([painelDaAba["flex"], painelDaAba["min-height"], painelDaAba["overflow"]]).toEqual(["1 1 auto", "0", "auto"]);
    // E o painel só tem teto quando alguém lhe dá um.
    expect(painelDaAba["max-height"]).toBe("var(--co-tabs-panel-max-height, none)");
  });

  it("o carrossel direto no corpo cresce até o rodapé, com as setas embaixo, e nunca corta o card na vertical", () => {
    expect(bloco(CARROSSEL)).toEqual([["flex-grow", "1"]]);
    const janela = Object.fromEntries(bloco(".co-deck__viewport"));
    // Cresce e não encolhe: com altura dada, as setas vão para baixo; sem ela, nada muda.
    expect(janela["flex"]).toBe("1 0 auto");
    expect(janela["overflow-x"]).toBe("clip");
    const cortam = REGRAS.filter((r) => r.seletores.some((s) => /\.co-deck(__viewport|__card)?(?![\w-])/.test(s)))
      .flatMap((r) => r.declaracoes.filter(([p]) => /^(overflow|overflow-y|height|max-height|block-size|max-block-size)$/.test(p)))
      .map(([p, v]) => `${p}: ${v}`);
    expect(cortam).toEqual([]);

    // Na composição, o carrossel é filho direto do corpo: é o que a regra alcança.
    render(<Receita size="full" />);
    const corpo = screen.getByRole("region", { name: "Almoço" });
    expect(corpo.firstElementChild).toHaveClass("co-deck");
  });

  it("de lado é do carrossel, também sobre o conteúdo da aba; na vertical, rola o corpo", () => {
    expect(Object.fromEntries(bloco(".co-deck__card"))["touch-action"]).toBe("pan-y");
    // O painel da aba é contêiner de rolagem, e corta a soma do `touch-action`:
    // sem a regra, o dedo de lado sobre os ingredientes não arrasta o card.
    expect(bloco(".co-deck__card .co-tabs__panel")).toEqual([["touch-action", "pan-y"]]);
    const outras = REGRAS.filter((r) => r.declaracoes.some(([p]) => p === "touch-action")).map(lugar);
    expect(outras).toContain(".co-deck__card .co-tabs__panel");
    expect(REGRAS.filter((r) => r.declaracoes.some(([p, v]) => p === "touch-action" && v === "none"))).toEqual([]);
  });

  it("o alvo de fechar tem 44px, e com movimento reduzido a folha cheia não anima", () => {
    const fechar = Object.fromEntries(bloco(".co-sheet__close"));
    expect(avaliar(fechar["width"] ?? "0px", SEM_AREA)).toBeGreaterThanOrEqual(44);
    expect(avaliar(fechar["height"] ?? "0px", SEM_AREA)).toBeGreaterThanOrEqual(44);
    expect(raiz("--co-target-min")).toBe("44px");

    // A entrada é a da folha de sempre, e a regra geral do movimento reduzido a zera.
    expect(Object.fromEntries(bloco(".co-sheet"))["animation"]).toBe(
      "co-sheet-subir var(--co-duration-slow) var(--co-ease)",
    );
    const reduzido = dentroDe("@media (prefers-reduced-motion: reduce)");
    const geral = reduzido.find((r) => r.seletores.includes(".co-root *"));
    expect(Object.fromEntries(geral?.declaracoes ?? [])["animation-duration"]).toBe("0.01ms !important");
    // E a cheia não traz animação nem transição própria, dentro ou fora do `@media`.
    const movem = [...REGRAS, ...reduzido]
      .filter((r) => r.seletores.some((s) => s.includes("data-size")))
      .flatMap((r) => r.declaracoes.filter(([p]) => /^(animation|transition|transform)/.test(p)));
    expect(movem).toEqual([]);
  });
});
