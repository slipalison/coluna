import type { ReactNode } from "react";
import { Icon, type IconName } from "../atoms/Icon";
import { Text } from "../atoms/Text";

export interface ScreenHeaderProps {
  title: ReactNode;
  /** A linha embaixo do título: a data, a contagem, o que a tela cobre. */
  subtitle?: ReactNode;
  /** Uma ação, e uma só. Duas já são uma barra de ferramentas, e isso é outro componente. */
  action?: { icon: IconName; label: string; onClick: () => void };
  /** O elemento do título. `h1` quando a tela é a página; `h2` dentro de outra. */
  as?: "h1" | "h2";
  className?: string | undefined;
}

/**
 * O título grande de uma tela: serifa de 36px, data embaixo, uma ação à direita.
 *
 * O título é grande porque ele diz ONDE a pessoa está, e num aplicativo que
 * abre sempre na mesma tela isso some rápido se o nome do lugar tiver o mesmo
 * tamanho do resto. Ele não é `position: sticky`: encolher um título de 36 para
 * 17 durante a rolagem é bonito na demonstração e custa um reflow por quadro
 * num aparelho lento.
 *
 * A ação carrega `aria-label` obrigatório porque ela é só um ícone — e um
 * botão de ícone sem nome é um botão mudo.
 */
export function ScreenHeader({
  title,
  subtitle,
  action,
  as = "h1",
  className,
}: ScreenHeaderProps) {
  const classe = className ? `co-screen-header ${className}` : "co-screen-header";
  return (
    <header className={classe}>
      <div className="co-screen-header__body">
        <Text as={as} variant="title-lg">
          {title}
        </Text>
        {subtitle === undefined ? null : (
          <Text variant="subhead" tone="subtle">
            {subtitle}
          </Text>
        )}
      </div>
      {action === undefined ? null : (
        <button
          type="button"
          className="co-screen-header__action"
          aria-label={action.label}
          onClick={action.onClick}
        >
          <Icon name={action.icon} size={20} />
        </button>
      )}
    </header>
  );
}
