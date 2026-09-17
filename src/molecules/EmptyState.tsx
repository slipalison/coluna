import type { ReactNode } from "react";
import { Icon, type IconName } from "../atoms/Icon";
import { Text } from "../atoms/Text";

export interface EmptyStateProps {
  icon?: IconName;
  /** O que está vazio, dito sem culpar ninguém. */
  title: string;
  /** Por que está vazio, ou o que preenche. Uma frase. */
  children?: ReactNode;
  /** A ação que tira a tela daqui. Um `Button`, e só um. */
  action?: ReactNode;
  className?: string | undefined;
}

/**
 * A região que ainda não tem dado.
 *
 * Não é um `Notice`, e a diferença decide onde cada um entra: o aviso mora DENTRO
 * de uma tela que já tem conteúdo e fala sobre ele; o vazio É a tela naquele
 * momento. Um aviso ocupando a área inteira vira alarme; um vazio encaixotado
 * num aviso vira desculpa.
 *
 * Três recusas, todas vindas do desenho do Basalto:
 *
 *   - O texto nunca cobra. "Nada registrado hoje" é estado; "você ainda não
 *     registrou nada hoje" é dedo na cara pela mesma informação.
 *   - Nada vermelho. Vazio não é erro — o gasto medido só nasce no 14º dia, e
 *     os treze primeiros são o produto funcionando como prometido.
 *   - Uma ação, no máximo. Duas ações numa tela sem conteúdo é um menu
 *     disfarçado de convite.
 */
export function EmptyState({ icon, title, children, action, className }: EmptyStateProps) {
  const classe = className ? `co-empty ${className}` : "co-empty";
  return (
    <div className={classe}>
      {icon ? (
        <span className="co-empty__icon">
          <Icon name={icon} size={22} />
        </span>
      ) : null}
      <Text variant="headline" weight="semibold" style={{ textWrap: "balance" }}>
        {title}
      </Text>
      {children ? (
        <Text variant="footnote" tone="muted" style={{ textWrap: "pretty" }}>
          {children}
        </Text>
      ) : null}
      {action ? <div className="co-empty__action">{action}</div> : null}
    </div>
  );
}
