/// <reference types="vite/client" />
import { render } from "@testing-library/react";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { afterAll, describe, expect, it } from "vitest";
import { Text } from "./atoms/Text";
import { PageHeader } from "./molecules/PageHeader";
import { ScreenHeader } from "./molecules/ScreenHeader";
import { Stat } from "./molecules/Stat";
import "./styles.css";
import { lugar, REGRAS } from "./test/folha";

/**
 * As fontes moram no pacote (ADR-014).
 *
 * Os tokens nomeiam a Instrument Serif e a Archivo desde a 1.0, e o pacote não
 * trazia nenhuma das duas: quem consome via a Georgia e a Helvetica, e nenhum
 * teste reclamava, porque um nome de família que não existe é CSS válido. Este
 * arquivo prova duas coisas, cada uma com a isca que mostra que ele morde:
 *
 * - A FOLHA PUBLICADA traz o `@font-face` das duas famílias, e toda `url()`
 *   dela vale no aplicativo de quem consome: relativa, apontando para arquivo
 *   que o build pôs ao lado, e nenhuma para fora — a CSP do Basalto é
 *   `font-src 'self'`. A folha é a que `scripts/construir-css.mjs` monta, num
 *   diretório temporário: o mesmo script do `npm run build`, sem depender de
 *   um `dist/` de antes.
 * - A SERIFA FICA NO 400. A Instrument Serif só tem esse peso; o título sai
 *   num `<h1>`, que o navegador pinta em negrito, e sem o 400 escrito o
 *   navegador inventa o negrito engrossando o traço.
 */

const raizDoRepositorio = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ------------------------------------------------- a folha que se publica --

const saida = mkdtempSync(join(tmpdir(), "coluna-css-"));
execFileSync(process.execPath, [resolve(raizDoRepositorio, "scripts/construir-css.mjs"), "--destino", saida], {
  stdio: "ignore",
});
afterAll(() => rmSync(saida, { recursive: true, force: true }));

const publicada = readFileSync(join(saida, "styles.css"), "utf8");
const soTokens = readFileSync(join(saida, "tokens.css"), "utf8");

/** O arquivo que um caminho relativo da folha alcança, se ele não sair da saída. */
function alcancado(caminho: string): string | undefined {
  const absoluto = resolve(saida, caminho);
  return absoluto.startsWith(saida + sep) && existsSync(absoluto) ? absoluto : undefined;
}

const semComentario = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * Os alvos de toda `url(...)` fora de comentário, sem as aspas, na ordem da
 * folha. O comentário fica de fora porque o navegador não busca o que está
 * nele — e esta folha escreve `url()` nos comentários para explicar a regra.
 */
function alvos(css: string): string[] {
  return [...semComentario(css).matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/g)].map((achado) => achado[2] ?? "");
}

interface Face {
  family: string;
  style: string;
  weight: string;
  display: string;
  src: string[];
  unicodeRange: string;
}

/**
 * As declarações de um bloco, pelo nome. Cada valor vai até o `;` que fecha a
 * declaração, e não até o primeiro `;`: um `data:font/woff2;base64,...` tem
 * um dentro das aspas (ou dos parênteses, sem aspas).
 */
function declaracoes(corpo: string): Map<string, string> {
  const mapa = new Map<string, string>();
  let atual = "";
  let aspas = "";
  let nivel = 0;
  for (const caractere of `${corpo};`) {
    if (aspas) {
      if (caractere === aspas) aspas = "";
    } else if (caractere === '"' || caractere === "'") {
      aspas = caractere;
    } else if (caractere === "(" || caractere === ")") {
      nivel += caractere === "(" ? 1 : -1;
    } else if (caractere === ";" && nivel === 0) {
      const doisPontos = atual.indexOf(":");
      if (doisPontos > 0) mapa.set(atual.slice(0, doisPontos).trim(), atual.slice(doisPontos + 1).replace(/\s+/g, " ").trim());
      atual = "";
      continue;
    }
    atual += caractere;
  }
  return mapa;
}

/** Cada `@font-face` da folha, com os descritores que o teste lê. */
function faces(css: string): Face[] {
  return [...semComentario(css).matchAll(/@font-face\s*\{([^}]*)\}/g)].map((achado) => {
    const lidas = declaracoes(achado[1] ?? "");
    const descritor = (nome: string) => lidas.get(nome) ?? "";
    return {
      family: descritor("font-family").replace(/^["']|["']$/g, ""),
      style: descritor("font-style"),
      weight: descritor("font-weight"),
      display: descritor("font-display"),
      src: alvos(descritor("src")),
      unicodeRange: descritor("unicode-range"),
    };
  });
}

/**
 * Tudo o que impede a folha de valer no aplicativo de quem consome, um item
 * por defeito. Vazio é a folha boa.
 *
 * - Toda `url()` é `data:` (o grão da tela, um SVG) ou um caminho relativo
 *   que chega a um arquivo ao lado da folha. Um esquema (`https:`), uma URL
 *   sem esquema (`//`) ou um caminho absoluto (`/fonts/...`) não vale: o
 *   primeiro e o segundo a CSP recusa, e o terceiro depende de onde o
 *   consumidor serve os arquivos dele.
 * - A fonte nunca é `data:`: a CSP `font-src 'self'` recusa `data:` também.
 * - Nenhum `http://` nem `https://` no texto, fora do conteúdo de um `data:`
 *   (o SVG do grão declara o namespace `http://www.w3.org/2000/svg`, que é um
 *   nome, e não um endereço que o navegador busca).
 */
function problemas(css: string, existe: (caminho: string) => boolean): string[] {
  const achados: string[] = [];
  for (const alvo of alvos(css)) {
    if (/^data:/i.test(alvo)) continue;
    if (/^[a-z][a-z\d+.-]*:/i.test(alvo)) achados.push(`url de fora: ${alvo}`);
    else if (alvo.startsWith("//")) achados.push(`url de fora, sem esquema: ${alvo}`);
    else if (alvo.startsWith("/")) achados.push(`caminho absoluto: ${alvo}`);
    else if (!existe(alvo)) achados.push(`arquivo que não existe: ${alvo}`);
  }
  for (const face of faces(css)) {
    for (const alvo of face.src.filter((fonte) => /^data:/i.test(fonte))) {
      achados.push(`fonte em data: (${face.family}): ${alvo.slice(0, 40)}`);
    }
  }
  const semData = css.replace(/url\(\s*(["']?)data:.*?\1\s*\)/g, "url()");
  for (const achado of semData.matchAll(/https?:\/\/[^\s"')]+/gi)) {
    achados.push(`endereço http(s) na folha: ${achado[0]}`);
  }
  return achados;
}

const existeNaSaida = (caminho: string) => alcancado(caminho) !== undefined;

describe("a folha publicada", () => {
  it("traz o @font-face da Instrument Serif e da Archivo, normal, em latin e latin-ext", () => {
    const porFamilia = (familia: string) =>
      faces(publicada)
        .filter((face) => face.family === familia)
        .map((face) => ({ ...face, src: face.src.map((alvo) => alvo.replace(/^\.\/fonts\//, "")) }));

    // O 400 é o único peso da serifa; a Archivo é variável no `wght`, e um
    // arquivo por subconjunto cobre o 400, o 500 e o 600 dos tokens e o 700
    // que o navegador põe no `<strong>`.
    expect(porFamilia("Instrument Serif").map((f) => [f.style, f.weight, f.display, f.src])).toEqual([
      ["normal", "400", "swap", ["instrument-serif-latin-ext-400-normal.woff2"]],
      ["normal", "400", "swap", ["instrument-serif-latin-400-normal.woff2"]],
    ]);
    expect(porFamilia("Archivo").map((f) => [f.style, f.weight, f.display, f.src])).toEqual([
      ["normal", "100 900", "swap", ["archivo-latin-ext-wght-normal.woff2"]],
      ["normal", "100 900", "swap", ["archivo-latin-wght-normal.woff2"]],
    ]);
    expect(faces(publicada)).toHaveLength(4);

    // Cada subconjunto com a faixa dele: sem o `unicode-range`, o navegador
    // baixaria o `latin-ext` em toda página, e o `latin` deixaria de ser
    // escolhido para o que é dele.
    for (const face of faces(publicada)) {
      expect(face.unicodeRange, `${face.family} ${face.src.join()}`).toMatch(
        face.src.some((alvo) => alvo.includes("latin-ext")) ? /^U\+0100-02BA, / : /^U\+0000-00FF, /,
      );
    }
  });

  it("os nomes das famílias são os que os tokens pedem", () => {
    const familias = new Set(faces(publicada).map((face) => face.family));
    // O valor do token no `:root` dos tokens, a primeira declaração dele.
    const pedidas = (token: string) => {
      const inicio = publicada.indexOf(`${token}:`) + token.length + 1;
      return publicada
        .slice(inicio, publicada.indexOf(";", inicio))
        .split(",")
        .map((nome) => nome.trim().replace(/^"|"$/g, ""));
    };
    expect(pedidas("--co-font-display")[0]).toBe("Instrument Serif");
    expect(pedidas("--co-font-body")[0]).toBe("Archivo");
    expect([...familias].sort()).toEqual(["Archivo", "Instrument Serif"]);
  });

  it("toda url() é relativa e chega a um arquivo da saída; nenhuma vai para fora", () => {
    expect(problemas(publicada, existeNaSaida)).toEqual([]);
    expect(problemas(soTokens, existeNaSaida)).toEqual([]);
    // Não é uma folha sem url(): são as quatro fontes e o grão.
    expect(alvos(publicada).filter((alvo) => alvo.startsWith("./fonts/"))).toHaveLength(4);
  });

  it("a isca: o verificador reprova URL de fora, caminho absoluto, arquivo que falta e fonte em data:", () => {
    const face = (src: string) => `@font-face { font-family: "Archivo"; src: url(${src}) format("woff2"); }`;
    const existe = (caminho: string) => caminho === "./fonts/a.woff2";

    expect(problemas(face('"./fonts/a.woff2"'), existe)).toEqual([]);
    expect(problemas(face('"https://fonts.gstatic.com/s/archivo/a.woff2"'), existe)).toEqual([
      "url de fora: https://fonts.gstatic.com/s/archivo/a.woff2",
      "endereço http(s) na folha: https://fonts.gstatic.com/s/archivo/a.woff2",
    ]);
    expect(problemas(face("//fonts.gstatic.com/a.woff2"), existe)).toEqual([
      "url de fora, sem esquema: //fonts.gstatic.com/a.woff2",
    ]);
    expect(problemas(face("'/fonts/a.woff2'"), existe)).toEqual(["caminho absoluto: /fonts/a.woff2"]);
    expect(problemas(face('"./fonts/b.woff2"'), existe)).toEqual(["arquivo que não existe: ./fonts/b.woff2"]);
    expect(problemas(face('"data:font/woff2;base64,d09GMgABAAAA"'), existe)).toEqual([
      "fonte em data: (Archivo): data:font/woff2;base64,d09GMgABAAAA",
    ]);
    expect(
      problemas('@import url("https://fonts.googleapis.com/css2?family=Archivo");', existe),
    ).toEqual([
      "url de fora: https://fonts.googleapis.com/css2?family=Archivo",
      "endereço http(s) na folha: https://fonts.googleapis.com/css2?family=Archivo",
    ]);
    // O grão é `data:` com um namespace http dentro, e passa; o mesmo endereço
    // solto no texto, não.
    expect(problemas(`.g { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E"); }`, existe)).toEqual([]);
    expect(problemas("/* veja http://exemplo.com */", existe)).toEqual(["endereço http(s) na folha: http://exemplo.com"]);
  });

  it("nenhuma fonte cabe no limite de inline do Vite, e por isso nenhuma vira data:", () => {
    // O Vite troca por `data:` todo asset menor que `build.assetsInlineLimit`
    // (4096 bytes por padrão), e a CSP `font-src 'self'` recusa `data:`. Um
    // subconjunto pequeno demais sumiria da tela do Basalto sem erro no build.
    const tamanhos = alvos(publicada)
      .filter((alvo) => alvo.startsWith("./fonts/"))
      .map((alvo) => [alvo, statSync(alcancado(alvo) ?? "").size] as const);
    expect(tamanhos.filter(([, bytes]) => bytes < 4096)).toEqual([]);
    expect(tamanhos).toHaveLength(4);
  });

  it("a licença OFL de cada família vai ao lado das fontes", () => {
    for (const [arquivo, autoria] of [
      ["OFL-instrument-serif.txt", "Copyright 2022 The Instrument Serif Project Authors"],
      ["OFL-archivo.txt", "Copyright 2020 The Archivo Project Authors"],
    ] as const) {
      const licenca = readFileSync(join(saida, "fonts", arquivo), "utf8");
      expect(licenca, arquivo).toContain(autoria);
      expect(licenca, arquivo).toContain("SIL OPEN FONT LICENSE Version 1.1");
    }
  });
});

// ------------------------------------------------------ a serifa no 400 --

describe("a serifa fica no 400", () => {
  it("toda regra que lê --co-font-display escreve o peso 400", () => {
    const serifadas = REGRAS.filter((regra) =>
      regra.declaracoes.some(([propriedade, valor]) => propriedade === "font-family" && valor.includes("--co-font-display")),
    );
    expect(serifadas.map(lugar)).toEqual(['.co-text[data-variant="title-lg"]', '.co-text[data-variant="numeral"]']);
    for (const regra of serifadas) {
      expect(regra.declaracoes.filter(([propriedade]) => propriedade === "font-weight"), lugar(regra)).toEqual([
        ["font-weight", "400"],
      ]);
    }
  });

  /**
   * O happy-dom não tem a folha do navegador: lá o `<h1>` nasce no peso
   * normal, e um teste de peso passaria sem o conserto. Esta é a regra que o
   * Chrome, o Safari e o Firefox escrevem — `h1 { font-weight: bold }` —, e o
   * contêiner em 700 é o ancestral em negrito (um `<th>`, um `<strong>`) de
   * quem herda o peso.
   */
  function noNavegador(conteudo: ReactNode) {
    const folhaDoNavegador = document.createElement("style");
    folhaDoNavegador.textContent = "h1, h2, strong, b, th { font-weight: bold; } .negrito { font-weight: 700; }";
    document.head.append(folhaDoNavegador);
    const montado = render(<div className="negrito">{conteudo}</div>);
    return {
      peso: (texto: string) => getComputedStyle(montado.getByText(texto)).fontWeight,
      desmontar: () => {
        montado.unmount();
        folhaDoNavegador.remove();
      },
    };
  }

  it("o título do ScreenHeader, do PageHeader e o title-lg num h1, e o numeral, computam 400", () => {
    const tela = noNavegador(
      <>
        <ScreenHeader title="Hoje" />
        <PageHeader title="Receitas" as="h2" />
        <Text as="h1" variant="title-lg">
          Calculadora
        </Text>
        <Text as="strong" variant="numeral">
          995
        </Text>
        <Stat label="Restante" value="1.917" size="hero" />
      </>,
    );
    try {
      for (const texto of ["Hoje", "Receitas", "Calculadora", "995", "1.917"]) {
        expect(tela.peso(texto), texto).toBe("400");
      }
    } finally {
      tela.desmontar();
    }
  });

  it("a isca: a serifa sem o 400 sai em negrito no mesmo h1", () => {
    const isca = document.createElement("style");
    isca.textContent = ".isca-serifa { font-family: var(--co-font-display); }";
    document.head.append(isca);
    const tela = noNavegador(
      <>
        <h1 className="isca-serifa">Ajustes</h1>
        <span className="isca-serifa">2.371</span>
      </>,
    );
    try {
      expect(tela.peso("Ajustes")).not.toBe("400");
      expect(tela.peso("2.371")).not.toBe("400");
    } finally {
      tela.desmontar();
      isca.remove();
    }
  });
});
