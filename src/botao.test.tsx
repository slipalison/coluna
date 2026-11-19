/// <reference types="vite/client" />
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "./atoms/Button";
import { IconButton } from "./atoms/IconButton";
import "./styles.css";
import { avaliar, dentroDe, REGRAS, type Regra, type Valores } from "./test/folha";
import tokensCss from "./tokens/tokens.css?raw";

/**
 * A altura do botão por aparelho (plano s7, ADR-022): no toque, o comum tem
 * 44px e o principal 50px; com ponteiro fino, o desktop, 40 e 46px. O
 * botão-ícone acompanha, para os dois ficarem da mesma altura lado a lado.
 *
 * Duas provas, como no Basalto: um "projeto" de toque e um de ponteiro.
 *
 * - NA FOLHA, a conta: o bloco do nível de cima é o do toque, e o
 *   `@media (pointer: fine)` troca a altura — e só a do botão e a do
 *   botão-ícone.
 * - NO ESTILO COMPUTADO, os dois aparelhos. O happy-dom responde ao
 *   `(pointer: coarse)` e ao `(pointer: fine)` pelo `navigator.maxTouchPoints`
 *   (zero é ponteiro fino), e o teste troca esse número para montar cada um.
 *   A medida em pixel no navegador de verdade (o Chromium com toque e sem
 *   toque) está no ADR-022.
 */

const TOKENS: Valores = Object.fromEntries(
  [...tokensCss.matchAll(/(--co-[\w-]+)\s*:\s*([^;]+);/g)].reverse().map((achado) => [achado[1] ?? "", (achado[2] ?? "").trim()]),
);

/** A medida de uma propriedade num seletor, num conjunto de regras (a última vence). */
function medida(regras: readonly Regra[], seletor: string, propriedade: string): number | undefined {
  const valor = regras
    .filter((regra) => regra.seletores.length === 1 && regra.seletores[0] === seletor)
    .flatMap((regra) => regra.declaracoes)
    .filter(([p]) => p === propriedade)
    .at(-1)?.[1];
  return valor === undefined ? undefined : avaliar(valor, TOKENS);
}

const topo = REGRAS.filter((regra) => regra.profundidade === 0);

/** As alturas dos quatro, num conjunto de regras. */
function alturas(regras: readonly Regra[]) {
  return {
    comum: medida(regras, ".co-button", "min-height"),
    principal: medida(regras, '.co-button[data-size="lg"]', "min-height"),
    icone: medida(regras, ".co-icon-button", "height"),
    iconeGrande: medida(regras, '.co-icon-button[data-size="lg"]', "height"),
  };
}

describe("a altura do botão, na folha", () => {
  it("no toque (o nível de cima), 44 e 50px; o botão-ícone, quadrado, igual", () => {
    expect(alturas(topo)).toEqual({ comum: 44, principal: 50, icone: 44, iconeGrande: 50 });
    expect(medida(topo, ".co-icon-button", "width")).toBe(44);
    expect(medida(topo, '.co-icon-button[data-size="lg"]', "width")).toBe(50);
  });

  it("com ponteiro fino, 40 e 46px, e só o botão, o botão-ícone e o título mudam ali", () => {
    const fino = dentroDe("@media (pointer: fine)");
    expect(alturas(fino)).toEqual({ comum: 40, principal: 46, icone: 40, iconeGrande: 46 });
    expect(fino.map((regra) => regra.seletores.join(", "))).toEqual([
      '.co-text[data-variant="title-lg"]',
      ".co-button",
      '.co-button[data-size="lg"]',
      ".co-icon-button",
      '.co-icon-button[data-size="lg"]',
    ]);
    // Acima dos 24px que o WCAG 2.5.8 pede com ponteiro.
    expect(Math.min(...Object.values(alturas(fino)).map(Number))).toBeGreaterThanOrEqual(24);
  });

  it("a isca: o principal de volta aos 52px e o comum a 32px reprovam pela conta", () => {
    const isca: Regra[] = [
      ...topo,
      { profundidade: 0, seletores: ['.co-button[data-size="lg"]'], declaracoes: [["min-height", "52px"]] },
      { profundidade: 0, seletores: [".co-button"], declaracoes: [["min-height", "32px"]] },
    ];
    expect(alturas(isca)).not.toEqual({ comum: 44, principal: 50, icone: 44, iconeGrande: 50 });
    expect(alturas(isca).principal).toBe(52);
    expect(alturas(isca).comum).toBe(32);
  });
});

// ------------------------------------------------------- os dois aparelhos --

const original = Object.getOwnPropertyDescriptor(Navigator.prototype, "maxTouchPoints");

function aparelho(toques: number) {
  Object.defineProperty(window.navigator, "maxTouchPoints", { configurable: true, get: () => toques });
}

afterEach(() => {
  delete (window.navigator as unknown as Record<string, unknown>)["maxTouchPoints"];
  if (original) Object.defineProperty(Navigator.prototype, "maxTouchPoints", original);
});

function medir() {
  const { getByRole, unmount } = render(
    <>
      <Button>Guardar</Button>
      <Button size="lg">Comer esta hoje</Button>
      <IconButton icon="close" label="Fechar" />
      <IconButton icon="close" label="Fechar grande" size="lg" />
    </>,
  );
  const px = (nome: string, propriedade: "minHeight" | "height") =>
    Number.parseFloat(getComputedStyle(getByRole("button", { name: nome }))[propriedade]);
  const resultado = {
    comum: px("Guardar", "minHeight"),
    principal: px("Comer esta hoje", "minHeight"),
    icone: px("Fechar", "height"),
    iconeGrande: px("Fechar grande", "height"),
  };
  unmount();
  return resultado;
}

describe("a altura do botão, no estilo computado de cada aparelho", () => {
  it("o projeto de toque (pointer: coarse) mede 44 e 50px", () => {
    aparelho(5);
    expect(medir()).toEqual({ comum: 44, principal: 50, icone: 44, iconeGrande: 50 });
  });

  it("o projeto de ponteiro (pointer: fine) mede 40 e 46px", () => {
    aparelho(0);
    expect(medir()).toEqual({ comum: 40, principal: 46, icone: 40, iconeGrande: 46 });
  });
});
