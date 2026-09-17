import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/**
 * Só dois tamanhos, e o menor tem 44px.
 *
 * Não existe `sm` nesta API, e a ausência é a decisão: 44px é o alvo mínimo
 * que um polegar acerta. Um botão de 32px passa no desenho, some no uso, e
 * depois volta como "o app é difícil de clicar no celular". Quem precisa de
 * algo menor não precisa de um botão — precisa de um link dentro de um texto.
 */
export type ButtonSize = "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Só vale em `ghost`. A ação inline de uma lista — "Adicionar a esta
   * refeição" — nasce no acento, porque ela é uma oferta; `neutral` é para
   * quando duas ações inline dividem a mesma linha e só uma delas é a
   * principal.
   */
  tone?: "accent" | "neutral";
  /** Ocupa a largura do contêiner. */
  full?: boolean;
  /** Ícone antes do rótulo. */
  icon?: IconName;
  /** Ícone depois do rótulo. */
  iconEnd?: IconName;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  tone = "accent",
  full = false,
  icon,
  iconEnd,
  type = "button",
  className,
  children,
  ...resto
}: ButtonProps) {
  const classe = className ? `co-button ${className}` : "co-button";
  return (
    // `type="button"` por padrão: o padrão do HTML é `submit`, e um botão de
    // "trocar refeição" dentro de um formulário acaba enviando o formulário.
    <button
      className={classe}
      type={type}
      data-variant={variant}
      data-size={size}
      data-tone={tone === "accent" ? undefined : tone}
      data-full={full ? "true" : undefined}
      {...resto}
    >
      {icon ? <Icon className="co-button__icon" name={icon} size={size === "lg" ? 18 : 17} /> : null}
      {children}
      {iconEnd ? (
        <Icon className="co-button__icon" name={iconEnd} size={size === "lg" ? 18 : 17} />
      ) : null}
    </button>
  );
}
