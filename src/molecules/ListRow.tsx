import type { ReactNode } from "react";
import { Icon } from "../atoms/Icon";

export interface ListRowProps {
  /** Conteúdo principal: nome, horário, o que a linha é. */
  children: ReactNode;
  /** O que aparece à direita: valor, unidade, estado. */
  trailing?: ReactNode;
  /** Liga a barra vertical à esquerda. Ela acende quando a linha está marcada. */
  marker?: boolean;
  selected?: boolean;
  /** Abre e fecha conteúdo abaixo. Liga a seta e o `aria-expanded`. */
  expanded?: boolean;
  onClick?: () => void;
  className?: string | undefined;
}

/**
 * A linha repetida do sistema: refeição no diário, alimento na busca, seção no
 * menu.
 *
 * Com `onClick` sai um `<button>`; sem ele sai um `<div>`. Nunca um `<div>`
 * com `onClick`: um div clicável não recebe foco, não responde a Enter nem a
 * Espaço, e não aparece para o leitor de tela como algo acionável — três
 * defeitos de acessibilidade que o elemento certo resolve de graça.
 */
export function ListRow({
  children,
  trailing,
  marker = false,
  selected = false,
  expanded,
  onClick,
  className,
}: ListRowProps) {
  const classe = className ? `co-list-row ${className}` : "co-list-row";
  const interativa = onClick !== undefined;

  const conteudo = (
    <>
      {marker ? <span className="co-list-row__marker" /> : null}
      <span className="co-list-row__body">{children}</span>
      {trailing ? <span className="co-list-row__trailing">{trailing}</span> : null}
      {expanded === undefined ? null : (
        <span className="co-list-row__chevron">
          <Icon name="chevron-down" size={16} />
        </span>
      )}
    </>
  );

  if (!interativa) {
    return (
      <div
        className={classe}
        data-selected={selected ? "true" : undefined}
        data-expanded={expanded ? "true" : undefined}
      >
        {conteudo}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={classe}
      data-interactive="true"
      data-selected={selected ? "true" : undefined}
      data-expanded={expanded ? "true" : undefined}
      aria-expanded={expanded}
      onClick={onClick}
    >
      {conteudo}
    </button>
  );
}
