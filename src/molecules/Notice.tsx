import type { ReactNode } from "react";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";

export interface NoticeProps {
  title: string;
  children: ReactNode;
  tone?: "accent" | "status";
  /**
   * `polite` (padrão) só é lido quando o leitor de tela terminar o que estava
   * falando. `off` para um aviso que já está na tela desde o carregamento e
   * não precisa interromper nada.
   */
  live?: "polite" | "off";
  className?: string | undefined;
}

/**
 * Aviso.
 *
 * Este componente não tem variante de erro, não tem fundo vermelho e não tem
 * botão que precise ser apertado para sumir — e isso é decisão de produto, não
 * lacuna: aqui aviso INFORMA, nunca bloqueia. Quando um número sai do que a
 * literatura sustenta, o app diz o que mudou e por quê, e depois registra a
 * escolha da pessoa do mesmo jeito.
 *
 * Um erro de verdade — entrada sem significado — não é um aviso: é uma
 * mensagem junto do campo que a produziu.
 */
export function Notice({ title, children, tone = "accent", live = "polite", className }: NoticeProps) {
  const classe = className ? `co-notice ${className}` : "co-notice";
  return (
    <div className={classe} data-tone={tone} role="status" aria-live={live}>
      <span className="co-notice__icon">
        <Icon name="info" size={17} />
      </span>
      <div className="co-notice__body">
        <Text variant="callout" weight="semibold">
          {title}
        </Text>
        <Text variant="footnote" tone="secondary" style={{ textWrap: "pretty" }}>
          {children}
        </Text>
      </div>
    </div>
  );
}
