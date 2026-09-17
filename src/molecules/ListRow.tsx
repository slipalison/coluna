import type { ReactNode } from "react";
import { Icon } from "../atoms/Icon";

export interface ListRowProps {
  /** Conteúdo principal: nome, horário, o que a linha é. */
  children: ReactNode;
  /** O que abre a linha: um ponto de macro, um horário, uma quantidade. */
  leading?: ReactNode;
  /** O que aparece à direita: valor, unidade, estado. */
  trailing?: ReactNode;
  /**
   * Liga a marca de escolha à esquerda — o quadrado que acende quando a linha
   * está marcada. Com ela a linha vira `role="radio"`: é escolha única dentro
   * do grupo, e o leitor de tela precisa saber disso.
   */
  mark?: boolean;
  selected?: boolean;
  /** Abre e fecha conteúdo abaixo. Liga a seta e o `aria-expanded`. */
  expanded?: boolean;
  size?: "sm" | "md" | "lg";
  /** Alinha tudo pelo topo. Para quando a linha tem três andares de texto. */
  align?: "center" | "start";
  onClick?: () => void;
  className?: string | undefined;
}

/**
 * A linha repetida do sistema: refeição no diário, alimento na busca, fórmula
 * na calculadora.
 *
 * Ela NÃO desenha a própria separação. Quem separa é o `Group`, e a diferença
 * importa: uma linha que carrega o próprio `border-bottom` deixa um fio solto
 * na última posição e obriga todo consumidor a apagá-lo com `:last-child`.
 * Aqui a última linha não tem nada embaixo porque não há o que apagar.
 *
 * Com `onClick` sai um `<button>`; sem ele sai um `<div>`. Nunca um `<div>`
 * com `onClick`: um div clicável não recebe foco, não responde a Enter nem a
 * Espaço, e não aparece para o leitor de tela como algo acionável — três
 * defeitos de acessibilidade que o elemento certo resolve de graça.
 */
export function ListRow({
  children,
  leading,
  trailing,
  mark = false,
  selected = false,
  expanded,
  size = "md",
  align = "center",
  onClick,
  className,
}: ListRowProps) {
  const classe = className ? `co-list-row ${className}` : "co-list-row";
  const interativa = onClick !== undefined;

  const conteudo = (
    <>
      {mark ? (
        <span className="co-list-row__mark">
          {selected ? <Icon name="check" size={13} strokeWidth={3} /> : null}
        </span>
      ) : null}
      {leading === undefined ? null : <span className="co-list-row__leading">{leading}</span>}
      <span className="co-list-row__body">{children}</span>
      {trailing === undefined ? null : <span className="co-list-row__trailing">{trailing}</span>}
      {expanded === undefined ? null : (
        <span className="co-list-row__chevron">
          <Icon name="chevron-down" size={15} />
        </span>
      )}
    </>
  );

  const atributos = {
    className: classe,
    "data-size": size === "md" ? undefined : size,
    "data-align": align === "center" ? undefined : align,
    "data-selected": selected ? "true" : undefined,
    "data-expanded": expanded ? "true" : undefined,
  } as const;

  if (!interativa) {
    return <div {...atributos}>{conteudo}</div>;
  }

  return (
    <button
      type="button"
      {...atributos}
      data-interactive="true"
      // Com marca de escolha a linha É um rádio: o leitor de tela anuncia
      // "2 de 3, marcado", que é a informação que falta num botão comum.
      role={mark ? "radio" : undefined}
      aria-checked={mark ? selected : undefined}
      aria-expanded={expanded}
      onClick={onClick}
    >
      {conteudo}
    </button>
  );
}
