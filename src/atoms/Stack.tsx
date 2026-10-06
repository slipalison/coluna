import type { CSSProperties, ElementType, HTMLAttributes, Ref } from "react";

/** Os espaços da escala, em pixels. Nada entre eles. */
export type Space = 2 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 20 | 24 | 28 | 32 | 40;

export interface StackProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  direction?: "row" | "column";
  gap?: Space;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  wrap?: boolean;
  /**
   * Uma fileira que NÃO quebra: o que não cabe fica ao lado, e a fileira rola
   * no eixo x. É o caso de uma lista curta de escolhas que não pode empurrar o
   * resto da tela para baixo — as medidas caseiras de um alimento, numa folha
   * que precisa caber sem rolar. Vence o `wrap`: as duas juntas não fazem
   * sentido, e a que diz "não quebre" é a mais específica.
   *
   * Os filhos não encolhem (senão o rótulo de cada um quebraria em linhas em
   * vez de a fileira rolar), e a caixa que rola guarda 4px em volta para o anel
   * de foco caber dentro dela — sem mudar onde os filhos ficam (ADR-013).
   */
  scroll?: boolean;
  grow?: boolean;
  /**
   * O elemento que o `Stack` monta. No React 19 o `ref` já chega a ele pelo
   * resto das props; o tipo existe para quem precisa do nó — o hospedeiro de um
   * portal, o foco ao montar — sem efeito e sem `forwardRef`.
   */
  ref?: Ref<HTMLElement> | undefined;
}

/** `scroll` vence `wrap`: a fileira que rola não quebra. */
function quebra(scroll: boolean, wrap: boolean): CSSProperties["flexWrap"] {
  if (scroll) return "nowrap";
  return wrap ? "wrap" : undefined;
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
  scroll = false,
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
      data-scroll={scroll ? "true" : undefined}
      style={{
        display: "flex",
        flexDirection: direction,
        gap: `var(--co-space-${gap})`,
        alignItems: align,
        justifyContent: justify,
        flexWrap: quebra(scroll, wrap),
        overflowX: scroll ? "auto" : undefined,
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
