import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import type { Space } from "./Stack";

export interface GridProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Número de colunas iguais. Use `template` quando elas não forem iguais. */
  columns?: number;
  /** Trilhas explícitas, para colunas de larguras diferentes ("236px 1fr"). */
  template?: string;
  gap?: Space;
  align?: CSSProperties["alignItems"];
}

/**
 * Grade de trilhas iguais.
 *
 * `minmax(0, 1fr)` e nao `1fr`: o padrao de uma trilha de grade e `auto`, que
 * NAO encolhe abaixo do conteudo. Com `1fr` puro, um nome de alimento comprido
 * empurra a coluna e estoura a grade para fora da tela — e o defeito so
 * aparece com o dado real, nunca com "Lorem ipsum".
 */
export function Grid({
  as: Elemento = "div",
  columns = 2,
  template,
  gap = 12,
  align,
  className,
  style,
  children,
  ...resto
}: GridProps) {
  const classe = className ? `co-grid ${className}` : "co-grid";
  return (
    <Elemento
      className={classe}
      style={{
        display: "grid",
        gridTemplateColumns: template ?? `repeat(${columns}, minmax(0, 1fr))`,
        gap: `var(--co-space-${gap})`,
        alignItems: align,
        ...style,
      }}
      {...resto}
    >
      {children}
    </Elemento>
  );
}
