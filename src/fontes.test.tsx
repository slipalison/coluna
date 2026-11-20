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
 * As fontes moram no pacote (ADR-014), e desde a 2.0 são as três do "Relógio
 * de Sol" (ADR-023): Bricolage Grotesque, Figtree e Sofia Sans Extra Condensed.
 *
 * Um nome de família que não existe é CSS válido, e nada reclama quando a
 * fonte não chega: quem consome vê a fonte do sistema. Este arquivo prova duas
 * coisas, cada uma com a isca que mostra que ele morde:
 *
 * - A FOLHA PUBLICADA traz o `@font-face` das três famílias, e toda `url()`
 *   dela vale no aplicativo de quem consome: relativa, apontando para arquivo
 *   que o build pôs ao lado, e nenhuma para fora — a CSP do Basalto é
 *   `font-src 'self'`. A folha é a que `scripts/construir-css.mjs` monta, num
 *   diretório temporário: o mesmo script do `npm run build`, sem depender de
 *   um `dist/` de antes.
 * - O TÍTULO E O NÚMERO TÊM O PESO ESCRITO. O título sai num `<h1>` de quem
 *   consome, ou dentro de um ancestral com outro peso; sem o 700 (e o 900 do
 *   número) escrito, a cara da identidade dependeria do que está em volta.
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
  stretch: string;
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
      stretch: descritor("font-stretch"),
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
  it("traz o @font-face da Bricolage, da Figtree e da Sofia, normal, em latin e latin-ext", () => {
    const porFamilia = (familia: string) =>
      faces(publicada)
        .filter((face) => face.family === familia)
        .map((face) => [
          face.style,
          face.weight,
          face.stretch,
          face.display,
          face.src.map((alvo) => alvo.replace(/^\.\/fonts\//, "")),
        ]);

    // As três são variáveis, e cada bloco declara o intervalo do arquivo: o 700
    // do título, os pesos do texto e o 900 do número saem desenhados. Só a
    // Bricolage traz a largura (o título é 88%).
    expect(porFamilia("Bricolage Grotesque")).toEqual([
      ["normal", "200 800", "75% 100%", "swap", ["bricolage-grotesque-latin-ext-wdth-normal.woff2"]],
      ["normal", "200 800", "75% 100%", "swap", ["bricolage-grotesque-latin-wdth-normal.woff2"]],
    ]);
    expect(porFamilia("Figtree")).toEqual([
      ["normal", "300 900", "", "swap", ["figtree-latin-ext-wght-normal.woff2"]],
      ["normal", "300 900", "", "swap", ["figtree-latin-wght-normal.woff2"]],
    ]);
    expect(porFamilia("Sofia Sans Extra Condensed")).toEqual([
      ["normal", "1 1000", "", "swap", ["sofia-sans-extra-condensed-latin-ext-wght-normal.woff2"]],
      ["normal", "1 1000", "", "swap", ["sofia-sans-extra-condensed-latin-wght-normal.woff2"]],
    ]);
    expect(faces(publicada)).toHaveLength(6);

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
    expect(pedidas("--co-font-display")[0]).toBe("Bricolage Grotesque");
    expect(pedidas("--co-font-body")[0]).toBe("Figtree");
    expect(pedidas("--co-font-num")[0]).toBe("Sofia Sans Extra Condensed");
    expect([...familias].sort()).toEqual(["Bricolage Grotesque", "Figtree", "Sofia Sans Extra Condensed"]);
    // As de antes saíram inteiras: nenhum nome, nenhum arquivo.
    expect(publicada).not.toMatch(/Instrument Serif|Archivo/);
  });

  it("toda url() é relativa e chega a um arquivo da saída; nenhuma vai para fora", () => {
    expect(problemas(publicada, existeNaSaida)).toEqual([]);
    expect(problemas(soTokens, existeNaSaida)).toEqual([]);
    // Não é uma folha sem url(): são as seis fontes e o grão.
    expect(alvos(publicada).filter((alvo) => alvo.startsWith("./fonts/"))).toHaveLength(6);
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
    expect(tamanhos).toHaveLength(6);
  });

  it("a licença OFL de cada família vai ao lado das fontes", () => {
    for (const [arquivo, autoria] of [
      ["OFL-bricolage-grotesque.txt", "Copyright 2022 The Bricolage Grotesque Project Authors"],
      ["OFL-figtree.txt", "Copyright 2022 The Figtree Project Authors"],
      ["OFL-sofia-sans-extra-condensed.txt", "Copyright 2019 The Sofia Sans Project Authors"],
    ] as const) {
      const licenca = readFileSync(join(saida, "fonts", arquivo), "utf8");
      expect(licenca, arquivo).toContain(autoria);
      expect(licenca, arquivo).toContain("SIL OPEN FONT LICENSE Version 1.1");
    }
  });
});

// ---------------------------------------- o título e o número com o peso --

describe("o título e o número têm o peso escrito", () => {
  it("toda regra que lê a fonte de título escreve 700 e 88%; a de número, um peso do arquivo e tabular-nums", () => {
    const comFonte = (token: string) =>
      REGRAS.filter((regra) =>
        regra.declaracoes.some(([propriedade, valor]) => propriedade === "font-family" && valor.includes(token)),
      );
    const leitura = (regra: (typeof REGRAS)[number], nomes: string[]) =>
      regra.declaracoes.filter(([propriedade]) => nomes.includes(propriedade));

    const titulos = comFonte("--co-font-display");
    expect(titulos.map(lugar)).toEqual(['.co-text[data-variant="title-lg"]']);
    for (const regra of titulos) {
      expect(leitura(regra, ["font-weight", "font-stretch"]), lugar(regra)).toEqual([
        ["font-weight", "700"],
        ["font-stretch", "88%"],
      ]);
    }

    const numeros = comFonte("--co-font-num");
    expect(numeros.map(lugar)).toContain('.co-text[data-variant="numeral"]');
    for (const regra of numeros) {
      expect(leitura(regra, ["font-variant-numeric"]), lugar(regra)).toEqual([["font-variant-numeric", "tabular-nums"]]);
      const peso = leitura(regra, ["font-weight"]);
      expect(peso, lugar(regra)).toHaveLength(1);
      expect(Number(peso[0]?.[1]), lugar(regra)).toBeGreaterThanOrEqual(1);
      expect(Number(peso[0]?.[1]), lugar(regra)).toBeLessThanOrEqual(1000);
    }
  });

  /**
   * O happy-dom não tem a folha do navegador: lá o `<h1>` nasce no peso
   * normal. Esta é a regra que o Chrome, o Safari e o Firefox escrevem —
   * `h1 { font-weight: bold }` —, e o contêiner em 300 ou em 700 é o ancestral
   * leve ou pesado de quem herda o peso.
   */
  function noNavegador(conteudo: ReactNode, peso: 300 | 700) {
    const folhaDoNavegador = document.createElement("style");
    folhaDoNavegador.textContent = `h1, h2, strong, b, th { font-weight: bold; } .ancestral-${peso} { font-weight: ${peso}; }`;
    document.head.append(folhaDoNavegador);
    const montado = render(<div className={`ancestral-${peso}`}>{conteudo}</div>);
    return {
      peso: (texto: string) => getComputedStyle(montado.getByText(texto)).fontWeight,
      largura: (texto: string) => getComputedStyle(montado.getByText(texto)).fontStretch,
      desmontar: () => {
        montado.unmount();
        folhaDoNavegador.remove();
      },
    };
  }

  it("o título do ScreenHeader, do PageHeader e o title-lg computam 700 num ancestral leve; o numeral, 900 num pesado", () => {
    const leve = noNavegador(
      <>
        <ScreenHeader title="Hoje" />
        <PageHeader title="Receitas" as="h2" />
        <Text as="span" variant="title-lg">
          Calculadora
        </Text>
      </>,
      300,
    );
    try {
      for (const texto of ["Hoje", "Receitas", "Calculadora"]) {
        expect(leve.peso(texto), texto).toBe("700");
        expect(leve.largura(texto), texto).toBe("88%");
      }
    } finally {
      leve.desmontar();
    }

    const pesado = noNavegador(
      <>
        <Text as="strong" variant="numeral">
          995
        </Text>
        <Stat label="Restante" value="1.917" size="hero" />
      </>,
      700,
    );
    try {
      for (const texto of ["995", "1.917"]) expect(pesado.peso(texto), texto).toBe("900");
    } finally {
      pesado.desmontar();
    }
  });

  it("a isca: a fonte de título sem o peso herda o ancestral leve, e a de número, o pesado", () => {
    const isca = document.createElement("style");
    isca.textContent = ".isca-titulo { font-family: var(--co-font-display); } .isca-numero { font-family: var(--co-font-num); }";
    document.head.append(isca);
    const leve = noNavegador(<span className="isca-titulo">Ajustes</span>, 300);
    const pesado = noNavegador(<strong className="isca-numero">2.371</strong>, 700);
    try {
      expect(leve.peso("Ajustes")).not.toBe("700");
      expect(pesado.peso("2.371")).not.toBe("900");
    } finally {
      leve.desmontar();
      pesado.desmontar();
      isca.remove();
    }
  });
});
