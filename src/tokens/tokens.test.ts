import { describe, expect, it } from "vitest";
import { readToken, semanticTokens } from "./tokens";

describe("readToken", () => {
  it("lê o valor que estiver no elemento", () => {
    document.documentElement.style.setProperty("--co-accent", "#a882f5");
    expect(readToken("accent")).toBe("#a882f5");
    document.documentElement.style.removeProperty("--co-accent");
  });

  it("lê do elemento pedido, e não sempre da raiz", () => {
    // Com tema por subárvore, o acento do painel de pré-visualização e o da
    // página são cores diferentes ao mesmo tempo.
    const painel = document.createElement("div");
    painel.style.setProperty("--co-accent", "#6d3fd4");
    document.body.appendChild(painel);

    expect(readToken("accent", painel)).toBe("#6d3fd4");

    painel.remove();
  });

  it("token ausente devolve vazio, e não uma cor de mentira", () => {
    expect(readToken("danger-soft")).toBe("");
  });

  it("a lista de tokens semânticos não tem repetido", () => {
    expect(new Set(semanticTokens).size).toBe(semanticTokens.length);
  });
});
