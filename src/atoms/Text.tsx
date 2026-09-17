import type { ElementType, HTMLAttributes } from "react";

/**
 * A rampa tipográfica inteira do sistema, e ela é fechada de propósito.
 *
 * Dez degraus, cada um ganhando o lugar por aparecer nas telas:
 *
 *   title-lg   36  a serifa que nomeia a tela. Um por tela.
 *   numeral    68  a serifa do número que carrega a mensagem.
 *   headline   16  o nome de uma refeição, de um cartão.
 *   body       15  a linha principal de uma lista.
 *   callout    14  o texto secundário dentro de uma linha.
 *   subhead    13  legenda, horário, valor ao lado do nome.
 *   footnote   12  a nota que explica o bloco.
 *   caption    11  a conta miúda embaixo do número.
 *   label      11  o versalete que separa uma seção da outra.
 *   micro      10  o versalete DENTRO da linha (grupo alimentar, aba).
 *
 * Não existe "tamanho 17 em negrito": se um desenho pede isso, ou é uma
 * variante nova aqui, ou é um desenho fora do sistema. Essa recusa é o que
 * impede o vale-tudo de voltar pela porta dos fundos.
 */
export type TextVariant =
  | "title-lg"
  | "numeral"
  | "headline"
  | "body"
  | "callout"
  | "subhead"
  | "footnote"
  | "caption"
  | "label"
  | "micro";

/**
 * Cinco degraus de texto e um de ícone, e a ordem é de contraste decrescente.
 *
 * O piso é `subtle`: ele ainda passa em 4,5:1 sobre a superfície, que é o
 * fundo mais claro do tema escuro e portanto o caso difícil. Abaixo dele só
 * existe `icon-muted`, e ele é para DESENHO — seta, chevron, moldura —, nunca
 * para texto.
 */
export type TextTone =
  | "default"
  | "body"
  | "secondary"
  | "muted"
  | "subtle"
  | "accent"
  | "status";

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "color"> {
  /** O elemento renderizado. A variante escolhe a aparência; isto escolhe a semântica. */
  as?: ElementType;
  variant?: TextVariant;
  tone?: TextTone;
  /** Peso acima do normal, para a linha de total de uma conta. */
  weight?: "regular" | "medium" | "semibold";
  /**
   * Força algarismo de largura fixa. Já vem ligado em `numeral`; use aqui
   * quando o número aparece dentro de uma linha comum — uma coluna de kcal
   * sem isto dança a cada dígito que muda.
   */
  numeric?: boolean;
}

export function Text({
  as: Elemento = "div",
  variant = "body",
  tone = "default",
  weight = "regular",
  numeric = false,
  className,
  children,
  ...resto
}: TextProps) {
  const classe = className ? `co-text ${className}` : "co-text";
  return (
    <Elemento
      className={classe}
      data-variant={variant}
      data-tone={tone}
      data-weight={weight === "regular" ? undefined : weight}
      data-numeric={numeric ? "true" : undefined}
      {...resto}
    >
      {children}
    </Elemento>
  );
}
