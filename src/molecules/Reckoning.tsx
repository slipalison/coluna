import type { ReactNode } from "react";
import { Text } from "../atoms/Text";

export interface ReckoningLine {
  /** O que a parcela é: "Meta do dia", "Alimentos registrados". */
  label: ReactNode;
  /**
   * A conta que produziu o número, escrita por extenso: "370 + 21,6 × 65,91",
   * "2.312 × 62%". É o que transforma o resultado em algo conferível.
   */
  expression?: ReactNode;
  value: ReactNode;
  /**
   * A linha do resultado: ganha um fio acima e peso maior. Uma só por conta —
   * duas totais não são uma conta, são duas.
   */
  total?: boolean;
}

export interface ReckoningProps {
  lines: readonly ReckoningLine[];
  /** A nota abaixo da conta: o arredondamento, a folga, o que sobrou. */
  note?: ReactNode;
  className?: string | undefined;
}

/**
 * A conta aberta.
 *
 * Este componente carrega a premissa do produto inteiro — a pessoa informa, o
 * app calcula — e a carrega como DESENHO, não como frase na tela de ajuda.
 * Cada parcela numa linha, a expressão que a produziu embaixo do rótulo, e o
 * resultado separado por um fio, do jeito que uma conta no papel termina.
 *
 * Um número grande sozinho é um veredito, e veredito é o que este produto
 * existe para não dar. A mesma conta aberta é um argumento que dá para
 * conferir na calculadora do celular — e é exatamente para ser conferida que
 * ela aparece.
 *
 * Daí uma regra que parece detalhe e não é: quando o número mostrado é
 * arredondado, a expressão mostra a casa decimal. `1.433 + 937 = 2.371` não
 * fecha para quem confere; `1.433,4 + 937,5 = 2.370,9 → 2.371` fecha. Num app
 * cujo diferencial é admitir o que não sabe, mentir no arredondamento seria o
 * pior lugar para começar.
 */
export function Reckoning({ lines, note, className }: ReckoningProps) {
  const classe = className ? `co-reckoning ${className}` : "co-reckoning";
  return (
    <div className={classe}>
      {lines.map((linha, indice) => (
        <div
          // A ordem das parcelas é a identidade delas: trocar duas linhas de
          // lugar muda a conta, então o índice é chave estável aqui.
          key={indice}
          className="co-reckoning__line"
          data-total={linha.total ? "true" : undefined}
        >
          <div className="co-reckoning__label">
            <Text
              variant="subhead"
              tone={linha.total ? "default" : "secondary"}
              weight={linha.total ? "semibold" : "regular"}
            >
              {linha.label}
            </Text>
            {linha.expression === undefined ? null : (
              <Text variant="caption" tone="subtle" numeric>
                {linha.expression}
              </Text>
            )}
          </div>
          <Text
            variant={linha.total ? "body" : "subhead"}
            tone={linha.total ? "default" : "secondary"}
            weight={linha.total ? "semibold" : "regular"}
            numeric
          >
            {linha.value}
          </Text>
        </div>
      ))}
      {note === undefined ? null : (
        <Text variant="caption" tone="subtle" style={{ textWrap: "pretty" }}>
          {note}
        </Text>
      )}
    </div>
  );
}
