import { Dot } from "../atoms/Dot";
import { Slat } from "../atoms/Slat";
import { Text } from "../atoms/Text";

export type MacroKind = "protein" | "carb" | "fat";

export interface MacroBarProps {
  /** "Proteína", "Carboidrato", "Gordura" — ou qualquer par nome/quantidade. */
  name: string;
  value: number;
  target: number;
  unit?: string;
  /**
   * Qual macro é, e daí sai a cor do ponto E do preenchimento da barra. É um
   * enum, e não uma cor: o consumidor não escolhe o tom, porque proteína tem
   * que ser da mesma cor em todas as telas do aplicativo.
   */
  kind?: MacroKind;
  /** Esconde a barra e deixa só ponto, nome e número. */
  bar?: boolean;
  className?: string | undefined;
}

/**
 * Ponto, nome e número — os três, sempre. A barra é opcional; o texto não é.
 *
 * É aqui que a regra "cor nunca sozinha" aparece em código (ADR-005). O ponto
 * colorido é um atalho para quem lê a tela de relance, e ele nunca carrega a
 * informação sozinho: o nome do macro e a quantidade estão do lado, em texto,
 * e o `Dot` sai `aria-hidden` justamente porque não tem nada a acrescentar.
 *
 * A barra NÃO é grampeada em 100% por acidente: passar do alvo é informação,
 * não falha. O componente satura o desenho, mantém o número verdadeiro ao lado
 * e não muda de cor para vermelho — este sistema não repreende quem comeu mais
 * do que planejou.
 */
export function MacroBar({
  name,
  value,
  target,
  unit = "g",
  kind = "protein",
  bar = true,
  className,
}: MacroBarProps) {
  const fracao = target > 0 ? value / target : 0;
  const classe = className ? `co-macro ${className}` : "co-macro";

  return (
    <div className={classe}>
      <Dot tone={kind} />
      <div className="co-macro__body">
        <div className="co-macro__head">
          <Text variant="body">{name}</Text>
          <Text variant="callout" tone="secondary" numeric>
            {value} de {target} {unit}
          </Text>
        </div>
        {bar ? (
          <Slat
            value={fracao}
            size="sm"
            pattern="solid"
            tone={kind}
            label={`${name}: ${value} de ${target} ${unit}`}
          />
        ) : null}
      </div>
    </div>
  );
}
