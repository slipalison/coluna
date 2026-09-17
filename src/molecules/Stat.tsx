import type { ReactNode } from "react";
import { Text } from "../atoms/Text";

export interface StatProps {
  /** O versalete acima do número: "Restante", "Gasto de hoje". */
  label: string;
  value: ReactNode;
  /** Unidade ao lado do número, na linha de base dele. */
  unit?: string;
  /**
   * O que aparece no alto, à direita: um selo com a procedência do número
   * ("62% medido"), a proporção da meta.
   */
  trailing?: ReactNode;
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
  hero: "var(--co-text-68)",
  lg: "var(--co-text-46)",
  md: "var(--co-text-36)",
};

/**
 * Rótulo, número e explicação — nesta ordem, e sempre com a explicação.
 *
 * A `caption` é opcional na assinatura e obrigatória na prática: um número
 * grande sem procedência é exatamente o que este produto existe para não
 * fazer. Quando não há o que dizer, o número provavelmente não merece ser
 * grande — e quando há uma conta atrás dele, o lugar dela é um `Reckoning`
 * logo abaixo, não uma frase.
 */
export function Stat({ label, value, unit, trailing, caption, size = "lg", className }: StatProps) {
  const classe = className ? `co-stat ${className}` : "co-stat";
  return (
    <div className={classe}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--co-space-16)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--co-space-6)" }}>
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
        </div>
        {trailing === undefined ? null : trailing}
      </div>
      {caption ? (
        <Text variant="footnote" tone="secondary" style={{ textWrap: "pretty" }}>
          {caption}
        </Text>
      ) : null}
    </div>
  );
}
