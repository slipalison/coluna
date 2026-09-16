/**
 * Os tokens semânticos, do lado do JavaScript.
 *
 * Isto NÃO é para pintar: o CSS já faz isso, e repetir a cor aqui criaria duas
 * verdades que divergem no primeiro ajuste. Existe para o punhado de casos em
 * que algo fora do CSS precisa da cor resolvida — a série de um gráfico em
 * canvas, o `<meta name="theme-color">` do manifest, um PNG exportado.
 *
 * A LISTA não mora aqui: ela é gerada em `gerado.ts` a partir de
 * `tokens/semantico.claro.json`, pela mesma passada que escreve o CSS. Antes
 * ela era digitada à mão, e um token novo entrava no CSS sem entrar aqui — uma
 * divergência que só aparecia quando alguém chamasse `readToken` com um nome
 * que o TypeScript recusava e o CSS tinha.
 */

export { semanticTokens } from "./gerado";
export type { SemanticToken } from "./gerado";

import type { SemanticToken } from "./gerado";

/**
 * Lê um token resolvido, já com o tema que estiver valendo no elemento.
 *
 * O elemento importa: com tema por subárvore, `--co-accent` no `<html>` e no
 * painel de pré-visualização ao lado podem ser cores diferentes. Passe o nó
 * de onde a cor precisa sair, e não o documento inteiro.
 *
 * Devolve string vazia fora do navegador e quando o token não existe — e não
 * uma cor de mentira, que é o que faria um gráfico pintar errado em silêncio.
 */
export function readToken(token: SemanticToken, element?: Element): string {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") return "";
  const alvo = element ?? document.documentElement;
  return getComputedStyle(alvo).getPropertyValue(`--co-${token}`).trim();
}
