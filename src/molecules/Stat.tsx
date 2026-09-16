import type { ReactNode } from "react";
import { Text } from "../atoms/Text";

export interface StatProps {
  /** O versalete acima do número: "Restante hoje", "Gasto de hoje". */
  label: string;
  value: ReactNode;
  /** Unidade ao lado do número, na linha de base dele. */
  unit?: string;
  /**
   * A linha abaixo. É aqui que mora a honestidade do número: de onde ele veio,
   * qual o alvo, o que ainda falta para ele ficar confiável.
   */
  caption?: ReactNode;
  /** Tamanho do algarismo. `hero` é um por tela. */
  size?: "hero" | "lg" | "md";
  className?: string | undefined;
}

const TAMANHO: Record<NonNullable<StatProps["size"]>, string> = {
  hero: "var(--co-text-78)",
  lg: "var(--co-text-46)",
  md: "var(--co-text-34)",
};

/**
 * Rótulo, número e explicação — nesta ordem, e sempre com a explicação.
 *
 * A `caption` é opcional na assinatura e obrigatória na prática: um número
 * grande sem procedência é exatamente o que este produto existe para não
 * fazer. Quando não há o que dizer, o número provavelmente não merece ser
 * grande.
 */
export function Stat({ label, value, unit, caption, size = "lg", className }: StatProps) {
  const classe = className ? `co-stat ${className}` : "co-stat";
  return (
    <div className={classe}>
      <Text variant="label">{label}</Text>
      <div className="co-stat__value">
        <Text variant="numeral" style={{ fontSize: TAMANHO[size] }}>
          {value}
        </Text>
        {unit ? (
          <Text variant="body" tone="secondary">
            {unit}
          </Text>
        ) : null}
      </div>
      {caption ? (
        <Text variant="caption" tone="secondary">
          {caption}
        </Text>
      ) : null}
    </div>
  );
}
