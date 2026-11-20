import type { ElementType, HTMLAttributes } from "react";

/**
 * A rampa tipográfica inteira do sistema, e ela é fechada de propósito.
 *
 * Dez variantes, cada uma ganhando o lugar por aparecer nas telas, cada uma
 * com o piso de letra do papel que cumpre (ADR-016, ADR-021) e, desde a 2.0,
 * com a escala do "Relógio de Sol" (ADR-022): corpo 17, secundário e legenda
 * 14, caixa alta 13.
 *
 *   title-lg   26  a Bricolage que nomeia a tela (30 com ponteiro fino). Um por tela.
 *   numeral    56  a Sofia condensada do número que carrega a mensagem.
 *   headline   17  o nome de uma refeição, de um cartão.
 *   body       17  o texto corrido, a linha principal de uma lista.
 *   callout    14  o texto secundário dentro de uma linha.
 *   subhead    13  horário, valor ao lado do nome.
 *   footnote   14  a nota que explica o bloco (o corpo do aviso, o do vazio).
 *   caption    14  a legenda: a conta miúda embaixo do número.
 *   label      13  o versalete que separa uma seção da outra.
 *   micro      13  o versalete DENTRO da linha (o grupo, no trilho e na lista).
 *
 * `footnote`, `callout` e `caption` têm a mesma letra, e `label` e `micro`
 * também: o que os separa é o papel (e, nos versaletes, o espaçamento). Nenhum
 * dos nomes saiu, porque quem usa o pacote escreve o nome.
 *
 * Não existe "tamanho 19 em negrito": se um desenho pede isso, ou é uma
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
 * Os tons do texto, sobre as três tintas da pedra (ADR-022): `default` e
 * `body` são a `ink`, `secondary` e `muted` a `ink-2`, `subtle` a `ink-3`.
 * `accent` é a tinta da hora (cor de lugar) e `status` o `ok`.
 *
 * O piso é `subtle` (`ink-3`): ele ainda passa em 4,5:1 sobre todo fundo de
 * texto, nos dois temas. Abaixo dele só existe `--co-control`, e ele é para
 * DESENHO — seta, chevron, moldura —, nunca para texto.
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
