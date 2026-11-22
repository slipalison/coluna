/// <reference types="vite/client" />
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useRef, useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLATE_CELLS, Plate, plateCounts, plateFill, type PlateSlice } from "./molecules/Plate";
import { RecipeCard } from "./molecules/RecipeCard";
import { Skeleton } from "./molecules/Skeleton";
import { Toast, TOAST_FOCUS_SHORTCUT, type ToastCloseReason } from "./molecules/Toast";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./styles.css";
import { aparelho, avaliar, bloco, dentroDe, lugar, REGRAS } from "./test/folha";

/**
 * As peças do livro de receitas (cartão slipalison/basalto#182), cada uma com
 * a prova que o cartão pede, nos dois temas:
 *
 *   Plate       a composição pronta vira células; a legenda em texto sempre;
 *               a onda por anel; a varredura de acessibilidade
 *   RecipeCard  o cartão inteiro é o alvo de 44px, e o nome do link é o título
 *   Toast       região viva, teclado, foco devolvido, pausa com foco e com
 *               ponteiro, e o teto
 *   Skeleton    o estado pronto: anunciado uma vez, e o pulso que acaba
 *
 * A guarda da CSP de todas elas está em `src/csp.test.tsx`.
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
    // e, no navegador, com o axe sobre o catálogo.
    rules: { "color-contrast": { enabled: false } },
  });
  unmount();
  return resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

const RESUMO = "Fecha 90% do alvo do almoço";

const ALMOCO: PlateSlice[] = [
  { group: "protein", fraction: 0.3, label: "Frango · 150 g" },
  { group: "carb", fraction: 0.3, label: "Arroz · 120 g" },
  { group: "veg", fraction: 0.25, label: "Brócolis · 80 g" },
  { group: "fat", fraction: 0.05, label: "Azeite · 5 g" },
];

// ------------------------------------------------------------------ prato --

describe("Plate", () => {
  it("tem 37 células em 4 anéis (1 + 6 + 12 + 18), o meio primeiro", () => {
    expect(PLATE_CELLS).toHaveLength(37);
    expect([0, 1, 2, 3].map((anel) => PLATE_CELLS.filter((c) => c.ring === anel).length)).toEqual([1, 6, 12, 18]);
    expect(PLATE_CELLS[0]?.ring).toBe(0);
  });

  it("a composição pronta vira células: a soma das frações é a parte cheia, e o resto fica vazio", () => {
    const contas = plateCounts(ALMOCO);
    // 0,9 de 37 = 33,3 → 33 cheias; 4 vazias.
    expect(contas.reduce((a, b) => a + b, 0)).toBe(33);
    expect(contas).toEqual([11, 11, 9, 2]);
    expect(plateFill(ALMOCO).filter((g) => g === undefined)).toHaveLength(4);
  });

  it("o prato completo fecha as 37; passar do alvo não estoura, e a fatia miúda não some", () => {
    expect(plateCounts([{ fraction: 0.5 }, { fraction: 0.5 }]).reduce((a, b) => a + b, 0)).toBe(37);
    expect(plateCounts([{ fraction: 0.9 }, { fraction: 0.6 }]).reduce((a, b) => a + b, 0)).toBe(37);
    expect(plateCounts([{ fraction: 0.99 }, { fraction: 0.001 }])).toEqual([36, 1]);
    expect(plateCounts([{ fraction: Number.NaN }, { fraction: -1 }])).toEqual([0, 0]);
  });

  it("cada grupo é um setor contínuo, na ordem dada", () => {
    const grupos = plateFill(ALMOCO);
    const trocas = grupos.filter((g, i) => i > 0 && g !== grupos[i - 1]).length;
    // proteína → carboidrato → hortaliça → gordura → vazio: 4 trocas.
    expect(trocas).toBe(4);
  });

  it("a legenda em texto vem sempre, com o nome e os gramas; o desenho sai aria-hidden", () => {
    const { container } = render(<Plate slices={ALMOCO} summary={RESUMO} size="sm" />);
    const legenda = screen.getByRole("list", { name: "Composição do prato" });
    expect(within(legenda).getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      ALMOCO.map((s) => s.label),
    );
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll('.co-plate__cell[data-group="protein"]')).toHaveLength(11);
    expect(container.querySelectorAll(".co-plate__cell:not([data-group])")).toHaveLength(4);
  });

  it("a amostra da legenda é o hexágono, no tom do grupo", () => {
    const { container } = render(<Plate slices={ALMOCO} summary={RESUMO} />);
    const amostras = [...container.querySelectorAll(".co-legend__swatch")];
    expect(amostras.map((a) => [a.getAttribute("data-swatch"), a.getAttribute("data-tone")])).toEqual(
      ALMOCO.map((s) => ["hex", s.group]),
    );
  });

  it("quando a composição muda, só as células que trocam de grupo nascem de novo (a onda)", () => {
    const { container, rerender } = render(<Plate slices={ALMOCO} summary={RESUMO} />);
    const antes = [...container.querySelectorAll(".co-plate__cell")];
    rerender(<Plate summary={RESUMO} slices={ALMOCO.map((s) => (s.group === "fat" ? { ...s, fraction: 0.1 } : s))} />);
    const depois = [...container.querySelectorAll(".co-plate__cell")];
    const novas = depois.filter((c, i) => c !== antes[i]);
    expect(novas.length).toBeGreaterThan(0);
    expect(novas.length).toBeLessThan(37);
  });

  it("a onda anda 12ms por anel, pelo token, do centro para a borda", () => {
    expect(Object.fromEntries(bloco('.co-plate__cell[data-ring="1"]'))["animation-delay"]).toBe(
      "var(--co-duration-wave)",
    );
    expect(Object.fromEntries(bloco('.co-plate__cell[data-ring="3"]'))["animation-delay"]).toBe(
      "calc(var(--co-duration-wave) * 3)",
    );
    expect(getComputedStyle(document.documentElement).getPropertyValue("--co-duration-wave").trim()).toBe("12ms");
  });

  it("passou do alvo: o aro fica tracejado na cor de atenção", () => {
    const { container } = render(<Plate slices={ALMOCO} summary={RESUMO} over />);
    expect(container.querySelector("svg")).toHaveAttribute("data-over", "true");
    expect(Object.fromEntries(bloco('.co-plate__art[data-over="true"] .co-plate__rim'))).toMatchObject({
      stroke: "var(--co-warn)",
      "stroke-dasharray": "6 5",
    });
  });

  it("quanto falta para o alvo está em texto, visível e lido: o resumo vem junto da legenda, fora do desenho aria-hidden", () => {
    const { container } = render(<Plate slices={ALMOCO} summary="Falta 10% para o alvo do almoço" />);
    const resumo = screen.getByText("Falta 10% para o alvo do almoço");
    // Não está dentro do desenho (aria-hidden), nem escondido: é texto de verdade.
    expect(resumo.closest("[aria-hidden='true']")).toBeNull();
    expect(container.querySelector("svg")?.contains(resumo)).toBe(false);
    expect(resumo.closest(".co-plate__text")).toContainElement(screen.getByRole("list", { name: "Composição do prato" }));
  });

  it("o prato mini do cartão também diz quanto falta, em texto, e não só no desenho", () => {
    render(
      <RecipeCard title="Omelete" slices={ALMOCO.slice(0, 1)} summary="Falta 70% para o alvo do almoço" kcal="320" time="10 min" origin="À mão" />,
    );
    const resumo = screen.getByText("Falta 70% para o alvo do almoço");
    expect(resumo.closest("[aria-hidden='true']")).toBeNull();
    expect(screen.getByRole("article")).toContainElement(resumo);
  });

  it.each(TEMAS)("no tema %s, o mini e o grande passam no axe", async (tema) => {
    expect(
      await semViolacao(
        <>
          <Plate slices={ALMOCO} summary={RESUMO} size="sm" />
          <Plate slices={ALMOCO} summary={RESUMO} size="lg" over label="Prato do almoço" />
        </>,
        tema,
      ),
    ).toEqual([]);
  });
});

// ------------------------------------------------------- cartão de receita --

describe("RecipeCard", () => {
  const cartao = (extra: Partial<Parameters<typeof RecipeCard>[0]> = {}) => (
    <RecipeCard title="Frango com arroz" slices={ALMOCO} summary={RESUMO} kcal="520" time="35 min" origin="À mão" {...extra} />
  );

  it("o nome do link é o título, e o resto continua texto: kcal da base, tempo, origem e a legenda", () => {
    render(cartao({ href: "#receita--1" }));
    const link = screen.getByRole("link", { name: "Frango com arroz" });
    expect(link).toHaveAttribute("href", "#receita--1");
    const artigo = screen.getByRole("article");
    expect(artigo).toHaveTextContent("520 kcal · 35 min · À mão");
    expect(within(artigo).getByRole("heading", { level: 3, name: "Frango com arroz" })).toBeInTheDocument();
    expect(within(artigo).getByRole("list", { name: "Prato de Frango com arroz" })).toBeInTheDocument();
  });

  it("sem href, é um botão, e o Enter abre", async () => {
    const abrir = vi.fn();
    render(cartao({ onSelect: abrir, headingLevel: 2 }));
    const botao = screen.getByRole("button", { name: "Frango com arroz" });
    await userEvent.tab();
    expect(botao).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(abrir).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("o cartão inteiro é o alvo: a camada do link cobre o cartão, que mede pelo menos 44px", () => {
    expect(Object.fromEntries(bloco(".co-recipe-card"))).toMatchObject({
      position: "relative",
      "min-height": "var(--co-target-min)",
    });
    expect(Object.fromEntries(bloco(".co-recipe-card__action::after"))).toMatchObject({
      content: '""',
      position: "absolute",
      inset: "0",
    });
    // O anel de foco é da camada, por fora do cartão.
    expect(Object.fromEntries(bloco(".co-root .co-recipe-card__action:focus-visible::after"))).toEqual({
      outline: "2px solid var(--co-focus)",
      "outline-offset": "2px",
    });
  });

  it("o botão do título herda a letra (font: inherit)", () => {
    expect(Object.fromEntries(bloco(".co-recipe-card__action"))["font"]).toBe("inherit");
  });

  it.each(TEMAS)("no tema %s, o de link e o de botão passam no axe", async (tema) => {
    expect(
      await semViolacao(
        <>
          {cartao({ href: "#a" })}
          {cartao({ onSelect: vi.fn(), title: "Omelete" })}
        </>,
        tema,
      ),
    ).toEqual([]);
  });
});

// ------------------------------------------------------- aviso passageiro --

function ComAviso({
  aoFechar,
  aoDesfazer,
  duracao = 5000,
  teto = 20000,
  comRetorno = false,
}: {
  aoFechar?: (motivo: ToastCloseReason) => void;
  aoDesfazer?: () => void;
  duracao?: number;
  teto?: number;
  comRetorno?: boolean;
}) {
  const [aberto, abrir] = useState(false);
  const retorno = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button type="button" ref={retorno}>
        Lista
      </button>
      <button type="button" onClick={() => abrir(true)}>
        Marcar feita
      </button>
      <Toast
        open={aberto}
        position="static"
        message="Almoço marcado como feito"
        actionLabel="Desfazer"
        onAction={aoDesfazer}
        onClose={(motivo) => {
          aoFechar?.(motivo);
          abrir(false);
        }}
        duration={duracao}
        maxDuration={teto}
        returnFocus={comRetorno ? retorno : undefined}
      />
    </>
  );
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  const usuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const avancar = (ms: number) => act(() => vi.advanceTimersByTime(ms));

  it("a região viva existe antes da mensagem, vazia, e a mensagem entra nela ao abrir", async () => {
    render(<ComAviso />);
    const regiao = screen.getByRole("status");
    expect(regiao).toHaveAttribute("aria-live", "polite");
    expect(regiao).toHaveAttribute("aria-atomic", "true");
    expect(regiao).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: "Desfazer" })).toBeNull();
    await usuario().click(screen.getByRole("button", { name: "Marcar feita" }));
    // A MESMA região, agora com a mensagem: é o que o leitor de tela anuncia.
    expect(screen.getByRole("status")).toBe(regiao);
    expect(regiao).toHaveTextContent("Almoço marcado como feito");
    // E diz que há uma ação: senão só quem vê saberia do "Desfazer".
    expect(regiao).toHaveTextContent("Ação no aviso: Desfazer.");
  });

  it("não rouba o foco ao abrir", async () => {
    render(<ComAviso />);
    const marcar = screen.getByRole("button", { name: "Marcar feita" });
    await usuario().click(marcar);
    expect(marcar).toHaveFocus();
  });

  it("some no tempo de quem usa", async () => {
    const fechou = vi.fn();
    render(<ComAviso aoFechar={fechou} duracao={4000} />);
    await usuario().click(screen.getByRole("button", { name: "Marcar feita" }));
    avancar(3900);
    expect(screen.getByRole("status")).toHaveTextContent("Almoço");
    avancar(200);
    expect(fechou).toHaveBeenCalledWith("timeout");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("pelo teclado: o Tab chega ao Desfazer, o Enter desfaz, e o foco volta para onde estava", async () => {
    const desfez = vi.fn();
    const fechou = vi.fn();
    const eu = usuario();
    render(<ComAviso aoDesfazer={desfez} aoFechar={fechou} />);
    const marcar = screen.getByRole("button", { name: "Marcar feita" });
    await eu.click(marcar);
    await eu.tab();
    expect(screen.getByRole("button", { name: "Desfazer" })).toHaveFocus();
    await eu.keyboard("{Enter}");
    expect(desfez).toHaveBeenCalledTimes(1);
    expect(fechou).toHaveBeenCalledWith("action");
    expect(marcar).toHaveFocus();
  });

  it("o Esc dispensa e devolve o foco para returnFocus, quando quem usa o dá", async () => {
    const fechou = vi.fn();
    const eu = usuario();
    render(<ComAviso aoFechar={fechou} comRetorno />);
    await eu.click(screen.getByRole("button", { name: "Marcar feita" }));
    await eu.tab();
    await eu.tab();
    expect(screen.getByRole("button", { name: "Fechar aviso" })).toHaveFocus();
    await eu.keyboard("{Escape}");
    expect(fechou).toHaveBeenCalledWith("dismiss");
    expect(screen.getByRole("button", { name: "Lista" })).toHaveFocus();
  });

  it("pausa enquanto tem o foco, e volta a contar de onde parou quando o foco sai", async () => {
    const fechou = vi.fn();
    const eu = usuario();
    render(<ComAviso aoFechar={fechou} duracao={4000} teto={60000} />);
    const marcar = screen.getByRole("button", { name: "Marcar feita" });
    await eu.click(marcar);
    avancar(3000);
    await eu.tab();
    avancar(30000);
    expect(fechou).not.toHaveBeenCalled();
    act(() => marcar.focus());
    avancar(900);
    expect(fechou).not.toHaveBeenCalled();
    avancar(200);
    expect(fechou).toHaveBeenCalledWith("timeout");
  });

  it("pausa enquanto o ponteiro está em cima", async () => {
    const fechou = vi.fn();
    const { container } = render(<ComAviso aoFechar={fechou} duracao={4000} teto={60000} />);
    await usuario().click(screen.getByRole("button", { name: "Marcar feita" }));
    const aviso = container.querySelector(".co-toast") as HTMLElement;
    fireEvent.pointerEnter(aviso);
    avancar(20000);
    expect(fechou).not.toHaveBeenCalled();
    fireEvent.pointerLeave(aviso);
    avancar(4100);
    expect(fechou).toHaveBeenCalledWith("timeout");
  });

  it("com o foco dentro, o teto NÃO fecha o aviso: o Desfazer fica, e ele fecha quando o foco sai", async () => {
    const fechou = vi.fn();
    const eu = usuario();
    render(<ComAviso aoFechar={fechou} duracao={4000} teto={12000} />);
    const marcar = screen.getByRole("button", { name: "Marcar feita" });
    await eu.click(marcar);
    await eu.tab();
    const desfazer = screen.getByRole("button", { name: "Desfazer" });
    expect(desfazer).toHaveFocus();
    // Muito além do teto de 12 s: quem demora a decidir no teclado não perde a ação (WCAG 2.2.1).
    avancar(120000);
    expect(fechou).not.toHaveBeenCalled();
    expect(desfazer).toHaveFocus();
    // O foco sai: o teto já tinha passado, e o aviso fecha com o motivo `timeout`.
    act(() => marcar.focus());
    expect(fechou).toHaveBeenCalledWith("timeout");
    expect(marcar).toHaveFocus();
  });

  it("o teto continua fechando o aviso sem foco dentro, ainda que o tempo da pausa não tenha acabado", async () => {
    const fechou = vi.fn();
    const { container } = render(<ComAviso aoFechar={fechou} duracao={4000} teto={12000} />);
    await usuario().click(screen.getByRole("button", { name: "Marcar feita" }));
    const aviso = container.querySelector(".co-toast") as HTMLElement;
    // O ponteiro em cima pausa o tempo, mas não segura o teto.
    fireEvent.pointerEnter(aviso);
    avancar(11000);
    expect(fechou).not.toHaveBeenCalled();
    avancar(1100);
    expect(fechou).toHaveBeenCalledWith("timeout");
  });

  it(`${TOAST_FOCUS_SHORTCUT} leva o foco ao aviso aberto, de onde a pessoa estiver, e o foco volta ao fechar`, async () => {
    const fechou = vi.fn();
    const eu = usuario();
    render(<ComAviso aoFechar={fechou} duracao={4000} teto={20000} />);
    const marcar = screen.getByRole("button", { name: "Marcar feita" });
    // Sem aviso aberto, a tecla não faz nada.
    marcar.focus();
    fireEvent.keyDown(document.body, { key: "n", code: "KeyN", altKey: true });
    expect(marcar).toHaveFocus();
    await eu.click(marcar);
    // Sem o Alt, ou com outro modificador, não é o atalho.
    fireEvent.keyDown(document.body, { key: "n", code: "KeyN" });
    fireEvent.keyDown(document.body, { key: "n", code: "KeyN", altKey: true, ctrlKey: true });
    expect(marcar).toHaveFocus();
    // O atalho leva o foco ao Desfazer, sem passar pelas paradas do meio do documento.
    const acionou = fireEvent.keyDown(document.body, { key: "n", code: "KeyN", altKey: true });
    expect(acionou, "o atalho consome a tecla").toBe(false);
    expect(screen.getByRole("button", { name: "Desfazer" })).toHaveFocus();
    // E o foco volta para onde estava quando o aviso fecha.
    await eu.keyboard("{Escape}");
    expect(fechou).toHaveBeenCalledWith("dismiss");
    expect(marcar).toHaveFocus();
  });

  it("o anúncio do aviso diz a tecla que leva o foco até ele", async () => {
    render(<ComAviso />);
    await usuario().click(screen.getByRole("button", { name: "Marcar feita" }));
    expect(screen.getByRole("status")).toHaveTextContent(`${TOAST_FOCUS_SHORTCUT} leva o foco ao aviso`);
  });

  it("a API recusa um teto menor ou igual ao tempo: ele anularia a pausa", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const [duracao, teto] of [
      [5000, 5000],
      [5000, 4000],
      [5000, Number.NaN],
    ] as const) {
      expect(
        () => render(<Toast open message="x" onClose={vi.fn()} duration={duracao} maxDuration={teto} />),
        `duration ${duracao}, maxDuration ${teto}`,
      ).toThrow(/maxDuration .* precisa ser maior que duration/);
    }
    // O controle: um teto maior passa.
    expect(() => render(<Toast open message="x" onClose={vi.fn()} duration={5000} maxDuration={5001} />)).not.toThrow();
    erro.mockRestore();
  });

  it("a isca: sem a pausa, o tempo acabaria com o foco no Desfazer", async () => {
    // O mesmo roteiro do teste da pausa, com o ponteiro: se a pausa não
    // existisse, os 4s acabariam aqui. Esta é a prova de que a conta corre
    // quando ninguém está com o aviso.
    const fechou = vi.fn();
    render(<ComAviso aoFechar={fechou} duracao={4000} teto={60000} />);
    await usuario().click(screen.getByRole("button", { name: "Marcar feita" }));
    avancar(4100);
    expect(fechou).toHaveBeenCalledWith("timeout");
  });

  it("o tom de atenção tem ícone junto do texto, e não só a cor", () => {
    const { container } = render(
      <Toast open message="Não deu para trocar agora" tone="warn" onClose={vi.fn()} duration={5000} maxDuration={9000} />,
    );
    expect(container.querySelector(".co-toast__icon svg")).not.toBeNull();
  });

  it.each(TEMAS)("no tema %s, aberto e fechado passam no axe", async (tema) => {
    vi.useRealTimers();
    expect(
      await semViolacao(
        <>
          <Toast open={false} message="x" onClose={vi.fn()} duration={5000} maxDuration={9000} />
          <Toast
            open
            position="static"
            message="Guardada no espaço 2 do almoço"
            actionLabel="Desfazer"
            onAction={vi.fn()}
            onClose={vi.fn()}
            duration={5000}
            maxDuration={9000}
          />
        </>,
        tema,
      ),
    ).toEqual([]);
  });
});

// ------------------------------------------ o foco não fica atrás do aviso --

describe("o recuo da rolagem com o aviso aberto (WCAG 2.2, 2.4.11)", () => {
  const AVISO = ".co-toast[data-open=\"true\"]:not([data-position])";
  const TABS = '.co-screen[data-tabbar="true"]';
  const ACAO = '.co-screen[data-actionbar="true"] > .co-screen__actionbar :not(:empty)';
  const AMBAS = '.co-screen[data-tabbar="true"][data-actionbar="true"] > .co-screen__actionbar :not(:empty)';
  // Cada caso: o recuo do aviso aberto e o `bottom` do aviso fixo no MESMO caso.
  const CASOS = [
    ["sem barras", `:root:has(${AVISO})`, ".co-toast"],
    ["com as abas", `:root:has(${TABS}):has(${AVISO})`, `:root:has(${TABS}) .co-toast:not([data-position])`],
    ["com a barra de ação", `:root:has(${ACAO}):has(${AVISO})`, `:root:has(${ACAO}) .co-toast:not([data-position])`],
    ["com as duas", `:root:has(${AMBAS}):has(${AVISO})`, `:root:has(${AMBAS}) .co-toast:not([data-position])`],
  ] as const;
  const valor = (seletor: string, propriedade: string) => Object.fromEntries(bloco(seletor))[propriedade] ?? "";

  it.each(CASOS)("%s: o recuo de baixo passa do topo do aviso, em toda área segura", (_caso, recuo, aviso) => {
    for (const baixo of [0, 34]) {
      const tela = aparelho(0, 0, baixo, 0);
      const base = avaliar(valor(aviso, "bottom"), tela);
      const reserva = avaliar("var(--co-toast-reserve)", tela);
      const padding = avaliar(valor(recuo, "scroll-padding-bottom"), tela);
      // A reserva comporta o aviso de três linhas (borda, respiro, 3 × 25,5 de corpo): mais de 90 px.
      expect(reserva, "reserva do aviso").toBeGreaterThan(90);
      // O recuo cobre onde o aviso começa (o `bottom` dele) e a altura dele, com um respiro por cima.
      expect(padding, `${recuo} com a área ${baixo}px`).toBeGreaterThanOrEqual(base + reserva);
    }
  });

  it("o aviso aberto SOMA ao recuo das barras, e não o troca: o recuo com barra passa do recuo da barra sozinha", () => {
    const tela = aparelho(0, 0, 0, 0);
    const barras = [
      [`:root:has(${TABS})`, CASOS[1][1]],
      [`:root:has(${ACAO})`, CASOS[2][1]],
      [`:root:has(${AMBAS})`, CASOS[3][1]],
    ] as const;
    for (const [sem, com] of barras) {
      expect(avaliar(valor(com, "scroll-padding-bottom"), tela), com).toBeGreaterThan(
        // O recuo da barra já guarda 31px de repouso, que o aviso (a 8px da barra) aproveita:
        // o resto da altura reservada, mais de 60px, vem somado.
        avaliar(valor(sem, "scroll-padding-bottom"), tela) + 60,
      );
    }
  });

  it("a condição de cada caso pesa mais na cascata que a do caso de que ele parte (dois :has() contra um)", () => {
    // `:root:has(A):has(B)` vale mais que `:root:has(B)` e que `:root:has(A)`:
    // com as duas condições, o caso composto é o que vale, em vez de o aviso
    // sozinho (que ignoraria a barra) ou a barra sozinha (que ignoraria o aviso).
    const doisHas = CASOS.slice(1).map(([, recuo]) => (recuo.match(/:has\(/g) ?? []).length);
    expect(doisHas).toEqual([2, 2, 2]);
    expect((CASOS[0][1].match(/:has\(/g) ?? []).length).toBe(1);
  });

  it("o aviso estático (nas histórias e dentro de outra peça) não mexe no recuo da janela", () => {
    for (const [, recuo] of CASOS) expect(recuo).toContain(":not([data-position])");
  });
});

// -------------------------------------------------------------- esqueleto --

describe("Skeleton", () => {
  it("é um estado pronto: anuncia o rótulo uma vez, e as peças saem aria-hidden", () => {
    const { container } = render(<Skeleton label="Carregando receitas" count={3} />);
    // O rótulo entra depois da montagem (o `render` já corre os efeitos), na
    // região que nasceu vazia.
    expect(screen.getByRole("status")).toHaveTextContent("Carregando receitas");
    const pecas = container.querySelectorAll(".co-skeleton__item");
    expect(pecas).toHaveLength(3);
    for (const peca of pecas) expect(peca).toHaveAttribute("aria-hidden", "true");
  });

  it("com o prato: o cartão carregando tem o prato mini, com as colunas vazias", () => {
    const { container } = render(<Skeleton label="Carregando" />);
    const prato = container.querySelector('.co-plate__art[data-skeleton="true"]');
    expect(prato).not.toBeNull();
    expect(prato?.querySelectorAll(".co-plate__cell[data-group]")).toHaveLength(0);
    expect(prato?.querySelectorAll(".co-plate__cell")).toHaveLength(37);
  });

  it("o pulso é de opacidade e acaba: seis meias-voltas de 700ms, abaixo dos 5s do WCAG 2.2.2", () => {
    const animacao = Object.fromEntries(bloco(".co-skeleton__item"))["animation"] ?? "";
    expect(animacao).toBe("co-skeleton-pulso var(--co-duration-roll) var(--co-ease-move) 6 alternate");
    expect(animacao).not.toContain("infinite");
    expect(6 * 700).toBeLessThan(5000);
  });

  it("com prefers-reduced-motion, fica parado; o prato e o aviso esmaecem", () => {
    const reduzido = dentroDe("@media (prefers-reduced-motion: reduce)");
    expect(reduzido.find((r) => lugar(r) === "@ .co-root .co-skeleton__item")?.declaracoes).toEqual([
      ["animation-name", "none !important"],
    ]);
    const esmaece = reduzido.find((r) => r.seletores.includes(".co-root .co-plate__cell"));
    expect(esmaece?.seletores).toContain('.co-root .co-toast[data-open="true"]');
    expect(Object.fromEntries(esmaece?.declaracoes ?? [])).toMatchObject({
      "animation-name": "co-esmaecer !important",
      "animation-delay": "0s !important",
    });
  });

  it.each(TEMAS)("no tema %s, as três formas passam no axe", async (tema) => {
    expect(
      await semViolacao(
        <>
          <Skeleton label="Carregando receitas" count={3} />
          <Skeleton label="Carregando a receita" shape="plate" />
          <Skeleton label="Carregando o modo de preparo" shape="line" count={2} />
        </>,
        tema,
      ),
    ).toEqual([]);
  });
});

it("nenhuma regra nova das peças tem letra própria: a letra vem das variantes do Text", () => {
  const novas = REGRAS.filter((r) => /co-(plate|recipe-card|toast|skeleton)/.test(lugar(r)));
  expect(novas.length).toBeGreaterThan(10);
  expect(novas.filter((r) => r.declaracoes.some(([p]) => p === "font-size"))).toEqual([]);
});
