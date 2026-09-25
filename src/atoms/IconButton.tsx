import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label" | "aria-pressed"> {
  icon: IconName;
  /**
   * O nome do botão, e ele é OBRIGATÓRIO no tipo — não numa linha da
   * documentação.
   *
   * Um botão que é só desenho não tem texto de onde o leitor de tela tire o
   * nome, e um botão sem nome é anunciado como "botão" e nada mais. Aqui o
   * `label` vira o `aria-label` E o `title`: quem ouve recebe o nome, e quem
   * usa mouse no desktop vê o mesmo nome ao parar em cima.
   */
  label: string;
  /** `md` tem 44px, o piso. `lg` tem 52px, a altura do `Button size="lg"` ao lado. */
  size?: "md" | "lg";
  /**
   * `surface` é o quadrado com fundo, que fica de pé sozinho ao lado de um
   * campo ou de um botão. `ghost` não tem caixa: é o ícone que mora num
   * cabeçalho, onde o fundo já é o do lugar.
   */
  variant?: "surface" | "ghost";
  /** `accent` pinta o ícone no acento: a ação que o bloco oferece, como ler o código de barras. */
  tone?: "neutral" | "accent";
  /**
   * Liga e desliga — "Salvar nos favoritos". Vira `aria-pressed`, e o desenho
   * muda de COR e de FUNDO: o traço do ícone não tem como encher, então a cor
   * sozinha seria o único sinal (ADR-005).
   */
  pressed?: boolean;
}

/**
 * O botão que é só um ícone.
 *
 * Ele existe separado do `Button` por causa de uma coisa: o nome. Um `Button`
 * com `icon` e sem texto compila, aparece certo na tela e sai mudo para o
 * leitor de tela — e nenhum teste visual pega. Aqui o nome é obrigatório no
 * tipo, e o botão sem nome não chega a existir.
 *
 * Ele é quadrado e tem o mesmo piso de 44px do `Button` (ADR-003). O desenho
 * pedia 38px no paginador e 40px em outros lugares; o alvo não encolhe porque a
 * caixa ficou bonita menor.
 */
export function IconButton({
  icon,
  label,
  size = "md",
  variant = "surface",
  tone = "neutral",
  pressed,
  type = "button",
  className,
  ...resto
}: IconButtonProps) {
  const classe = className ? `co-icon-button ${className}` : "co-icon-button";
  return (
    <button
      className={classe}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      data-size={size === "md" ? undefined : size}
      data-variant={variant === "surface" ? undefined : variant}
      data-tone={tone === "neutral" ? undefined : tone}
      {...resto}
    >
      <Icon name={icon} size={size === "lg" ? 20 : 18} />
    </button>
  );
}
