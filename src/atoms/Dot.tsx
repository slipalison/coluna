import type { HTMLAttributes } from "react";

export type DotTone = "neutral" | "protein" | "carb" | "fat" | "accent" | "status";

export interface DotProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: DotTone;
}

/**
 * O quadradinho colorido que abre uma linha de macro ou uma legenda de gráfico.
 *
 * Quadrado, e não redondo: pela regra do raio deste sistema ele é CONTEÚDO
 * dentro do cartão, e conteúdo não arredonda (ADR-004).
 *
 * Ele sai `aria-hidden` sempre, e isso não é descuido — é o contrato. O ponto
 * nunca é o único sinal: a linha que o usa mostra nome e número ao lado, e o
 * leitor de tela já recebe a informação inteira por ali. Um ponto anunciado
 * como "roxo" não diria nada a mais a ninguém (ADR-005).
 */
export function Dot({ tone = "neutral", className, ...resto }: DotProps) {
  const classe = className ? `co-dot ${className}` : "co-dot";
  return <span className={classe} data-tone={tone} aria-hidden="true" {...resto} />;
}
