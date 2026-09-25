import type { ReactNode } from "react";
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
  /**
   * `stacked` (padrão) põe nome e número numa linha e a barra embaixo — o
   * cartão estreito do telefone e da coluna lateral.
   *
   * `inline` põe tudo numa linha só: ponto, nome, barra, número. É a forma
   * das colunas largas do desktop, e ela existe porque ali a barra empilhada
   * vira um fio de 500px com o número perdido na outra ponta. Em linha, as
   * barras de um grupo começam e terminam nos mesmos pontos, e a comparação
   * entre elas é o que se lê primeiro.
   *
   * As colunas se alinham entre as linhas do grupo pelas variáveis
   * `--co-macro-name-width` e `--co-macro-figure-width`, que se escrevem UMA
   * vez no `Group` e as linhas herdam.
   */
  layout?: "stacked" | "inline";
  /**
   * O número à direita, quando ele não é "value de target unit".
   *
   * A barra continua sendo `value / target`; muda só o que se lê. É o caso das
   * macros da meta, em que a barra mostra a fatia da energia do dia e o número
   * mostra os gramas — "135 g", com a barra em 28%.
   */
  valueText?: string;
  /**
   * A conta que produziu o número, embaixo dele: "135 × 4 = 540". O mesmo
   * nome e o mesmo papel da `expression` do `Reckoning` — o que transforma o
   * número em algo que se confere.
   */
  expression?: ReactNode;
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
  layout = "stacked",
  valueText,
  expression,
  className,
}: MacroBarProps) {
  const fracao = target > 0 ? value / target : 0;
  const classe = className ? `co-macro ${className}` : "co-macro";
  const texto = valueText ?? `${value} de ${target} ${unit}`;

  const barra = bar ? (
    <Slat
      className="co-macro__bar"
      value={fracao}
      size="sm"
      pattern="solid"
      tone={kind}
      label={`${name}: ${texto}`}
    />
  ) : null;

  const conta =
    expression === undefined ? null : (
      <Text variant="caption" tone="subtle" numeric>
        {expression}
      </Text>
    );

  if (layout === "inline") {
    return (
      <div className={classe} data-layout="inline">
        <Dot tone={kind} />
        <Text className="co-macro__name" variant="callout">
          {name}
        </Text>
        {barra}
        <div className="co-macro__figure">
          <Text variant="callout" numeric>
            {texto}
          </Text>
          {conta}
        </div>
      </div>
    );
  }

  return (
    <div className={classe}>
      <Dot tone={kind} />
      <div className="co-macro__body">
        <div className="co-macro__head">
          <Text variant="body">{name}</Text>
          <Text variant="callout" tone="secondary" numeric>
            {texto}
          </Text>
        </div>
        {barra}
        {conta}
      </div>
    </div>
  );
}
