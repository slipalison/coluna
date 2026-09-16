/**
 * Os tokens semânticos, do lado do JavaScript.
 *
 * Isto NÃO é para pintar: o CSS já faz isso, e repetir a cor aqui criaria duas
 * verdades que divergem no primeiro ajuste. Existe para o punhado de casos em
 * que algo fora do CSS precisa da cor resolvida — a série de um gráfico em
 * canvas, o `<meta name="theme-color">` do manifest, um PNG exportado.
 */

export const semanticTokens = [
  "canvas",
  "surface",
  "surface-raised",
  "surface-sunken",
  "border",
  "border-strong",
  "line",
  "track",
  "text",
  "text-secondary",
  "text-muted",
  "icon-muted",
  "accent",
  "accent-hover",
  "accent-contrast",
  "accent-soft",
  "status",
  "status-border",
  "danger",
  "danger-soft",
] as const;

export type SemanticToken = (typeof semanticTokens)[number];

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
