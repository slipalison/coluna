import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { Text } from "../atoms/Text";

/**
 * Onde o fio entre as linhas começa.
 *
 * O valor acompanha o que existe à esquerda DENTRO da linha, para o corte cair
 * alinhado com o texto e não com a borda do cartão:
 *
 *   text  20  a linha começa no texto (o caso comum).
 *   dot   42  a linha começa com um ponto de macro (20 + 10 + 12 de folga).
 *   mark  52  a linha começa com uma marca de escolha (20 + 20 + 12).
 *   none   0  o fio corta o cartão de ponta a ponta.
 */
export type GroupInset = "text" | "dot" | "mark" | "none";

export interface GroupProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** O versalete acima da caixa. Fica FORA dela — dentro viraria mais uma linha. */
  label?: ReactNode;
  /** O que aparece na mesma altura do rótulo, à direita. Um total, uma contagem. */
  labelTrailing?: ReactNode;
  /** A nota abaixo da caixa, alinhada pela calha. */
  note?: ReactNode;
  inset?: GroupInset;
  elevation?: "flat" | "sunken" | "none";
  children?: ReactNode;
}

/**
 * A lista agrupada: um contêiner arredondado que junta linhas irmãs e as
 * separa por um fio recuado.
 *
 * É a estrutura central deste sistema, e ela existe para tirar borda da tela.
 * Antes cada linha carregava um `border-bottom` e cada cartão um contorno; o
 * resultado era uma tela de caixas dentro de caixas, em que tudo tinha o mesmo
 * peso visual e nada guiava o olho. Aqui a continuidade é o fundo do grupo, o
 * corte é um fio de 1px que começa depois do recuo, e a hierarquia volta a ser
 * feita de peso e cor — que é o que ela deveria ser desde o começo.
 *
 * O grupo desenha os fios sozinho, por CSS, entre cada filho e o seguinte.
 * Duas consequências que vale conhecer:
 *
 *   - Nenhum fio sobra na última linha, e a lista pode vir de `.map()` sem
 *     intercalar separador nenhum.
 *   - Coisas que devem ficar GRUDADAS — uma linha e o painel que abre embaixo
 *     dela — vão num `<div>` só, como um filho. É a forma de dizer ao grupo
 *     "isto aqui é um item, não dois".
 */
export function Group({
  as: Elemento = "div",
  label,
  labelTrailing,
  note,
  inset = "text",
  elevation = "flat",
  className,
  children,
  ...resto
}: GroupProps) {
  const caixa = (
    <Elemento
      className={className ? `co-group ${className}` : "co-group"}
      data-inset={inset === "text" ? undefined : inset}
      data-elevation={elevation === "flat" ? undefined : elevation}
      {...resto}
    >
      {children}
    </Elemento>
  );

  if (label === undefined && note === undefined) return caixa;

  return (
    <div>
      {label === undefined ? null : (
        <div
          className="co-group__label"
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "var(--co-space-12)",
          }}
        >
          <Text variant="label">{label}</Text>
          {labelTrailing === undefined ? null : (
            <Text variant="caption" tone="subtle" numeric>
              {labelTrailing}
            </Text>
          )}
        </div>
      )}
      {caixa}
      {note === undefined ? null : (
        <Text className="co-group__note" variant="caption" tone="subtle" style={{ textWrap: "pretty" }}>
          {note}
        </Text>
      )}
    </div>
  );
}
