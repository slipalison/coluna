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
   * Liga a marca de escolha à esquerda, e diz QUANTAS a pessoa pode marcar.
   *
   * - `"single"` (ou `true`): escolha uma. A linha vira `role="radio"` e a
   *   marca sai **redonda**.
   * - `"multiple"`: marque quantas quiser. A linha vira `role="checkbox"` e a
   *   marca sai **quadrada**.
   *
   * A forma não é enfeite — ela carrega a informação, e é por isso que ela
   * desobedece ao ADR-004 (ver ADR-007). Redondo e quadrado são a única coisa
   * que separa as duas perguntas antes de a pessoa tocar em qualquer lugar;
   * quem enxerga lê a regra na forma, e quem usa leitor de tela lê no `role`.
   * As duas leituras têm de dizer a mesma coisa.
   */
  mark?: boolean | "single" | "multiple";
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

  // `mark` chegou booleano antes de saber contar. `true` continua querendo
  // dizer escolha única — que era o `role` que ele já entregava —, e agora a
  // forma passa a concordar com ele.
  const marca = mark === true ? "single" : mark === false ? undefined : mark;

  const conteudo = (
    <>
      {marca === undefined ? null : (
        <span className="co-list-row__mark" data-mark={marca}>
          {selected ? <Icon name="check" size={13} strokeWidth={3} /> : null}
        </span>
      )}
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
      // Com marca de escolha a linha É o controle, e não um botão que parece
      // marcado: o leitor de tela anuncia "2 de 3, marcado". Qual dos dois
      // papéis sai daqui é a MESMA pergunta que decide a forma da marca —
      // `role` e `border-radius` não podem divergir, senão a tela diz uma
      // coisa a quem enxerga e outra a quem escuta.
      role={marca === undefined ? undefined : marca === "single" ? "radio" : "checkbox"}
      aria-checked={marca === undefined ? undefined : selected}
      aria-expanded={expanded}
      onClick={onClick}
    >
      {conteudo}
    </button>
  );
}
