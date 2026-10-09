/**
 * Monta os dois CSS que o pacote publica, e as fontes que o primeiro lê.
 *
 *   dist/styles.css   tokens + fontes + componentes, numa folha só. É o que o
 *                     aplicativo importa uma vez, na raiz.
 *   dist/tokens.css   só os tokens. O `index.html` do PWA pinta a barra do
 *                     sistema com `--co-canvas` sem montar um componente
 *                     React, e uma página estática pode querer só a paleta.
 *   dist/fonts/       os `.woff2` que o `@font-face` da folha cita, e a licença
 *                     OFL de cada família ao lado deles (ADR-014).
 *
 * Por que aqui e não no bundler: `src/index.ts` NÃO importa a folha, de
 * propósito (ver o comentário lá), então ela nunca entra no grafo do Vite e
 * nunca seria emitida. Fazer o `index.ts` importá-la resolveria o build e
 * criaria um problema pior — todo mundo que toca em um tipo carregaria o CSS
 * inteiro, inclusive em teste e em Node.
 *
 * O `@import` é resolvido à mão porque é UM, conhecido, e relativo. Trazer um
 * empacotador de CSS para resolver uma linha seria a ferramenta maior que o
 * problema. Pelo mesmo motivo as fontes são COPIADAS, com o mesmo caminho
 * relativo de `src/`: a `url("./fonts/...")` da folha vale igual nos dois
 * lugares, e o Storybook (que lê `src/styles.css`) e o pacote (que publica
 * `dist/styles.css`) acham o mesmo arquivo.
 *
 *   node scripts/construir-css.mjs                  -> dist/
 *   node scripts/construir-css.mjs --destino X      -> X/ (o teste monta num
 *                                                      diretório temporário)
 */
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, "..");
const fontes = resolve(raiz, "src/fonts");

const indiceDestino = process.argv.indexOf("--destino");
if (indiceDestino !== -1 && !process.argv[indiceDestino + 1]) {
  throw new Error("--destino precisa do caminho de saída");
}
const dist = indiceDestino === -1 ? resolve(raiz, "dist") : resolve(process.argv[indiceDestino + 1]);

const IMPORTACAO = '@import "./tokens/tokens.css";';

const tokens = await readFile(resolve(raiz, "src/tokens/tokens.css"), "utf8");
const folha = await readFile(resolve(raiz, "src/styles.css"), "utf8");

if (!folha.includes(IMPORTACAO)) {
  // Falhar alto: sem isto o pacote sairia com uma folha sem token nenhum, e o
  // defeito só apareceria na tela do consumidor, como texto invisível.
  throw new Error(`src/styles.css não contém ${IMPORTACAO} — o CSS sairia sem tokens.`);
}

// Toda fonte que a folha cita tem de existir em `src/fonts/`. Falhar alto aqui
// pela mesma razão do `@import`: o bundler de quem consome recusaria o caminho
// quebrado no build DELE, e o defeito apareceria do lado errado da fronteira.
const disponiveis = new Set(await readdir(fontes));
const citadas = [...folha.matchAll(/url\("\.\/fonts\/([^"]+)"\)/g)].map((achado) => achado[1]);
if (citadas.length === 0) {
  throw new Error("src/styles.css não cita nenhuma fonte de ./fonts/ — o @font-face sumiu?");
}
const faltando = citadas.filter((nome) => !disponiveis.has(nome));
if (faltando.length > 0) {
  throw new Error(`src/styles.css cita fontes que não estão em src/fonts/: ${faltando.join(", ")}`);
}

await mkdir(resolve(dist, "fonts"), { recursive: true });
await writeFile(resolve(dist, "styles.css"), folha.replace(IMPORTACAO, tokens.trim()), "utf8");
await writeFile(resolve(dist, "tokens.css"), tokens, "utf8");

// Os `.woff2` e as licenças. A OFL exige que cada cópia da fonte vá com o
// aviso de direito autoral e a licença — o pacote publicado é uma cópia.
const levadas = [...disponiveis].filter((nome) => /\.(woff2|txt)$/.test(nome)).sort();
await Promise.all(levadas.map((nome) => copyFile(resolve(fontes, nome), resolve(dist, "fonts", nome))));

console.log(`css: styles.css e tokens.css, e ${levadas.length} arquivos em fonts/ (${dist})`);
