/**
 * Varre código-fonte ou pacote atrás do que a CSP do Basalto recusaria
 * (ADR-024).
 *
 * A CSP de quem consome é `style-src 'self'`: o navegador recusa o `<style>`
 * injetado e o atributo `style` escrito na marcação ou com `setAttribute`. O
 * CSSOM (`element.style.setProperty`, a prop `style` do React,
 * `element.animate()`) continua valendo. Esta varredura acusa, no texto, o que
 * leva aos dois caminhos recusados, e também o CSS-in-JS em geral, que o
 * sistema não usa (ADR-001):
 *
 *   setAttribute("style", …)         o atributo, pela API
 *   setAttributeNS(…, "style", …)
 *   createElement("style")           a folha injetada
 *   <style …>                         a folha em JSX ou numa string de HTML
 *   insertRule, adoptedStyleSheets,  a folha montada em tempo de execução
 *   new CSSStyleSheet
 *   dangerouslySetInnerHTML,         HTML cru, que pode trazer as duas coisas
 *   innerHTML/outerHTML =, insertAdjacentHTML, document.write
 *   styled-components, @emotion/*,   bibliotecas de CSS-in-JS
 *   goober, @stitches/*, jss
 *   jsx("style", …)                   o `<style>` depois de compilado
 *   http(s)://, só no .js/.mjs        o que o pacote buscaria de fora
 *
 * Comentário não conta: o navegador não executa comentário, e este sistema
 * escreve "nunca setAttribute('style')" nos comentários para explicar a regra.
 * Quem acha o comentário é o analisador do TypeScript, e não um regex: `" //"`
 * e `"/*"` dentro de uma string não escondem o resto da linha.
 *
 *   node scripts/varrer-csp.mjs <arquivo ou pasta> [...]
 *
 * Lê `.js`, `.mjs`, `.ts` e `.tsx` (o `.d.ts` incluído), pula `node_modules`,
 * os testes (`*.test.*`), as histórias (`*.stories.*`), `src/test/` e os
 * `.map`. Sai 0 sem achado, e 1 com um achado por linha: `arquivo:linha:
 * padrão`. Não imprime o conteúdo da linha.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";

const PADROES = [
  ["setAttribute(style)", /\bsetAttribute\s*\(\s*["'`]style["'`]/i],
  ["setAttributeNS(style)", /\bsetAttributeNS\s*\([^,]*,\s*["'`](?:[\w-]+:)?style["'`]/i],
  ['createElement("style")', /\bcreateElement(?:NS)?\s*\((?:[^,)]*,\s*)?["'`]style["'`]/i],
  ["<style>", /<style[\s>/]/i],
  ["insertRule", /\binsertRule\s*\(/],
  ["adoptedStyleSheets", /\badoptedStyleSheets\b/],
  ["new CSSStyleSheet", /\bnew\s+CSSStyleSheet\b/],
  ["dangerouslySetInnerHTML", /\bdangerouslySetInnerHTML\b/],
  ["innerHTML/outerHTML", /\.(?:inner|outer)HTML\s*\+?=(?!=)/],
  ["insertAdjacentHTML", /\binsertAdjacentHTML\s*\(/],
  ["document.write", /\bdocument\s*\.\s*write(?:ln)?\s*\(/],
  ["CSS-in-JS", /\bfrom\s*["'](?:styled-components|@emotion\/[\w-]+|goober|@stitches\/[\w-]+|jss)["']/],
  ["CSS-in-JS", /\brequire\s*\(\s*["'](?:styled-components|@emotion\/[\w-]+|goober|@stitches\/[\w-]+|jss)["']\s*\)/],
  // O `<style>` depois de compilado: `jsx("style", …)`, `jsxs("style", …)`,
  // `e("style", …)` — o JSX vira uma chamada com o nome da tag como texto, e o
  // padrão `<style>` acima não o vê mais. O `setAttribute` e o `createElement`
  // têm o padrão deles, e não contam duas vezes.
  [
    '<id>("style", …)',
    /(?<![\w$])(?!(?:setAttribute|setAttributeNS|createElement|createElementNS)\s*\()[\w$]+\s*\(\s*["'`]style["'`]\s*,/,
  ],
];

/**
 * Só no JavaScript do pacote (`.js`, `.mjs`): qualquer URL absoluta. O pacote
 * não busca nada de fora — as fontes moram nele (ADR-014, ADR-023) —, e uma URL
 * `http(s)://` no JS que o app carrega é um `fetch`, uma fonte ou uma folha de
 * terceiro esperando para acontecer, que a CSP do Basalto recusaria. No `.ts`
 * do código-fonte ela não conta: o que chega ao app é o pacote.
 */
const PADROES_DO_PACOTE = [["URL absoluta", /\bhttps?:\/\//i]];
const DO_PACOTE = /\.m?js$/;

const LIDOS = /\.(?:m?js|tsx?)$/;
const PULADOS = /(?:^|[\\/])(?:node_modules|test)(?:[\\/]|$)|\.(?:test|stories)\.[jt]sx?$|\.map$/;

/**
 * As faixas `[início, fim)` de cada comentário do código, achadas pelo
 * analisador do TypeScript (que já é dependência de desenvolvimento), e não por
 * regex: só ele sabe que `" //"` e `"/*"` dentro de uma string NÃO abrem
 * comentário. A heurística de texto que estava aqui apagava o resto da linha
 * depois de `" //"` e tudo entre um `"/*"` e o próximo `*\/`, e um
 * `setAttribute("style", …)` escondido ali passava.
 *
 * Os comentários são os trívios antes e depois de cada token, em cada nó da
 * árvore. O texto de JSX (`<p>// x</p>`) é texto, e fica. Um comentário num
 * lugar que a árvore não visita continua no texto, e erra para o lado de
 * acusar.
 */
function faixasDeComentario(codigo, arquivo) {
  const tipo = /\.tsx$/.test(arquivo)
    ? ts.ScriptKind.TSX
    : /\.ts$/.test(arquivo)
      ? ts.ScriptKind.TS
      : ts.ScriptKind.JSX;
  const fonte = ts.createSourceFile(arquivo, codigo, ts.ScriptTarget.Latest, false, tipo);
  // Onde começa um texto de JSX, nenhum trívio é lido: o `>` antes dele e a
  // lista que o contém começam ali, e o analisador leria o `//` do texto como
  // comentário.
  const textosDeJsx = new Set();
  const acharTextos = (no) => {
    if (no.kind === ts.SyntaxKind.JsxText) textosDeJsx.add(no.pos);
    ts.forEachChild(no, acharTextos);
  };
  acharTextos(fonte);
  const faixas = new Map();
  const juntar = (lista) => {
    for (const faixa of lista ?? []) faixas.set(faixa.pos, faixa.end);
  };
  const visitar = (no) => {
    if (!textosDeJsx.has(no.pos)) juntar(ts.getLeadingCommentRanges(codigo, no.pos));
    if (!textosDeJsx.has(no.end)) juntar(ts.getTrailingCommentRanges(codigo, no.end));
    for (const filho of no.getChildren(fonte)) visitar(filho);
  };
  visitar(fonte);
  return [...faixas].sort(([a], [b]) => a - b);
}

/**
 * Tira os comentários e guarda as quebras de linha, para o número da linha do
 * achado continuar certo.
 */
export function semComentarios(codigo, arquivo = "codigo.tsx") {
  let saida = "";
  let ate = 0;
  for (const [inicio, fim] of faixasDeComentario(codigo, arquivo)) {
    if (inicio < ate) continue;
    saida += codigo.slice(ate, inicio) + codigo.slice(inicio, fim).replace(/[^\n]/g, " ");
    ate = fim;
  }
  return saida + codigo.slice(ate);
}

/** Os achados de um texto: `[linha, padrão]`, na ordem. */
export function achadosNoTexto(codigo, arquivo = "codigo.tsx") {
  const linhas = semComentarios(codigo, arquivo).split("\n");
  const padroes = DO_PACOTE.test(arquivo) ? [...PADROES, ...PADROES_DO_PACOTE] : PADROES;
  const achados = [];
  linhas.forEach((linha, indice) => {
    for (const [nome, padrao] of padroes) if (padrao.test(linha)) achados.push([indice + 1, nome]);
  });
  return achados;
}

function arquivos(caminho) {
  const estado = statSync(caminho);
  if (estado.isFile()) return LIDOS.test(caminho) ? [caminho] : [];
  return readdirSync(caminho)
    .sort()
    .flatMap((nome) => {
      const filho = join(caminho, nome);
      return PULADOS.test(filho.split(sep).join("/")) ? [] : arquivos(filho);
    });
}

const alvos = process.argv.slice(2);
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("varrer-csp.mjs")) {
  if (alvos.length === 0) {
    console.error("uso: node scripts/varrer-csp.mjs <arquivo ou pasta> [...]");
    process.exit(2);
  }
  const lidos = alvos.flatMap(arquivos);
  if (lidos.length === 0) {
    // Uma varredura que não leu nada não provou nada.
    console.error(`varrer-csp: nenhum arquivo lido em ${alvos.join(", ")}`);
    process.exit(2);
  }
  const achados = lidos.flatMap((arquivo) =>
    achadosNoTexto(readFileSync(arquivo, "utf8"), arquivo).map(([linha, nome]) => `${relative(process.cwd(), arquivo)}:${linha}: ${nome}`),
  );
  if (achados.length > 0) {
    console.error(`varrer-csp: ${achados.length} achado(s) que a CSP style-src 'self' recusaria:`);
    for (const achado of achados) console.error(`  ${achado}`);
    process.exit(1);
  }
  console.log(`varrer-csp: ${lidos.length} arquivo(s), nenhum achado`);
}
