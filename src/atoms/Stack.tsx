import type { CSSProperties, ElementType, HTMLAttributes } from "react";

/** Os espaços da escala, em pixels. Nada entre eles. */
export type Space = 2 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 20 | 24 | 28 | 32 | 40;

export interface StackProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  direction?: "row" | "column";
  gap?: Space;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  wrap?: boolean;
  grow?: boolean;
}

/**
 * Empilha filhos com `gap`, e é assim que TODO grupo de irmãos deve ser
 * espaçado neste sistema — botão ao lado de botão, chip ao lado de chip,
 * linha embaixo de linha.
 *
 * O motivo é concreto: espaço feito de `margin` no filho, ou de espaço em
 * branco no fonte, some quando alguém reordena, remove ou duplica um item.
 * `gap` é do contêiner e sobrevive a tudo isso.
 *
 * O `gap` vai por variável CSS em vez de valor direto para que o espaçamento
 * continue legível no inspetor como um token, e não como "12px de lugar nenhum".
 */
export function Stack({
  as: Elemento = "div",
  direction = "column",
  gap = 12,
  align,
  justify,
  wrap = false,
  grow = false,
  className,
  style,
  children,
  ...resto
}: StackProps) {
  const classe = className ? `co-stack ${className}` : "co-stack";
  return (
    <Elemento
      className={classe}
      style={{
        display: "flex",
        flexDirection: direction,
        gap: `var(--co-space-${gap})`,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? "wrap" : undefined,
        flexGrow: grow ? 1 : undefined,
        minWidth: 0,
        ...style,
      }}
      {...resto}
    >
      {children}
    </Elemento>
  );
}
