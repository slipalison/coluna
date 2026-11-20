/**
 * Gera `src/tokens/tokens.css` e `src/tokens/gerado.ts` a partir de `tokens/`.
 *
 * O QUE ISTO CONSERTA
 * -------------------
 * O `tokens.css` escrito a mao tinha o bloco do tema escuro DUAS vezes — uma
 * na media query `prefers-color-scheme`, outra no seletor `[data-theme]` — e a
 * ADR-001 registrou isso como custo aceito, porque sem pre-processador nao ha
 * como evitar. Agora ha: a fonte e uma so, e o formato abaixo emite o mesmo
 * mapeamento nos dois lugares.
 *
 * E o `src/tokens/tokens.ts` mantinha a lista de nomes semanticos DIGITADA A
 * MAO, que podia divergir do CSS sem ninguem notar. Ela passa a sair da mesma
 * fonte.
 *
 * REFERENCIA CONTINUA SENDO REFERENCIA
 * ------------------------------------
 * `outputReferences: true` faz `--co-bg` sair como
 * `var(--co-pomes-100)`, e nao como `#e9edea` resolvido. Se resolvesse, a
 * separacao entre primitiva e semantica sumiria do arquivo publicado — e com
 * ela a unica coisa que faz o tema funcionar.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";
import { createPropertyFormatter } from "style-dictionary/utils";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, "..");

// Caminho com barra normal, sempre. No Windows o `resolve` devolve `\`, e um
// glob NAO casa barra invertida: o Style Dictionary acha zero token e segue
// calado, escrevendo um arquivo com os blocos vazios.
const comBarra = (...partes) => resolve(raiz, ...partes).split("\\").join("/");

const CABECALHO = `/*
 * Tokens do Coluna.
 *
 * ARQUIVO GERADO — nao edite aqui. A fonte e \`tokens/*.json\`, no formato
 * W3C Design Tokens, e quem escreve este arquivo e \`npm run tokens\`.
 *
 * Duas camadas, e a separacao entre elas e o que faz o tema funcionar:
 *
 *   PRIMITIVA  o valor cru (\`--co-pomes-100: #e9edea\`). Nao muda com o tema.
 *   SEMANTICA  o papel (\`--co-bg\`). Aponta para uma primitiva, e e
 *              APENAS a semantica que o tema troca.
 *
 * Componente nenhum le primitiva. Se um componente escreve \`#e9edea\`, ou le
 * \`--co-pomes-100\`, ele deixa de responder ao tema e o defeito so aparece
 * quando alguem liga o claro.
 *
 * O bloco do tema escuro aparece duas vezes — na media query e no seletor de
 * atributo — porque sao dois caminhos diferentes ate o mesmo resultado:
 *
 *   1. o sistema pede escuro e ninguem pediu claro explicitamente;
 *   2. alguem escreveu \`data-theme="dark"\`, na raiz ou numa subarvore.
 *
 * O \`:not([data-theme="light"])\` do primeiro caso e o que impede o sistema de
 * atropelar uma escolha do usuario. Os dois blocos saem da MESMA fonte, entao
 * nao ha como um ficar para tras do outro.
 */`;

/** Ordem dos arquivos de primitiva na saida, com o titulo de cada faixa. */
const FAIXAS = [
  ["cor.json", "cor"],
  ["espaco.json", "espaco"],
  ["tipografia.json", "tipografia"],
  ["forma.json", "forma"],
  ["movimento.json", "movimento"],
];

function faixa(titulo) {
  const traco = "-".repeat(Math.max(3, 66 - titulo.length));
  return `  /* ${traco} ${titulo} --- */`;
}

StyleDictionary.registerFormat({
  name: "coluna/css",
  format({ dictionary }) {
    const escrever = createPropertyFormatter({
      dictionary,
      outputReferences: true,
      format: "css",
      // Sem isto o formatador procura `token.value` e a fonte em DTCG guarda
      // `$value`: ele devolve `undefined` para TODO token, calado.
      usesDtcg: true,
    });

    // O nome sai com o grupo do tema junto (`co-claro-canvas`). O grupo existe
    // so para separar os dois conjuntos na fonte; no CSS publicado ele nao
    // pode aparecer, senao `--co-bg` viraria dois tokens diferentes.
    const semTema = (token) => escrever({ ...token, name: token.name.replace(/^co-(claro|escuro)-/, "co-") });

    const primitivas = dictionary.allTokens.filter((t) => !["claro", "escuro", "composto"].includes(t.path[0]));
    const claro = dictionary.allTokens.filter((t) => t.path[0] === "claro");
    const escuro = dictionary.allTokens.filter((t) => t.path[0] === "escuro");
    // As composições da hora (ADR-022): o valor LÊ outras propriedades
    // (`oklch(var(--co-hora-l) var(--co-hora-c) var(--co-hora-h))`), e uma
    // propriedade personalizada herdada chega RESOLVIDA de onde foi declarada.
    // Declarada só no `:root`, ela viria com o matiz do `:root`, e a hora que
    // um elemento escreve em si (`hourStyle`) não tingiria nada. Por isso a
    // composição é declarada de novo em CADA elemento: ela é resolvida ali,
    // com o matiz e o croma do elemento e a luminosidade do tema dele.
    const compostos = dictionary.allTokens.filter((t) => t.path[0] === "composto");
    const semGrupo = (token) => escrever({ ...token, name: token.name.replace(/^co-composto-/, "co-") });

    const corpoPrimitivas = FAIXAS.flatMap(([arquivo, titulo]) => {
      const desta = primitivas.filter((t) => t.filePath.endsWith(arquivo));
      return desta.length === 0 ? [] : ["", faixa(titulo), ...desta.map((t) => escrever(t))];
    })
      .slice(1)
      .join("\n");

    const linhasEscuro = escuro.map((t) => semTema(t));

    return [
      CABECALHO,
      "",
      ":root {",
      corpoPrimitivas,
      "}",
      "",
      ":root,",
      '[data-theme="light"] {',
      "  color-scheme: light;",
      "",
      claro.map((t) => semTema(t)).join("\n"),
      "}",
      "",
      "@media (prefers-color-scheme: dark) {",
      '  :root:not([data-theme="light"]) {',
      "    color-scheme: dark;",
      "",
      // O mesmo conjunto, dois niveis de recuo mais fundo.
      linhasEscuro.map((linha) => `  ${linha}`).join("\n"),
      "  }",
      "}",
      "",
      '[data-theme="dark"] {',
      "  color-scheme: dark;",
      "",
      linhasEscuro.join("\n"),
      "}",
      "",
      "/* A cor da hora, recomposta em cada elemento (ADR-022). */",
      ":root,",
      ":root *,",
      ":root *::before,",
      ":root *::after {",
      compostos.map((t) => semGrupo(t)).join("\n"),
      "}",
      "",
    ].join("\n");
  },
});

StyleDictionary.registerFormat({
  name: "coluna/ts",
  format({ dictionary }) {
    const nomes = dictionary.allTokens
      .filter((t) => t.path[0] === "claro" || t.path[0] === "composto")
      .map((t) => t.path.slice(1).join("-"));

    return `/**
 * Os tokens semanticos, do lado do JavaScript.
 *
 * ARQUIVO GERADO — nao edite aqui. Sai de \`tokens/semantico.claro.json\` pelo
 * \`npm run tokens\`, que e o que garante que esta lista nao divirja do CSS.
 * Antes ela era digitada a mao, e um token novo entrava no CSS sem entrar aqui.
 */

export const semanticTokens = [
${nomes.map((n) => `  "${n}",`).join("\n")}
] as const;

export type SemanticToken = (typeof semanticTokens)[number];
`;
  },
});

const sd = new StyleDictionary({
  // O formato DTCG (`$value`, `$type`) e o padrao do W3C, e e o que outras
  // ferramentas — Figma, Terrazzo — leem e escrevem.
  source: [`${comBarra("tokens")}/**/*.json`],
  platforms: {
    css: {
      transformGroup: "css",
      prefix: "co",
      buildPath: `${comBarra("src/tokens")}/`,
      files: [{ destination: "tokens.css", format: "coluna/css" }],
    },
    ts: {
      transformGroup: "js",
      buildPath: `${comBarra("src/tokens")}/`,
      files: [{ destination: "gerado.ts", format: "coluna/ts" }],
    },
  },
  log: { verbosity: "silent", warnings: "warn" },
});

await mkdir(resolve(raiz, "src/tokens"), { recursive: true });
await sd.buildAllPlatforms();

// `buildAllPlatforms` nao devolve o que escreveu; conferir o resultado e o que
// transforma "o script rodou" em "o arquivo tem o que devia".
const { readFile } = await import("node:fs/promises");
const css = await readFile(resolve(raiz, "src/tokens/tokens.css"), "utf8");
const ocorrencias = (agulha) => css.split(agulha).length - 1;

if (ocorrencias("--co-bg:") !== 3) {
  throw new Error(`--co-bg deveria aparecer 3 vezes (claro + 2x escuro), apareceu ${ocorrencias("--co-bg:")}`);
}
if (!css.includes("var(--co-pomes-100)")) {
  throw new Error("as referencias foram resolvidas para o valor — outputReferences nao pegou");
}
if (ocorrencias("--co-hora:") !== 1 || !css.includes("--co-hora: oklch(var(--co-hora-l) var(--co-hora-c) var(--co-hora-h));")) {
  throw new Error("a composicao da hora (--co-hora) sumiu ou saiu com o valor mexido");
}

console.log(`tokens: src/tokens/tokens.css (${Math.round(css.length / 1024)} KB) e src/tokens/gerado.ts`);

await writeFile(
  resolve(raiz, "src/tokens/.gitattributes"),
  "# Arquivos gerados: o diff deles nao e revisao, e resultado.\ntokens.css linguist-generated=true\ngerado.ts linguist-generated=true\n",
  "utf8",
);
