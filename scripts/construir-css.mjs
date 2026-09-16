/**
 * Monta os dois CSS que o pacote publica.
 *
 *   dist/styles.css   tokens + componentes, numa folha só. É o que o
 *                     aplicativo importa uma vez, na raiz.
 *   dist/tokens.css   só os tokens. O `index.html` do PWA pinta a barra do
 *                     sistema com `--co-canvas` sem montar um componente
 *                     React, e uma página estática pode querer só a paleta.
 *
 * Por que aqui e não no bundler: `src/index.ts` NÃO importa a folha, de
 * propósito (ver o comentário lá), então ela nunca entra no grafo do Vite e
 * nunca seria emitida. Fazer o `index.ts` importá-la resolveria o build e
 * criaria um problema pior — todo mundo que toca em um tipo carregaria o CSS
 * inteiro, inclusive em teste e em Node.
 *
 * O `@import` é resolvido à mão porque é UM, conhecido, e relativo. Trazer um
 * empacotador de CSS para resolver uma linha seria a ferramenta maior que o
 * problema.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, "..");
const dist = resolve(raiz, "dist");

const IMPORTACAO = '@import "./tokens/tokens.css";';

const tokens = await readFile(resolve(raiz, "src/tokens/tokens.css"), "utf8");
const folha = await readFile(resolve(raiz, "src/styles.css"), "utf8");

if (!folha.includes(IMPORTACAO)) {
  // Falhar alto: sem isto o pacote sairia com uma folha sem token nenhum, e o
  // defeito só apareceria na tela do consumidor, como texto invisível.
  throw new Error(`src/styles.css não contém ${IMPORTACAO} — o CSS sairia sem tokens.`);
}

await mkdir(dist, { recursive: true });
await writeFile(resolve(dist, "styles.css"), folha.replace(IMPORTACAO, tokens.trim()), "utf8");
await writeFile(resolve(dist, "tokens.css"), tokens, "utf8");

console.log("css: dist/styles.css e dist/tokens.css");
