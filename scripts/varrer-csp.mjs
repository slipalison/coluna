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
 *
 * Comentário não conta: o navegador não executa comentário, e este sistema
 * escreve "nunca setAttribute('style')" nos comentários para explicar a regra.
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
];

const LIDOS = /\.(?:m?js|tsx?)$/;
const PULADOS = /(?:^|[\\/])(?:node_modules|test)(?:[\\/]|$)|\.(?:test|stories)\.[jt]sx?$|\.map$/;

/**
 * Tira os comentários e guarda as quebras de linha, para o número da linha do
 * achado continuar certo. O comentário de bloco sai inteiro; o `//` sai só quando
 * começa a linha ou vem depois de espaço ou de pontuação de código — numa URL
 * entre aspas ele vem depois de `:`, e fica. Heurística de texto, e não um
 * analisador: o que ela erra, erra para o lado de acusar.
 */
export function semComentarios(codigo) {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, (bloco) => bloco.replace(/[^\n]/g, " "))
    .replace(/(^|[\s;{}(),])\/\/[^\n]*/g, "$1");
}

/** Os achados de um texto: `[linha, padrão]`, na ordem. */
export function achadosNoTexto(codigo) {
  const linhas = semComentarios(codigo).split("\n");
  const achados = [];
  linhas.forEach((linha, indice) => {
    for (const [nome, padrao] of PADROES) if (padrao.test(linha)) achados.push([indice + 1, nome]);
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
    achadosNoTexto(readFileSync(arquivo, "utf8")).map(([linha, nome]) => `${relative(process.cwd(), arquivo)}:${linha}: ${nome}`),
  );
  if (achados.length > 0) {
    console.error(`varrer-csp: ${achados.length} achado(s) que a CSP style-src 'self' recusaria:`);
    for (const achado of achados) console.error(`  ${achado}`);
    process.exit(1);
  }
  console.log(`varrer-csp: ${lidos.length} arquivo(s), nenhum achado`);
}
