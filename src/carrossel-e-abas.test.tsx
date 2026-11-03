/// <reference types="vite/client" />
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Deck, DECK_GIRO_MAX, DECK_LIMIAR, giroDoDeck } from "./molecules/Deck";
import { Tabs } from "./molecules/Tabs";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./styles.css";
import { REGRAS, avaliar, bloco, dentroDe, lugar, raiz, ultimoComposto, classe, SEM_AREA } from "./test/folha";

/**
 * O carrossel de cards (`Deck`) e as abas dentro do card (`Tabs`), do cartão
 * slipalison/basalto#120 (o cardápio em cards). O happy-dom não faz layout:
 * o alvo e o limite se provam pela folha, e o axe que roda é o de verdade.
 */

const REFEICOES = ["Café da manhã", "Almoço", "Lanche", "Jantar"] as const;

function Cardapio({ inicio = 0, aoTrocar }: { inicio?: number; aoTrocar?: (i: number) => void }) {
  return (
    <Deck
      label="Cardápio do dia"
      defaultIndex={inicio}
      onIndexChange={aoTrocar}
      cardLabel={(i, total) => `${REFEICOES[i]}, ${i + 1} de ${total}`}
    >
      {REFEICOES.map((nome) => (
        <article key={nome}>
          <h3>{nome}</h3>
          <button type="button">Trocar {nome}</button>
        </article>
      ))}
    </Deck>
  );
}

const ITENS = [
  { value: "ingredientes", label: "Ingredientes", content: <p>Arroz, água e sal.</p> },
  { value: "preparo", label: "Preparo", content: <p>Refogue e cozinhe.</p> },
  { value: "macros", label: "Macros", content: <p>40 g de carboidrato.</p> },
] as const;

type Aba = (typeof ITENS)[number]["value"];

async function varrer(raizDoTeste: HTMLElement) {
  const resultado = await axe.run(raizDoTeste, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
    // O happy-dom não pinta: o contraste é provado em `tokens/contraste.test.ts`.
    // `region` é do documento inteiro, e aqui só há o componente.
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  return resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

const cardNaTela = () => screen.getAllByRole("group").find((g) => !g.hidden) as HTMLElement;

describe("Deck, o carrossel de cards", () => {
  it("é um carrossel com nome, e cada card um grupo com o nome da posição", () => {
    render(<Cardapio />);
    const carrossel = screen.getByRole("region", { name: "Cardápio do dia" });
    expect(carrossel).toHaveAttribute("aria-roledescription", "carrossel");
    const card = screen.getByRole("group", { name: "Café da manhã, 1 de 4" });
    expect(card).toHaveAttribute("aria-roledescription", "card");
    // Os outros ficam montados e escondidos.
    expect(screen.getAllByRole("group", { hidden: true })).toHaveLength(4);
    expect(screen.getAllByRole("group")).toHaveLength(1);
  });

  it("sem nome próprio, o card se chama pela posição", () => {
    render(
      <Deck label="Fotos">
        <p>um</p>
        <p>dois</p>
      </Deck>,
    );
    expect(screen.getByRole("group", { name: "1 de 2" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Card anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próximo card" })).toBeInTheDocument();
  });

  it("as setas trocam de card, o foco vai para o card novo, e na ponta a seta apaga sem perder o foco", async () => {
    const usuario = userEvent.setup();
    const aoTrocar = vi.fn();
    render(<Cardapio aoTrocar={aoTrocar} />);
    const anterior = screen.getByRole("button", { name: "Card anterior" });
    const proximo = screen.getByRole("button", { name: "Próximo card" });
    expect(anterior).toHaveAttribute("aria-disabled", "true");
    expect(anterior).not.toBeDisabled();

    await usuario.click(proximo);
    expect(aoTrocar).toHaveBeenLastCalledWith(1);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("group", { name: "Almoço, 2 de 4" })));
    expect(anterior).not.toHaveAttribute("aria-disabled");

    await usuario.click(anterior);
    await waitFor(() => expect(cardNaTela()).toHaveAccessibleName("Café da manhã, 1 de 4"));

    // Na ponta da esquerda o clique não faz nada.
    aoTrocar.mockClear();
    await usuario.click(anterior);
    expect(aoTrocar).not.toHaveBeenCalled();
  });

  it("pelo teclado: setas, Home e End no card e nas setas; nunca dá a volta", async () => {
    const usuario = userEvent.setup();
    render(<Cardapio />);
    screen.getByRole("button", { name: "Próximo card" }).focus();
    await usuario.keyboard("{ArrowRight}");
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName("Almoço, 2 de 4"));
    await usuario.keyboard("{ArrowRight}");
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName("Lanche, 3 de 4"));
    await usuario.keyboard("{End}");
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName("Jantar, 4 de 4"));
    await usuario.keyboard("{ArrowRight}");
    expect(cardNaTela()).toHaveAccessibleName("Jantar, 4 de 4");
    expect(screen.getByRole("button", { name: "Próximo card" })).toHaveAttribute("aria-disabled", "true");
    await usuario.keyboard("{ArrowLeft}");
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName("Lanche, 3 de 4"));
    await usuario.keyboard("{Home}");
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName("Café da manhã, 1 de 4"));
    await usuario.keyboard("{ArrowLeft}");
    expect(cardNaTela()).toHaveAccessibleName("Café da manhã, 1 de 4");
  });

  it("a seta dentro de um controle do card é do controle, e não do carrossel", async () => {
    const usuario = userEvent.setup();
    render(
      <Deck label="Cardápio">
        <input aria-label="Porção" />
        <p>dois</p>
      </Deck>,
    );
    await usuario.click(screen.getByRole("textbox", { name: "Porção" }));
    await usuario.keyboard("{ArrowRight}{End}");
    expect(cardNaTela()).toHaveAccessibleName("1 de 2");
  });

  it("controlado: mostra o `index` de quem usa, e preso às pontas", () => {
    function Controlado() {
      const [i, definir] = useState(9);
      return (
        <Deck label="Cardápio" index={i} onIndexChange={definir}>
          <p>um</p>
          <p>dois</p>
        </Deck>
      );
    }
    render(<Controlado />);
    expect(cardNaTela()).toHaveAccessibleName("2 de 2");
    fireEvent.click(screen.getByRole("button", { name: "Card anterior" }));
    expect(cardNaTela()).toHaveAccessibleName("1 de 2");
  });

  it("um card só não tem setas nem indicador; nenhum card não quebra", () => {
    const { container, rerender } = render(
      <Deck label="Cardápio">
        <p>só</p>
      </Deck>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector(".co-deck__dots")).toBeNull();
    rerender(<Deck label="Cardápio">{[]}</Deck>);
    expect(screen.getByRole("region", { name: "Cardápio" })).toBeInTheDocument();
  });

  it("o indicador marca a vaga cheia e as vazias, e é desenho", async () => {
    const usuario = userEvent.setup();
    const { container } = render(<Cardapio />);
    const lista = container.querySelector(".co-deck__dots") as HTMLElement;
    expect(lista).toHaveAttribute("aria-hidden", "true");
    const cheias = () =>
      [...lista.querySelectorAll(".co-deck__dot")].map((d) => d.getAttribute("data-current") === "true");
    expect(cheias()).toEqual([true, false, false, false]);
    await usuario.click(screen.getByRole("button", { name: "Próximo card" }));
    expect(cheias()).toEqual([false, true, false, false]);
  });

  describe("o arrasto", () => {
    function arrastar(alvo: HTMLElement, de: number, ate: number, passos = [de + (ate - de) / 2]) {
      fireEvent.pointerDown(alvo, { pointerId: 1, button: 0, clientX: de });
      for (const x of passos) fireEvent.pointerMove(alvo, { pointerId: 1, clientX: x });
      fireEvent.pointerMove(alvo, { pointerId: 1, clientX: ate });
      fireEvent.pointerUp(alvo, { pointerId: 1, clientX: ate });
    }

    it("para a esquerda além do limiar avança, para a direita volta, e o foco vai junto", async () => {
      const aoTrocar = vi.fn();
      render(<Cardapio aoTrocar={aoTrocar} />);
      arrastar(cardNaTela(), 300, 300 - DECK_LIMIAR - 10);
      expect(aoTrocar).toHaveBeenLastCalledWith(1);
      await waitFor(() => expect(document.activeElement).toHaveAccessibleName("Almoço, 2 de 4"));
      arrastar(cardNaTela(), 100, 100 + DECK_LIMIAR + 10);
      expect(aoTrocar).toHaveBeenLastCalledWith(0);
    });

    it("abaixo do limiar o card volta, e na ponta o arrasto não sai da ponta", () => {
      const aoTrocar = vi.fn();
      render(<Cardapio aoTrocar={aoTrocar} />);
      arrastar(cardNaTela(), 300, 300 - DECK_LIMIAR + 10);
      arrastar(cardNaTela(), 100, 100 + DECK_LIMIAR + 50);
      expect(aoTrocar).not.toHaveBeenCalled();
      expect(cardNaTela()).not.toHaveAttribute("data-dragging");
    });

    it("durante o arrasto o card leva o deslocamento e o giro, e o giro é leve", () => {
      render(<Cardapio />);
      const card = cardNaTela();
      fireEvent.pointerDown(card, { pointerId: 1, button: 0, clientX: 200 });
      fireEvent.pointerMove(card, { pointerId: 1, clientX: 160 });
      expect(card).toHaveAttribute("data-dragging", "true");
      expect(card.style.getPropertyValue("--co-deck-dx")).toBe("-40px");
      expect(card.style.getPropertyValue("--co-deck-tilt")).toBe(`${giroDoDeck(-40)}deg`);
      fireEvent.pointerCancel(card, { pointerId: 1 });
      expect(card).not.toHaveAttribute("data-dragging");
      expect(giroDoDeck(-40)).toBeLessThan(0);
      expect(giroDoDeck(5000)).toBe(DECK_GIRO_MAX);
      expect(giroDoDeck(-5000)).toBe(-DECK_GIRO_MAX);
      expect(DECK_GIRO_MAX).toBeLessThanOrEqual(8);
    });

    it("o toque que não anda é toque no botão do card; o clique que fecha um arrasto, não", () => {
      const aoTocar = vi.fn();
      render(
        <Deck label="Cardápio">
          <button type="button" onClick={aoTocar}>
            Trocar
          </button>
          <p>dois</p>
        </Deck>,
      );
      const botao = screen.getByRole("button", { name: "Trocar" });
      fireEvent.pointerDown(botao, { pointerId: 1, button: 0, clientX: 100 });
      fireEvent.pointerMove(botao, { pointerId: 1, clientX: 103 });
      fireEvent.pointerUp(botao, { pointerId: 1, clientX: 103 });
      fireEvent.click(botao);
      expect(aoTocar).toHaveBeenCalledTimes(1);

      fireEvent.pointerDown(botao, { pointerId: 1, button: 0, clientX: 100 });
      fireEvent.pointerMove(botao, { pointerId: 1, clientX: 70 });
      fireEvent.pointerUp(botao, { pointerId: 1, clientX: 70 });
      fireEvent.click(botao);
      expect(aoTocar).toHaveBeenCalledTimes(1);
    });

    it("botão que não é o principal, e outro ponteiro, não arrastam", () => {
      const aoTrocar = vi.fn();
      render(<Cardapio aoTrocar={aoTrocar} />);
      const card = cardNaTela();
      fireEvent.pointerDown(card, { pointerId: 1, button: 2, clientX: 300 });
      fireEvent.pointerMove(card, { pointerId: 1, clientX: 100 });
      fireEvent.pointerUp(card, { pointerId: 1, clientX: 100 });
      fireEvent.pointerDown(card, { pointerId: 1, button: 0, clientX: 300 });
      fireEvent.pointerMove(card, { pointerId: 2, clientX: 100 });
      fireEvent.pointerUp(card, { pointerId: 2, clientX: 100 });
      fireEvent.pointerUp(card, { pointerId: 1, clientX: 300 });
      expect(aoTrocar).not.toHaveBeenCalled();
    });

    it("a vertical é da página, e o card anda só pela folha, sem animação com movimento reduzido", () => {
      const card = Object.fromEntries(bloco(".co-deck__card"));
      expect(card["touch-action"]).toBe("pan-y");
      const arrastando = Object.fromEntries(bloco('.co-deck__card[data-dragging="true"]'));
      expect(arrastando["transform"]).toBe("translateX(var(--co-deck-dx)) rotate(var(--co-deck-tilt))");
      expect(arrastando["transition"]).toBe("none");

      const reduzido = dentroDe("@media (prefers-reduced-motion: reduce)");
      const semMovimento = reduzido.find((r) => r.seletores.includes('.co-root .co-deck__card[data-dragging="true"]'));
      expect(semMovimento?.declaracoes).toEqual([["transform", "none"]]);
      // E a volta do card, que é transição, zera pela regra geral do movimento reduzido.
      const geral = reduzido.find((r) => r.seletores.includes(".co-root *"));
      expect(Object.fromEntries(geral?.declaracoes ?? [])["transition-duration"]).toBe("0.01ms !important");
    });
  });

  it("a janela corta só na horizontal, e sem virar contêiner de rolagem: a página não rola de lado", () => {
    const janela = Object.fromEntries(bloco(".co-deck__viewport"));
    expect(janela["overflow-x"]).toBe("clip");
    expect(janela["min-width"]).toBe("0");
    expect(Object.fromEntries(bloco(".co-deck"))["max-width"]).toBe("100%");
  });
});

describe("Tabs, as abas dentro do card", () => {
  it("tablist, tab e tabpanel amarrados, e só a aba aberta no Tab", () => {
    render(<Tabs label="Receita" items={ITENS} />);
    const fileira = screen.getByRole("tablist", { name: "Receita" });
    const abas = within(fileira).getAllByRole("tab");
    expect(abas.map((a) => a.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
    expect(abas.map((a) => a.tabIndex)).toEqual([0, -1, -1]);
    const painel = screen.getByRole("tabpanel", { name: "Ingredientes" });
    expect(abas[0]).toHaveAttribute("aria-controls", painel.id);
    expect(painel).toHaveAttribute("tabindex", "0");
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(3);
  });

  it("setas dão a volta, Home e End vão às pontas, e a aba focada abre", async () => {
    const usuario = userEvent.setup();
    const aoMudar = vi.fn();
    render(<Tabs label="Receita" items={ITENS} onChange={aoMudar} />);
    await usuario.tab();
    expect(document.activeElement).toHaveAccessibleName("Ingredientes");
    await usuario.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAccessibleName("Preparo");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Preparo");
    await usuario.keyboard("{End}");
    expect(document.activeElement).toHaveAccessibleName("Macros");
    await usuario.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAccessibleName("Ingredientes");
    await usuario.keyboard("{ArrowLeft}");
    expect(document.activeElement).toHaveAccessibleName("Macros");
    await usuario.keyboard("{Home}");
    expect(document.activeElement).toHaveAccessibleName("Ingredientes");
    expect(aoMudar.mock.calls.map(([v]) => v)).toEqual(["preparo", "macros", "ingredientes", "macros", "ingredientes"]);
    // Do tab aberto, o próximo Tab é o painel.
    await usuario.tab();
    expect(document.activeElement).toBe(screen.getByRole("tabpanel"));
  });

  it("o clique abre; controlado mostra o `value`, e um valor que não casa abre a primeira", async () => {
    const usuario = userEvent.setup();
    function Controlado() {
      const [aba, definir] = useState<Aba>("macros");
      return <Tabs label="Receita" items={ITENS} value={aba} onChange={definir} />;
    }
    const { unmount } = render(<Controlado />);
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Macros");
    await usuario.click(screen.getByRole("tab", { name: "Preparo" }));
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Preparo");
    unmount();

    render(<Tabs label="Receita" items={ITENS} value={"sumiu" as Aba} />);
    expect(screen.getByRole("tab", { name: "Ingredientes" })).toHaveAttribute("tabindex", "0");
  });

  it("o painel rola por dentro, nos dois eixos, e nem a fileira nem o painel empurram a página", () => {
    const painel = Object.fromEntries(bloco(".co-tabs__panel"));
    expect(painel["overflow"]).toBe("auto");
    expect(painel["min-width"]).toBe("0");
    expect(painel["min-height"]).toBe("0");
    expect(painel["overflow-wrap"]).toBe("anywhere");
    const fileira = Object.fromEntries(bloco(".co-tabs__list"));
    expect(fileira["overflow-x"]).toBe("auto");
    expect(fileira["min-width"]).toBe("0");
    expect(Object.fromEntries(bloco(".co-tabs"))["max-width"]).toBe("100%");
    // O anel do painel e das abas fica por dentro, para a rolagem não o cortar.
    expect(bloco(".co-tabs__panel:focus-visible")).toEqual([["outline-offset", "-2px"]]);
    expect(bloco(".co-tabs__tab:focus-visible")).toEqual([["outline-offset", "-2px"]]);
    expect(bloco('.co-tabs__tab[aria-selected="true"]:focus-visible')).toEqual([
      ["outline-color", "var(--co-accent-contrast)"],
    ]);
  });

  it("a aba aberta muda de fundo e de peso, e não só de cor; e herda a fonte", () => {
    const aberta = Object.fromEntries(bloco('.co-tabs__tab[aria-selected="true"]'));
    expect(aberta["background"]).toBe("var(--co-accent)");
    expect(aberta["font-weight"]).toBe("var(--co-weight-semibold)");
    const aba = Object.fromEntries(bloco(".co-tabs__tab"));
    expect(aba["font"]).toBe("inherit");
    expect(avaliar(aba["font-size"] ?? "", SEM_AREA)).toBeGreaterThanOrEqual(14);
  });
});

describe("o piso das duas peças", () => {
  it("alvo: as setas e as abas têm 44px nos dois eixos, e nenhuma regra os encolhe", () => {
    const medidas: [string, string[]][] = [
      [".co-deck__arrow", ["width", "height"]],
      [".co-tabs__tab", ["min-width", "min-height"]],
    ];
    for (const [seletor, eixos] of medidas) {
      const declaracoes = Object.fromEntries(bloco(seletor));
      for (const eixo of eixos) {
        expect(avaliar(declaracoes[eixo] ?? "0px", SEM_AREA), `${seletor} { ${eixo} }`).toBeGreaterThanOrEqual(44);
      }
    }
    expect(raiz("--co-target-min")).toBe("44px");
    const TAMANHO = /^(min-|max-)?(height|width|block-size|inline-size)$/;
    const encolhem = REGRAS.filter((r) =>
      r.seletores.some((s) => classe("co-deck__arrow", "co-tabs__tab").test(ultimoComposto(s))),
    ).flatMap((r) =>
      r.declaracoes
        .filter(([p]) => TAMANHO.test(p))
        .filter(([, v]) => !(avaliar(v, SEM_AREA) >= 44))
        .map(([p, v]) => `${lugar(r)} { ${p}: ${v} }`),
    );
    expect(encolhem).toEqual([]);
  });

  it("a seta herda a fonte, e desligada se vê desligada do mesmo jeito em :disabled e aria-disabled", () => {
    expect(Object.fromEntries(bloco(".co-deck__arrow"))["font"]).toBe("inherit");
    const desligada = REGRAS.find((r) => r.seletores.includes('.co-deck__arrow[aria-disabled="true"]'));
    expect(desligada?.seletores).toEqual([".co-deck__arrow:disabled", '.co-deck__arrow[aria-disabled="true"]']);
    const passa = REGRAS.find((r) => r.seletores.some((s) => s.startsWith(".co-deck__arrow:hover")));
    expect(passa?.seletores).toEqual(['.co-deck__arrow:hover:not(:disabled):not([aria-disabled="true"])']);
  });

  it("o indicador: vaga vazia é anel no limite de controle, a cheia é traço largo e cheio", () => {
    const vazia = Object.fromEntries(bloco(".co-deck__dot"));
    const cheia = Object.fromEntries(bloco('.co-deck__dot[data-current="true"]'));
    expect(vazia["border"]).toBe("var(--co-border-width) solid var(--co-control-border)");
    expect(vazia["background"]).toBe("transparent");
    expect(cheia["background"]).toBe("var(--co-accent)");
    // Forma diferente, e não só cor: a cheia é mais larga.
    expect(avaliar(cheia["width"] ?? "", SEM_AREA)).toBeGreaterThan(avaliar(vazia["width"] ?? "", SEM_AREA));
  });

  it.each(["light", "dark"] as const)("no tema %s, o carrossel com abas dentro do card passa no axe", async (tema) => {
    const { container } = render(
      <ThemeProvider theme={tema} attachTo="element" storageKey={null}>
        <Deck label="Cardápio do dia" cardLabel={(i, t) => `${REFEICOES[i]}, ${i + 1} de ${t}`}>
          {REFEICOES.map((nome) => (
            <article key={nome}>
              <h3>{nome}</h3>
              <Tabs label={`Receita do ${nome}`} items={ITENS} />
            </article>
          ))}
        </Deck>
      </ThemeProvider>,
    );
    expect(await varrer(container)).toEqual([]);
  });
});
