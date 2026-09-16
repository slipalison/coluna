import type { ElementType, HTMLAttributes } from "react";

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

/**
 * Some da tela, continua no leitor de tela.
 *
 * `clip-path` com tamanho de 1px, e nao `display: none` nem `visibility:
 * hidden`: esses dois tiram o elemento da arvore de acessibilidade tambem, que
 * e o oposto do que se quer aqui.
 */
export function VisuallyHidden({ as: Elemento = "span", className, children, ...resto }: VisuallyHiddenProps) {
  const classe = className ? `co-visually-hidden ${className}` : "co-visually-hidden";
  return (
    <Elemento className={classe} {...resto}>
      {children}
    </Elemento>
  );
}
