import type { HTMLAttributes } from "react";

export interface ScreenProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Reserva o espaço do rodapé para a barra de abas flutuante.
   *
   * Sem isto a última linha da lista para embaixo do vidro e ninguém alcança.
   * É o defeito clássico de barra translúcida: não aparece na captura de tela,
   * só no polegar de quem rolou até o fim.
   */
  tabBar?: boolean;
  /** Liga o grão vulcânico. Cabe aqui, na tela inteira — não em cada cartão. */
  grain?: boolean;
}

/**
 * A moldura de uma tela: fundo, calha lateral de 16px, o espaço do rodapé e a
 * faixa sob o relógio.
 *
 * Existe para que a calha seja UMA decisão, tomada num lugar só. Quando cada
 * tela escolhe a própria margem lateral, duas telas do mesmo aplicativo saem
 * com recuos diferentes e ninguém consegue dizer qual das duas está errada.
 *
 * A faixa sob o relógio é montada aqui, SEMPRE, sem prop: é ela que esconde o
 * conteúdo rolado atrás do relógio e da ilha no aparelho com área segura, e sem
 * área segura ela tem altura zero (ADR-012). É o primeiro filho, antes do
 * conteúdo, `aria-hidden` (é pintura, nada para ler) e sem `style` — a altura e
 * o fundo vêm da folha, que a CSP com `style-src 'self'` deixa passar.
 */
export function Screen({ tabBar = false, grain = true, className, children, ...resto }: ScreenProps) {
  const classes = ["co-screen"];
  if (grain) classes.push("co-grain");
  if (className) classes.push(className);

  return (
    <div className={classes.join(" ")} data-tabbar={tabBar ? "true" : undefined} {...resto}>
      <div className="co-screen__statusbar" aria-hidden="true" />
      {children}
    </div>
  );
}
