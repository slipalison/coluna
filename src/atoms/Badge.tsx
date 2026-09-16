import type { HTMLAttributes, ReactNode } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "status";
  /** Preenchido em vez de contornado. Use com parcimônia: um por bloco. */
  solid?: boolean;
  children?: ReactNode;
}

/**
 * Selo curto: a origem de um dado ("TACO"), o estado de um ingrediente
 * ("cozido"), a confiança de um número ("62% medido").
 *
 * Não é contador de notificação nem botão. Se o usuário pode clicar, é um
 * `Button`; o selo não recebe evento.
 */
export function Badge({ tone = "neutral", solid = false, className, children, ...resto }: BadgeProps) {
  const classe = className ? `co-badge ${className}` : "co-badge";
  return (
    <span
      className={classe}
      data-tone={tone}
      data-solid={solid ? "true" : undefined}
      {...resto}
    >
      {children}
    </span>
  );
}
