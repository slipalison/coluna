import type { HTMLAttributes, ReactNode } from "react";

export interface ScreenProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Reserva o espaço do rodapé para a barra de abas flutuante.
   *
   * Sem isto a última linha da lista para embaixo do vidro e ninguém alcança.
   * É o defeito clássico de barra translúcida: não aparece na captura de tela,
   * só no polegar de quem rolou até o fim.
   *
   * `true` só reserva, e a barra vem de quem consome, onde ele a puser — o
   * comportamento da 1.7.1. Um NÓ (a própria `TabBar`) reserva e entra como o
   * ÚLTIMO filho da tela, depois da barra de ação: a ordem do documento, que é
   * a do Tab e a do leitor de tela, fica a mesma da tela vista de cima para
   * baixo — conteúdo, barra de ação, abas (WCAG 2.4.3, ADR-013).
   */
  tabBar?: boolean | ReactNode;
  /**
   * A barra de ação: fixa acima da barra de abas (ou na área segura de baixo,
   * sem abas), com as ações da tela à mão do polegar em qualquer rolagem.
   *
   * O conteúdo é de quem consome — o sistema não sabe que ação é essa, e por
   * isso não há prop de rótulo nem de clique aqui (ADR-003). A barra tem a
   * altura de UMA fileira de botões, e a tela reserva essa altura embaixo; sem
   * nada dentro (nenhum descendente com conteúdo), ela não pinta e não reserva
   * (ADR-013).
   *
   * O controle que acabou de chegar à barra ignora o PONTEIRO por 400ms (o
   * teclado, não): o segundo toque de um toque duplo não cai na ação que a
   * tela seguinte pôs no mesmo lugar. A janela é da entrada no documento — a
   * ação de outra tela vai num elemento novo (outro portal, ou outra `key`),
   * e não no mesmo `<button>` com outro rótulo (ADR-013, adendo 1.8.1).
   */
  actionBar?: ReactNode;
  /** Liga o grão vulcânico. Cabe aqui, na tela inteira — não em cada cartão. */
  grain?: boolean;
}

/**
 * O que o React desenharia. `null`, `undefined`, booleano e texto vazio não
 * desenham nada: com eles, a tela é exatamente a de antes da prop existir.
 */
function desenha(no: ReactNode): boolean {
  return no !== null && no !== undefined && typeof no !== "boolean" && no !== "";
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
 *
 * A barra de ação e as abas vêm DEPOIS do conteúdo, nesta ordem (ADR-013): é a
 * ordem em que se leem na tela, e a do Tab. A barra de ação também sai sem
 * `style`: posição, altura e reserva são da folha.
 */
export function Screen({
  tabBar = false,
  actionBar,
  grain = true,
  className,
  children,
  ...resto
}: Readonly<ScreenProps>) {
  const classes = ["co-screen"];
  if (grain) classes.push("co-grain");
  if (className) classes.push(className);

  const abas = tabBar === true || desenha(tabBar);
  const temAcao = desenha(actionBar);

  return (
    <div
      className={classes.join(" ")}
      data-tabbar={abas ? "true" : undefined}
      data-actionbar={temAcao ? "true" : undefined}
      {...resto}
    >
      <div className="co-screen__statusbar" aria-hidden="true" />
      {children}
      {temAcao ? <div className="co-screen__actionbar">{actionBar}</div> : null}
      {abas && tabBar !== true ? tabBar : null}
    </div>
  );
}
