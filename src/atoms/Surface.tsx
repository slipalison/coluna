import type { ElementType, HTMLAttributes } from "react";
import type { Space } from "./Stack";

/**
 * Os quatro raios do sistema, e o nome de cada um diz onde ele cabe.
 *
 *   container  16  a vitrine: cartão, grupo, aviso.
 *   control    12  o objeto que se toca: botão, trilho de segmentado.
 *   inset       9  o que mora dentro de um trilho de 12 com 3 de folga.
 *   pill      999  o selo.
 *   content     0  a pedra: ponto, ripa, barra, marca, fio.
 *
 * `inset` não é um número solto: raio interno = raio externo − folga. Com 12
 * por fora e 3 de folga, o de dentro é 9 — qualquer outro valor faz o canto
 * de dentro correr paralelo ao de fora com espessura variável, e o olho vê
 * sem saber nomear.
 */
export type SurfaceRadius = "container" | "control" | "inset" | "pill" | "content";

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /**
   * `flat` é o cartão comum; `raised` é o degrau acima, para um controle
   * dentro do cartão; `sunken` é o degrau abaixo, para um painel que abre
   * embaixo de uma linha; `none` não pinta fundo nenhum.
   */
  elevation?: "flat" | "raised" | "sunken" | "none";
  radius?: SurfaceRadius;
  bordered?: boolean;
  padding?: Space;
  /** Liga o grão vulcânico. Cabe na tela de fundo, não em cada cartão. */
  grain?: boolean;
}

export function Surface({
  as: Elemento = "div",
  elevation = "flat",
  radius = "container",
  bordered = false,
  padding,
  grain = false,
  className,
  style,
  children,
  ...resto
}: SurfaceProps) {
  const classes = ["co-surface"];
  if (grain) classes.push("co-grain");
  if (className) classes.push(className);

  return (
    <Elemento
      className={classes.join(" ")}
      data-elevation={elevation}
      data-radius={radius === "container" ? undefined : radius}
      data-bordered={bordered ? "true" : undefined}
      style={padding === undefined ? style : { padding: `var(--co-space-${padding})`, ...style }}
      {...resto}
    >
      {children}
    </Elemento>
  );
}
