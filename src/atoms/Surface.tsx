import type { ElementType, HTMLAttributes } from "react";
import type { Space } from "./Stack";

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /**
   * `flat` é o cartão comum; `raised` é o degrau acima, para um controle
   * dentro do cartão; `sunken` é o degrau abaixo, para um campo dentro dele.
   * Três degraus bastam — o quarto vira decoração e ninguém sabe mais o que
   * está na frente do quê.
   */
  elevation?: "flat" | "raised" | "sunken";
  bordered?: boolean;
  padding?: Space;
  /** Liga o grão vulcânico. Cabe na tela de fundo, não em cada cartão. */
  grain?: boolean;
}

export function Surface({
  as: Elemento = "div",
  elevation = "flat",
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
      data-bordered={bordered ? "true" : undefined}
      style={padding === undefined ? style : { padding: `var(--co-space-${padding})`, ...style }}
      {...resto}
    >
      {children}
    </Elemento>
  );
}
