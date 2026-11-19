import { describe, expect, it } from "vitest";
import { readToken, semanticTokens } from "./tokens";

describe("readToken", () => {
  it("lê o valor que estiver no elemento", () => {
    document.documentElement.style.setProperty("--co-focus", "#1957c9");
    expect(readToken("focus")).toBe("#1957c9");
    document.documentElement.style.removeProperty("--co-focus");
  });

  it("lê do elemento pedido, e não sempre da raiz", () => {
    // Com tema por subárvore — ou com a hora de uma refeição escrita num
    // bloco —, o valor do painel e o da página são diferentes ao mesmo tempo.
    const painel = document.createElement("div");
    painel.style.setProperty("--co-hora-ink", "oklch(0.46 0.14 75)");
    document.body.appendChild(painel);

    expect(readToken("hora-ink", painel)).toBe("oklch(0.46 0.14 75)");

    painel.remove();
  });

  it("token ausente devolve vazio, e não uma cor de mentira", () => {
    expect(readToken("bad-soft")).toBe("");
  });

  it("a lista de tokens semânticos não tem repetido", () => {
    expect(new Set(semanticTokens).size).toBe(semanticTokens.length);
  });
});
