/// <reference types="vite/client" />
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useRef, useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLATE_CELLS, Plate, plateCounts, plateDividers, plateFill, type PlateGroup, type PlateSlice } from "./molecules/Plate";
import { PLATE_PATTERN } from "./molecules/plate-pattern";
import { RecipeCard } from "./molecules/RecipeCard";
import { Skeleton } from "./molecules/Skeleton";
import { Toast, type ToastCloseReason } from "./molecules/Toast";
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

  it("cada grupo tem o seu padrão, em SVG de marcação (nada de style): seis diferentes, e o mesmo na amostra da legenda", () => {
    const todos: PlateSlice[] = (Object.keys(PLATE_PATTERN) as PlateGroup[]).map((group) => ({
      group,
      fraction: 1 / 6,
      label: `${group} · 10 g`,
    }));
    const { container } = render(<Plate slices={todos} summary={RESUMO} />);
    // Seis grupos, seis padrões diferentes.
    expect(new Set(Object.values(PLATE_PATTERN)).size).toBe(6);
    const padroes = [...container.querySelectorAll("pattern")];
    expect(padroes).toHaveLength(6);
    const assinatura = (p: Element) =>
      `${p.getAttribute("patternTransform") ?? ""}|${p.getAttribute("width")}|${[...p.querySelectorAll(".co-plate__mark, .co-plate__dot")].map((m) => m.outerHTML).join("")}`;
    expect(new Set(padroes.map(assinatura)).size, "cada padrão desenha uma marca diferente").toBe(6);
    // Cada célula cheia pinta com o padrão do grupo dela (o fundo é a cor do papel e as marcas, a tinta escura).
    for (const group of Object.keys(PLATE_PATTERN) as PlateGroup[]) {
      const celula = container.querySelector(`.co-plate__cell[data-group="${group}"]`) as SVGElement;
      const alvo = /^url\(#(.+)\)$/.exec(celula.getAttribute("fill") ?? "")?.[1];
      const padrao = alvo ? container.querySelector(`pattern[id="${alvo}"]`) : null;
      expect(padrao, `padrão da célula de ${group}`).not.toBeNull();
      expect(padrao?.querySelector(".co-plate__ground")?.getAttribute("data-group")).toBe(group);
      expect(celula.getAttribute("data-pattern")).toBe(PLATE_PATTERN[group]);
    }
    // A amostra da legenda tem o MESMO padrão do setor, e a folha o desenha, um diferente por padrão.
    const amostras = [...container.querySelectorAll(".co-legend__swatch")];
    expect(amostras.map((a) => a.getAttribute("data-pattern"))).toEqual(
      (Object.keys(PLATE_PATTERN) as PlateGroup[]).map((g) => PLATE_PATTERN[g]),
    );
    const imagens = Object.values(PLATE_PATTERN).map((nome) => {
      const imagem = Object.fromEntries(bloco(`.co-legend__swatch[data-pattern="${nome}"]`))["background-image"];
      expect(imagem, `a amostra do padrão ${nome}`).toMatch(/gradient\(/);
      return imagem;
    });
    expect(new Set(imagens).size).toBe(6);
    // Nada de estilo injetado: nem no SVG, nem na amostra.
    expect(container.querySelectorAll("[style]")).toHaveLength(0);
  });

  it("onde o grupo muda há um separador de setor, em toda ordem dos seis grupos e com grupo faltando", () => {
    // A adjacência vem das COORDENADAS das células (vizinha é a que está a
    // 3^½ do raio), e não da lista que o componente usa.
    const alcance = Math.sqrt(3) * 10 * 1.01;
    const vizinhas: [number, number][] = [];
    for (let a = 0; a < PLATE_CELLS.length; a++) {
      for (let b = a + 1; b < PLATE_CELLS.length; b++) {
        const [ca, cb] = [PLATE_CELLS[a], PLATE_CELLS[b]];
        if (ca && cb && Math.hypot(ca.x - cb.x, ca.y - cb.y) <= alcance) vizinhas.push([a, b]);
      }
    }
    // O prato de 37 células tem 90 pares vizinhos (3·(3n²+3n+1)... = 90 para n=3).
    expect(vizinhas).toHaveLength(90);
    const grupos = Object.keys(PLATE_PATTERN) as PlateGroup[];
    const permutacoes = (lista: PlateGroup[]): PlateGroup[][] =>
      lista.length <= 1 ? [lista] : lista.flatMap((g, i) => permutacoes([...lista.slice(0, i), ...lista.slice(i + 1)]).map((r) => [g, ...r]));
    let conferidos = 0;
    for (const ordem of permutacoes(grupos)) {
      // Todos os seis, e a ordem sem o grupo da vez (grupo faltando muda quem toca quem).
      for (const faltando of [undefined, ...ordem.slice(0, 2)]) {
        const fatias = ordem.filter((g) => g !== faltando).map((group) => ({ group, fraction: 1 / 6, label: group }));
        const preenchido = plateFill(fatias);
        const esperado = vizinhas
          .filter(([a, b]) => preenchido[a] !== undefined && preenchido[b] !== undefined && preenchido[a] !== preenchido[b])
          .map(([a, b]) => `${a}-${b}`)
          .sort();
        const dado = plateDividers(preenchido).map(({ a, b }) => `${Math.min(a, b)}-${Math.max(a, b)}`).sort();
        expect(dado, `ordem ${ordem.join(",")} sem ${faltando ?? "nenhum"}`).toEqual(esperado);
        conferidos++;
      }
    }
    expect(conferidos).toBe(720 * 3);
  });

  it("o separador desenha uma aresta por par vizinho de grupos diferentes, em tinta escura, e o prato de um grupo só não tem nenhum", () => {
    const { container } = render(<Plate slices={ALMOCO} summary={RESUMO} />);
    const caminho = container.querySelector(".co-plate__divider");
    expect(caminho).not.toBeNull();
    const arestas = (caminho?.getAttribute("d") ?? "").split("M").filter(Boolean).length;
    expect(arestas).toBe(plateDividers(plateFill(ALMOCO)).length);
    expect(arestas).toBeGreaterThan(8);
    expect(Object.fromEntries(bloco(".co-plate__divider"))).toMatchObject({ stroke: "var(--co-role-mark)", fill: "none" });
    // E, por baixo dele, o contorno claro no escuro (token próprio): sem ele o traço some contra a fissura.
    const contorno = container.querySelector(".co-plate__divider-edge");
    expect(contorno?.getAttribute("d")).toBe(caminho?.getAttribute("d"));
    expect(contorno?.nextElementSibling).toBe(caminho);
    expect(Object.fromEntries(bloco(".co-plate__divider-edge"))).toMatchObject({ stroke: "var(--co-role-edge)", fill: "none" });
    const so = render(<Plate slices={[{ group: "veg", fraction: 0.5, label: "Brócolis · 80 g" }]} summary={RESUMO} />);
    expect(so.container.querySelector(".co-plate__divider")).toBeNull();
    expect(so.container.querySelector(".co-plate__divider-edge")).toBeNull();
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
  focoAoAbrir = false,
}: {
  aoFechar?: (motivo: ToastCloseReason) => void;
  aoDesfazer?: () => void;
  duracao?: number;
  teto?: number;
  comRetorno?: boolean;
  focoAoAbrir?: boolean;
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
        focusOnOpen={focoAoAbrir}
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

  it("o ponteiro em cima segura o teto como o foco: o aviso espera o ponteiro sair, e fecha com o motivo timeout", async () => {
    const fechou = vi.fn();
    const { container } = render(<ComAviso aoFechar={fechou} duracao={4000} teto={12000} />);
    await usuario().click(screen.getByRole("button", { name: "Marcar feita" }));
    const aviso = container.querySelector(".co-toast") as HTMLElement;
    fireEvent.pointerEnter(aviso);
    // Muito além do teto de 12 s, com o ponteiro parado em cima: o Desfazer fica.
    avancar(120000);
    expect(fechou).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeInTheDocument();
    fireEvent.pointerLeave(aviso);
    expect(fechou).toHaveBeenCalledWith("timeout");
  });

  it("no toque, tocar no aviso o segura (tempo e teto) até tocar fora; a caixa é focável por script e não entra no Tab", async () => {
    const fechou = vi.fn();
    const { container } = render(<ComAviso aoFechar={fechou} duracao={4000} teto={12000} />);
    await usuario().click(screen.getByRole("button", { name: "Marcar feita" }));
    const aviso = container.querySelector(".co-toast") as HTMLElement;
    expect(aviso).toHaveAttribute("tabindex", "-1");
    // O dedo na mensagem: o ponteiro de toque não tem "em cima" depois que levanta.
    fireEvent.pointerDown(aviso, { pointerType: "touch" });
    fireEvent.pointerLeave(aviso);
    avancar(120000);
    expect(fechou).not.toHaveBeenCalled();
    // Um toque fora solta o aviso: o teto já tinha passado, e ele fecha.
    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    expect(fechou).toHaveBeenCalledWith("timeout");
  });

  it("no toque, antes do teto, soltar o aviso volta a contar o tempo que faltava", async () => {
    const fechou = vi.fn();
    const { container } = render(<ComAviso aoFechar={fechou} duracao={4000} teto={60000} />);
    await usuario().click(screen.getByRole("button", { name: "Marcar feita" }));
    const aviso = container.querySelector(".co-toast") as HTMLElement;
    avancar(3000);
    fireEvent.pointerDown(aviso, { pointerType: "touch" });
    avancar(30000);
    expect(fechou).not.toHaveBeenCalled();
    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    avancar(900);
    expect(fechou).not.toHaveBeenCalled();
    avancar(200);
    expect(fechou).toHaveBeenCalledWith("timeout");
  });

  it("o clique na mensagem leva o foco à caixa, e o foco dentro segura o teto", async () => {
    const fechou = vi.fn();
    const eu = usuario();
    render(<ComAviso aoFechar={fechou} duracao={4000} teto={12000} />);
    const marcar = screen.getByRole("button", { name: "Marcar feita" });
    await eu.click(marcar);
    await eu.click(screen.getByText("Almoço marcado como feito"));
    const aviso = document.querySelector(".co-toast") as HTMLElement;
    expect(aviso).toHaveFocus();
    // O mouse que clicou fica em cima; só o foco segura daqui em diante.
    fireEvent.pointerLeave(aviso);
    avancar(120000);
    expect(fechou).not.toHaveBeenCalled();
    act(() => marcar.focus());
    expect(fechou).toHaveBeenCalledWith("timeout");
  });

  it("nenhum atalho global: Alt+N, nem a tecla morta do macOS que compõe o ã, mexe no foco ou no aviso", async () => {
    const desfez = vi.fn();
    const eu = usuario();
    render(
      <>
        <input aria-label="Alimento" />
        <ComAviso aoDesfazer={desfez} />
      </>,
    );
    const campo = screen.getByLabelText("Alimento");
    await eu.click(screen.getByRole("button", { name: "Marcar feita" }));
    campo.focus();
    // O Option+N do macOS (layout US) é a tecla morta do "ã": `key: "Dead"`, `code: "KeyN"`.
    const tecla = fireEvent.keyDown(campo, { key: "Dead", code: "KeyN", altKey: true });
    fireEvent.keyDown(document.body, { key: "n", code: "KeyN", altKey: true });
    expect(tecla, "a tecla não é consumida").toBe(true);
    expect(campo).toHaveFocus();
    await eu.keyboard(" ");
    expect(desfez).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeInTheDocument();
  });

  it("o anúncio não cita tecla: diz só a mensagem e que há uma ação", async () => {
    render(<ComAviso />);
    await usuario().click(screen.getByRole("button", { name: "Marcar feita" }));
    const regiao = screen.getByRole("status");
    expect(regiao).toHaveTextContent("Ação no aviso: Desfazer.");
    expect(regiao.textContent).not.toMatch(/alt|tecla|foco/i);
  });

  it("focusOnOpen: o foco vai à MENSAGEM do aviso (a caixa, com o nome dela), e não ao Desfazer; o foco não fica coberto", async () => {
    const eu = usuario();
    const { container } = render(<ComAviso focoAoAbrir />);
    await eu.click(screen.getByRole("button", { name: "Marcar feita" }));
    const aviso = container.querySelector(".co-toast") as HTMLElement;
    // A caixa é um grupo com o nome da mensagem (e da ação que há), para o leitor de tela.
    const grupo = screen.getByRole("group", { name: /Almoço marcado como feito/ });
    expect(grupo).toBe(aviso);
    expect(grupo).toHaveFocus();
    expect(screen.getByRole("button", { name: "Desfazer" })).not.toHaveFocus();
    // O foco está no próprio aviso, a camada fixa de cima: nada o cobre, e ela é a do z-index 30.
    expect(Object.fromEntries(bloco(".co-toast"))).toMatchObject({ position: "fixed", "z-index": "30" });
    expect(document.activeElement).toBe(aviso);
  });

  it("focusOnOpen: dois Enter seguidos não desfazem — o primeiro marca, o segundo cai na mensagem e não faz nada", async () => {
    const desfez = vi.fn();
    const fechou = vi.fn();
    const eu = usuario();
    render(<ComAviso focoAoAbrir aoDesfazer={desfez} aoFechar={fechou} />);
    await eu.click(screen.getByRole("button", { name: "Lista" }));
    await eu.tab();
    expect(screen.getByRole("button", { name: "Marcar feita" })).toHaveFocus();
    await eu.keyboard("{Enter}{Enter}");
    expect(desfez).not.toHaveBeenCalled();
    expect(fechou).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeInTheDocument();
  });

  it("focusOnOpen: o Enter segurado (repeat) não desfaz", async () => {
    const desfez = vi.fn();
    const eu = usuario();
    render(<ComAviso focoAoAbrir aoDesfazer={desfez} />);
    await eu.click(screen.getByRole("button", { name: "Lista" }));
    await eu.tab();
    // Três keydown com o Enter pressionado: o primeiro marca, os que repetem caem na mensagem.
    await eu.keyboard("{Enter>3/}");
    expect(desfez).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeInTheDocument();
  });

  it("focusOnOpen: Tab e depois Enter desfaz, e o foco volta ao elemento de origem", async () => {
    const desfez = vi.fn();
    const fechou = vi.fn();
    const eu = usuario();
    render(<ComAviso focoAoAbrir aoDesfazer={desfez} aoFechar={fechou} />);
    const marcar = screen.getByRole("button", { name: "Marcar feita" });
    await eu.click(marcar);
    await eu.tab();
    expect(screen.getByRole("button", { name: "Desfazer" })).toHaveFocus();
    await eu.keyboard("{Enter}");
    expect(desfez).toHaveBeenCalledTimes(1);
    expect(fechou).toHaveBeenCalledWith("action");
    expect(marcar).toHaveFocus();
  });

  it("focusOnOpen: o Esc devolve o foco ao elemento de origem, e a pausa do foco vale desde a abertura", async () => {
    const fechou = vi.fn();
    const eu = usuario();
    render(<ComAviso focoAoAbrir aoFechar={fechou} duracao={4000} teto={12000} />);
    const marcar = screen.getByRole("button", { name: "Marcar feita" });
    await eu.click(marcar);
    avancar(60000);
    expect(fechou).not.toHaveBeenCalled();
    await eu.keyboard("{Escape}");
    expect(fechou).toHaveBeenCalledWith("dismiss");
    expect(marcar).toHaveFocus();
  });

  it("sem focusOnOpen (o padrão), nada muda: o aviso não rouba o foco, nem o do teclado", async () => {
    const eu = usuario();
    const { container } = render(<ComAviso />);
    const marcar = screen.getByRole("button", { name: "Marcar feita" });
    await eu.click(marcar);
    expect(marcar).toHaveFocus();
    expect(container.querySelector(".co-toast")).not.toHaveFocus();
    // O Enter seguinte continua no gatilho, e o Desfazer é só uma parada do Tab.
    await eu.keyboard("{Enter}");
    expect(marcar).toHaveFocus();
    await eu.tab();
    expect(screen.getByRole("button", { name: "Desfazer" })).toHaveFocus();
  });

  it("um teto menor ou igual ao tempo não derruba a tela: avisa no console e usa 10 vezes o tempo", () => {
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const [duracao, teto] of [
      [5000, 5000],
      [5000, 4000],
      [5000, Number.NaN],
    ] as const) {
      aviso.mockClear();
      const fechou = vi.fn();
      const { container, unmount } = render(
        <Toast open message="x" actionLabel="Desfazer" onClose={fechou} duration={duracao} maxDuration={teto} position="static" />,
      );
      expect(aviso, `duration ${duracao}, maxDuration ${teto}`).toHaveBeenCalledTimes(1);
      expect(String(aviso.mock.calls[0]?.[0])).toMatch(/maxDuration .* maior que duration/);
      // O teto corrigido é 10 × duration: com o ponteiro em cima, o aviso passa dos 5 s e só o teto o espera.
      fireEvent.pointerEnter(container.querySelector(".co-toast") as HTMLElement);
      act(() => vi.advanceTimersByTime(duracao * 10 + 1000));
      expect(fechou).not.toHaveBeenCalled();
      fireEvent.pointerLeave(container.querySelector(".co-toast") as HTMLElement);
      expect(fechou).toHaveBeenCalledWith("timeout");
      unmount();
    }
    // O controle: um teto maior não avisa nada.
    aviso.mockClear();
    render(<Toast open message="x" onClose={vi.fn()} duration={5000} maxDuration={5001} />);
    expect(aviso).not.toHaveBeenCalled();
    aviso.mockRestore();
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

  it.each(CASOS)("%s: sobra espaço embaixo do conteúdo para a última linha subir acima do aviso, e não só o recuo", (_caso, recuo, _aviso) => {
    // O `scroll-padding` só vale para quem ainda tem para onde rolar: a última
    // linha da página já está no fim, e o aviso fixo a cobria (92% a 390px).
    // Enquanto o aviso está aberto, a janela ganha espaço embaixo: o da tela
    // (a reserva das barras, igual ao recuo de baixo sem aviso) MAIS este
    // `padding-bottom` tem de passar do recuo com o aviso, que é onde ele termina.
    const barras: Record<string, string> = {
      "sem barras": ":root",
      "com as abas": `:root:has(${TABS})`,
      "com a barra de ação": `:root:has(${ACAO})`,
      "com as duas": `:root:has(${AMBAS})`,
    };
    for (const baixo of [0, 34]) {
      const tela = aparelho(0, 0, baixo, 0);
      const fim = avaliar(valor(recuo, "scroll-padding-bottom"), tela);
      const extra = avaliar(valor(recuo, "padding-bottom"), tela);
      const reservaDasBarras = avaliar(valor(barras[_caso] ?? ":root", "scroll-padding-bottom"), tela);
      expect(reservaDasBarras + extra, `${_caso}, área ${baixo}px`).toBeGreaterThanOrEqual(fim);
      expect(extra, `${_caso}: o espaço extra é positivo`).toBeGreaterThan(0);
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

  it("o esqueleto do cartão tem a altura do cartão real, com um osso para o resumo, e o do prato não se confunde com um prato vazio", () => {
    const { container } = render(<Skeleton label="Carregando" />);
    expect(container.querySelector('.co-skeleton__bone[data-bone="summary"]')).not.toBeNull();
    expect(Object.fromEntries(bloco('.co-skeleton[data-shape="recipe-card"] .co-skeleton__item'))["min-height"]).toBe("10rem");
    // Sem o contorno de controle: parado, ele não vira um prato vazio de verdade ("Falta 100%").
    expect(Object.fromEntries(bloco('.co-plate__art[data-skeleton="true"] .co-plate__cell:not([data-group])'))["stroke"]).toBe("none");
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
