import type { ElementType, HTMLAttributes } from "react";

/**
 * A rampa tipográfica inteira do sistema, e ela é fechada de propósito.
 *
 * `display` é a serifa dos títulos; `numeral` é a serifa dos números que
 * carregam a mensagem — restante da meta, gasto do dia. `label` é o versalete
 * espaçado que separa seções. Não existe "tamanho 17 em negrito": se um
 * desenho pede isso, ou é uma variante nova aqui, ou é um desenho fora do
 * sistema. Essa recusa é o que impede o vale-tudo de voltar pela porta dos
 * fundos.
 */
export type TextVariant = "display" | "title" | "body" | "caption" | "label" | "numeral";

export type TextTone = "default" | "secondary" | "muted" | "accent" | "status";

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "color"> {
  /** O elemento renderizado. A variante escolhe a aparência; isto escolhe a semântica. */
  as?: ElementType;
  variant?: TextVariant;
  tone?: TextTone;
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
      data-numeric={numeric ? "true" : undefined}
      {...resto}
    >
      {children}
    </Elemento>
  );
}
