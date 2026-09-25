import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * O piso de contraste do sistema, conferido na FONTE dos tokens.
 *
 * A ADR-005 diz que `--co-text-subtle` é o texto menos contrastado que o
 * sistema admite e que `--co-icon-muted` é para desenho, nunca para texto.
 * Sem este arquivo isso é uma frase num documento: alguém escurece uma
 * primitiva por motivo estético, o CSS continua válido, o TypeScript continua
 * compilando, e o defeito só aparece para quem não consegue ler a tela.
 *
 * A conta é a do WCAG 2.2 (luminância relativa e razão de contraste), aplicada
 * ao valor JÁ RESOLVIDO de cada token semântico nos dois temas.
 */

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

type Folha = Record<string, unknown>;

function ler(arquivo: string): Folha {
  return JSON.parse(readFileSync(resolve(raiz, "tokens", arquivo), "utf8")) as Folha;
}

const primitivas = ler("cor.json");
const claro = (ler("semantico.claro.json")["claro"] ?? {}) as Folha;
const escuro = (ler("semantico.escuro.json")["escuro"] ?? {}) as Folha;

/** Resolve `{basalt-050}` até o valor cru. */
function valor(token: unknown): string {
  const cru = (token as { $value?: string } | undefined)?.$value;
  if (cru === undefined) throw new Error("token sem $value");
  const referencia = /^\{(.+)\}$/.exec(cru);
  if (!referencia?.[1]) return cru;
  return valor(primitivas[referencia[1]]);
}

function canal(oitoBits: number): number {
  const c = oitoBits / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string): number {
  const casado = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!casado?.[1]) throw new Error(`esperava #rrggbb, veio ${hex}`);
  const n = Number.parseInt(casado[1], 16);
  return (
    0.2126 * canal((n >> 16) & 255) +
    0.7152 * canal((n >> 8) & 255) +
    0.0722 * canal(n & 255)
  );
}

function contraste(frente: string, fundo: string): number {
  const a = luminancia(frente);
  const b = luminancia(fundo);
  const [claro_, escuro_] = a > b ? [a, b] : [b, a];
  return (claro_ + 0.05) / (escuro_ + 0.05);
}

/** Texto comum: 4,5:1. Desenho (ícone, barra, ponto): 3:1. */
const PISO_TEXTO = 4.5;
const PISO_DESENHO = 3;

const TEXTO = ["text", "text-body", "text-secondary", "text-muted", "text-subtle"] as const;
const TEXTO_COLORIDO = ["accent", "status", "danger"] as const;
const DESENHO = ["icon-muted", "macro-protein", "macro-carb", "macro-fat"] as const;

const TEMAS: [string, Folha][] = [
  ["claro", claro],
  ["escuro", escuro],
];

describe.each(TEMAS)("contraste no tema %s", (_nome, tema) => {
  // Todo fundo em que texto de verdade aparece. O caso difícil é o fundo mais
  // claro no tema escuro e o mais escuro no claro — e qual é qual muda quando
  // a paleta muda, por isso a lista inteira, e não o "pior" escolhido a olho.
  //
  // `surface-sunken` entrou na lista quando o `Rail` e o `Sheet` em modo
  // `inline` passaram a usá-lo como fundo de TEXTO — antes ele só segurava
  // trilho de barra, onde o piso é o de desenho. Um fundo novo que recebe texto
  // e não entra aqui é um fundo cujo contraste ninguém confere.
  //
  // `surface-raised` é o fundo da linha escolhida do `ListRow` e do
  // `Surface elevation="raised"` — texto de verdade, e no tema escuro o fundo
  // MAIS CLARO de todos, ou seja, o caso difícil de fato. Ficou de fora até a
  // história `Escolha` mostrar a legenda sutil da linha marcada a 4,43:1.
  const fundos = [
    ["canvas", valor(tema["canvas"])],
    ["surface", valor(tema["surface"])],
    ["surface-raised", valor(tema["surface-raised"])],
    ["surface-sunken", valor(tema["surface-sunken"])],
  ] as const;

  it.each(TEXTO)("%s passa em 4,5:1 em todo fundo de texto", (token) => {
    for (const [nomeFundo, fundo] of fundos) {
      const razao = contraste(valor(tema[token]), fundo);
      expect(razao, `${token} sobre ${nomeFundo} deu ${razao.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        PISO_TEXTO,
      );
    }
  });

  it.each(TEXTO_COLORIDO)("%s passa em 4,5:1, porque também é texto", (token) => {
    for (const [nomeFundo, fundo] of fundos) {
      const razao = contraste(valor(tema[token]), fundo);
      expect(razao, `${token} sobre ${nomeFundo} deu ${razao.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        PISO_TEXTO,
      );
    }
  });

  it.each(DESENHO)("%s passa em 3:1, que é o piso de desenho", (token) => {
    for (const [nomeFundo, fundo] of fundos) {
      const razao = contraste(valor(tema[token]), fundo);
      expect(razao, `${token} sobre ${nomeFundo} deu ${razao.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        PISO_DESENHO,
      );
    }
  });

  it("o rótulo do botão primário lê sobre o acento", () => {
    // `accent-contrast` existe só para isto, e é o par que quebra primeiro
    // quando alguém clareia o acento para ele "aparecer mais".
    const razao = contraste(valor(tema["accent-contrast"]), valor(tema["accent"]));
    expect(razao, `deu ${razao.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_TEXTO);
  });

  it("o chip escolhido lê sobre o acento suave", () => {
    // `accent-soft` é fundo de texto em dois lugares: o chip escolhido e o
    // aviso. É o par que quebra quando alguém satura o acento suave para ele
    // "aparecer mais".
    const razao = contraste(valor(tema["text"]), valor(tema["accent-soft"]));
    expect(razao, `deu ${razao.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_TEXTO);
  });

  it("o ícone ligado do botão-ícone se vê sobre o acento suave", () => {
    // `IconButton pressed` pinta o traço de acento sobre `accent-soft`. É
    // desenho, então o piso é 3:1 — e é o par que some quando alguém aproxima
    // o acento suave do acento para o fundo "combinar".
    const razao = contraste(valor(tema["accent"]), valor(tema["accent-soft"]));
    expect(razao, `deu ${razao.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_DESENHO);
  });

  it("text-subtle é o piso, e icon-muted fica abaixo dele", () => {
    // A hierarquia importa: se `icon-muted` subisse acima de `text-subtle`,
    // os dois papéis colapsariam e a regra "isto não é para texto" perderia
    // o sentido.
    const fundo = valor(tema["surface"]);
    expect(contraste(valor(tema["icon-muted"]), fundo)).toBeLessThan(
      contraste(valor(tema["text-subtle"]), fundo),
    );
  });
});
