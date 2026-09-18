import type { ReactNode } from "react";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";

export interface DisclosureProps {
  /** O convite. O padrão é a pergunta que a pessoa faria. */
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  className?: string | undefined;
}

/**
 * A explicação que fica guardada até alguém pedir.
 *
 * Ela existe por causa de um defeito medido no desenho: quase todo cartão
 * terminava se explicando em letra miúda. Cada frase, isolada, era boa; juntas
 * viravam um professor que não para de falar. A regra que saiu dali é UMA
 * EXPLICAÇÃO POR TELA — a que justifica uma decisão de produto com a qual a
 * pessoa pode discordar fica visível; o resto vem para cá.
 *
 * O teste para saber o que guardar aqui: se a frase explica algo que a tela já
 * mostra, ela não precisa existir nem aberta nem fechada.
 *
 * É `<details>`/`<summary>` do navegador, e não um acordeão de React com
 * `aria-expanded` escrito à mão. O elemento nativo já vem com estado, teclado,
 * anúncio no leitor de tela, busca da página encontrando o texto fechado e
 * impressão abrindo tudo. Reimplementar isso é assinar a manutenção de quatro
 * comportamentos para ganhar zero.
 */
export function Disclosure({
  summary = "por quê?",
  children,
  defaultOpen = false,
  onToggle,
  className,
}: DisclosureProps) {
  const classe = className ? `co-disclosure ${className}` : "co-disclosure";
  return (
    <details
      className={classe}
      open={defaultOpen}
      onToggle={(evento) => onToggle?.(evento.currentTarget.open)}
    >
      <summary className="co-disclosure__summary">
        <Icon className="co-disclosure__chevron" name="chevron-down" size={15} />
        <Text as="span" variant="footnote" tone="secondary">
          {summary}
        </Text>
      </summary>
      <div className="co-disclosure__body">
        <Text variant="footnote" tone="muted" style={{ textWrap: "pretty" }}>
          {children}
        </Text>
      </div>
    </details>
  );
}
