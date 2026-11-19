/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import folha from "./styles.css?raw";
import { bloco, dentroDe, lugar, REGRAS, type Regra } from "./test/folha";
import tokensCss from "./tokens/tokens.css?raw";

/**
 * A forma e o movimento do "Relógio de Sol" (design/identidade.md, ADR-022).
 *
 * - FORMA: o raio é do papel (controle 14, cartão 22, folha 28 em cima,
 *   diálogo 24, chip e segmentado em pílula), o limite de controle tem 1,5px, e
 *   a sombra fica só no que flutua.
 * - MOVIMENTO: "a pedra assenta, o sol desliza". Os tempos e as curvas da
 *   identidade, a resposta ao toque abaixo dos 100ms, só `transform` e
 *   `opacity` animados (mais as travas de toque, que não movem nada), e
 *   `prefers-reduced-motion` respeitado.
 */

const TOKENS = Object.fromEntries(
  [...tokensCss.matchAll(/(--co-[\w-]+)\s*:\s*([^;]+);/g)].map((achado) => [achado[1] ?? "", (achado[2] ?? "").trim()]),
);

describe("a forma", () => {
  it("os raios por papel são os da identidade", () => {
    expect({
      control: TOKENS["--co-radius-control"],
      container: TOKENS["--co-radius-container"],
      sheet: TOKENS["--co-radius-sheet"],
      dialog: TOKENS["--co-radius-dialog"],
      pill: TOKENS["--co-radius-pill"],
      content: TOKENS["--co-radius-content"],
      inset: TOKENS["--co-radius-inset"],
    }).toEqual({
      control: "14px",
      container: "22px",
      sheet: "28px",
      dialog: "24px",
      pill: "999px",
      content: "0",
      // 14 por fora, 1,5 de limite e 2 de respiro: o canto de dentro corre
      // paralelo ao de fora (ADR-004).
      inset: "10.5px",
    });
  });

  it("cada peça usa o raio do papel dela", () => {
    // O último bloco do nível de cima com o seletor (o grupo tem dois: o
    // contêiner e o recuo do fio).
    const raio = (seletor: string) =>
      REGRAS.filter((r) => r.profundidade === 0 && r.seletores.length === 1 && r.seletores[0] === seletor)
        .flatMap((r) => r.declaracoes)
        .filter(([p]) => p === "border-radius")
        .map(([, v]) => v)
        .at(-1);
    expect(raio(".co-button")).toBe("var(--co-radius-control)");
    expect(raio(".co-input")).toBe("var(--co-radius-control)");
    expect(raio(".co-search")).toBe("var(--co-radius-control)");
    expect(raio(".co-group")).toBe("var(--co-radius-container)");
    expect(raio(".co-surface")).toBe("var(--co-radius-container)");
    expect(raio(".co-notice")).toBe("var(--co-radius-container)");
    expect(raio(".co-chip")).toBe("var(--co-radius-pill)");
    expect(raio(".co-segmented")).toBe("var(--co-radius-pill)");
    expect(raio(".co-segmented__option")).toBe("var(--co-radius-pill)");
    // A folha arredonda só em cima, com o raio dela; a de dentro do cartão
    // (`inline`) é cartão.
    expect(raio(".co-sheet")).toBe(
      "var(--co-radius-sheet) var(--co-radius-sheet) var(--co-radius-content) var(--co-radius-content)",
    );
    expect(raio('.co-sheet[data-mode="inline"]')).toBe("var(--co-radius-container)");
  });

  it("o limite de controle tem 1,5px, e a fissura continua com 1px", () => {
    expect(TOKENS["--co-control-width"]).toBe("1.5px");
    expect(TOKENS["--co-border-width"]).toBe("1px");
    expect(Object.fromEntries(bloco('.co-button[data-variant="secondary"]'))["border"]).toBe(
      "var(--co-control-width) solid var(--co-control)",
    );
  });

  /** Toda regra que pinta sombra (fora `none`). */
  const comSombra = (regras: readonly Regra[]) =>
    regras
      .filter((regra) => regra.declaracoes.some(([p, v]) => p === "box-shadow" && v !== "none"))
      .map((regra) => [lugar(regra), Object.fromEntries(regra.declaracoes)["box-shadow"]]);

  it("a sombra fica só no que flutua: a folha, e o degrau curto do destino atual do trilho", () => {
    expect(comSombra(REGRAS)).toEqual([
      [".co-sheet", "var(--co-shadow-float)"],
      ['.co-rail__item[aria-current="page"]', "var(--co-shadow-lift)"],
    ]);
  });

  it("a isca: um cartão com sombra reprova", () => {
    const cartao: Regra = { profundidade: 0, seletores: [".co-group"], declaracoes: [["box-shadow", "var(--co-shadow-float)"]] };
    expect(comSombra([...REGRAS, cartao])).toContainEqual([".co-group", "var(--co-shadow-float)"]);
    expect(comSombra([...REGRAS, cartao])).toHaveLength(3);
  });

  it("nada de barra colorida na lateral: nenhum border-left nem border-right de cor", () => {
    const laterais = REGRAS.flatMap((regra) =>
      regra.declaracoes
        .filter(([p]) => /^border-(left|right)(-color)?$/.test(p))
        .map(([p, v]) => `${lugar(regra)} { ${p}: ${v} }`),
    );
    // O trilho separa o conteúdo pela fissura, e só ela.
    expect(laterais).toEqual([".co-rail { border-right: var(--co-border-width) solid var(--co-line) }"]);
  });
});

describe("o movimento", () => {
  it("os tempos e as curvas são os da identidade, e o toque responde abaixo dos 100ms", () => {
    expect({
      press: TOKENS["--co-duration-press"],
      quick: TOKENS["--co-duration-quick"],
      base: TOKENS["--co-duration-base"],
      slow: TOKENS["--co-duration-slow"],
      roll: TOKENS["--co-duration-roll"],
      settle: TOKENS["--co-ease-settle"],
      spring: TOKENS["--co-ease-spring"],
      move: TOKENS["--co-ease-move"],
      exit: TOKENS["--co-ease-exit"],
    }).toEqual({
      press: "90ms",
      quick: "160ms",
      base: "260ms",
      slow: "420ms",
      roll: "700ms",
      settle: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      spring: "cubic-bezier(0.34, 1.45, 0.64, 1)",
      move: "cubic-bezier(0.65, 0, 0.35, 1)",
      exit: "cubic-bezier(0.4, 0, 1, 1)",
    });
    expect(Number.parseFloat(TOKENS["--co-duration-press"] ?? "")).toBeLessThan(100);
  });

  it("o botão assenta ao toque (0,97) no tempo do toque, e só quando está ligado", () => {
    expect(Object.fromEntries(bloco('.co-button:active:not(:disabled):not([aria-disabled="true"])'))).toEqual({
      transform: "scale(0.97)",
    });
    expect(Object.fromEntries(bloco(".co-button"))["transition"]).toContain(
      "transform var(--co-duration-press) var(--co-ease-settle)",
    );
  });

  it("nenhum tempo e nenhuma curva fora dos tokens: toda transição e animação lê --co-duration-* e --co-ease-*", () => {
    const soltas = REGRAS.flatMap((regra) =>
      regra.declaracoes
        .filter(([p]) => p === "transition" || p === "animation")
        .filter(([, v]) => !/^none$/.test(v))
        .filter(([, v]) =>
          v.split(/,(?![^(]*\))/).some((parte) => !/var\(--co-duration-[\w-]+\)/.test(parte) && !/\d+ms step-end/.test(parte)),
        )
        .map(([p, v]) => `${lugar(regra)} { ${p}: ${v} }`),
    );
    expect(soltas).toEqual([]);
  });

  /** As propriedades que cada `@keyframes` da folha anima. */
  function animadas(css: string): string[] {
    const semComentario = css.replace(/\/\*[\s\S]*?\*\//g, "");
    return [...semComentario.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)].flatMap((achado) =>
      [...(achado[2] ?? "").matchAll(/([\w-]+)\s*:/g)].map((p) => `${achado[1]}: ${p[1]}`),
    );
  }

  it("as animações só mexem em transform e opacity, fora as travas de toque, que não movem nada", () => {
    const permitidas = /: (transform|opacity|pointer-events|--co-sheet-pointer-events)$/;
    const todas = animadas(folha);
    expect(todas.length).toBeGreaterThan(0);
    expect(todas.filter((p) => !permitidas.test(p))).toEqual([]);
  });

  it("a isca: uma animação de largura reprova", () => {
    const isca = "@keyframes co-cresce { from { width: 0; } to { width: 100%; } }";
    expect(animadas(isca)).toEqual(["co-cresce: width", "co-cresce: width"]);
  });

  it("com prefers-reduced-motion, a transição e a animação viram corte, e o botão não escala", () => {
    const reduzido = dentroDe("@media (prefers-reduced-motion: reduce)");
    const geral = reduzido.find((regra) => regra.seletores.includes(".co-root *"));
    expect(Object.fromEntries(geral?.declaracoes ?? [])).toEqual({
      "transition-duration": "0.01ms !important",
      "animation-duration": "0.01ms !important",
    });
    expect(reduzido.find((regra) => regra.seletores.includes(".co-root .co-button:active"))?.declaracoes).toEqual([
      ["transform", "none"],
    ]);
  });
});
