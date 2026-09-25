import { useId, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { Icon } from "../atoms/Icon";
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
  /**
   * O que o grupo recusou — "Escolha como o percentual foi medido." Sai embaixo
   * da nota, vermelho E com ícone, como o erro do `Field`: cor sozinha não é
   * sinal (ADR-005).
   */
  error?: ReactNode;
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
  error,
  inset = "text",
  elevation = "flat",
  className,
  children,
  ...resto
}: GroupProps) {
  const base = useId();
  const idRotulo = `${base}-rotulo`;
  const idNota = `${base}-nota`;
  const idErro = `${base}-erro`;

  // Com `role`, a caixa é um controle (um `radiogroup`, um `group` de campos),
  // e o rótulo, a nota e o erro que o grupo desenha são o nome e a descrição
  // dele. Amarrar aqui é o que o `Field` faz com o campo: sem isso, cada tela
  // repete três `useId` e dois `aria-*`, e a primeira que esquecer um sai muda
  // no leitor de tela. Sem `role` a caixa é só um contêiner — `aria-labelledby`
  // num `div` sem papel é proibido pelo ARIA —, e nada é amarrado.
  const {
    "aria-labelledby": rotuladoPor,
    "aria-describedby": descritoPor,
    "aria-invalid": invalido,
    ...atributos
  } = resto;
  const controle = atributos.role !== undefined;
  const descreve = [
    descritoPor,
    controle && note !== undefined ? idNota : undefined,
    controle && error !== undefined ? idErro : undefined,
  ]
    .filter(Boolean)
    .join(" ");
  const nomeado =
    rotuladoPor ??
    (controle && label !== undefined && atributos["aria-label"] === undefined ? idRotulo : undefined);

  const caixa = (
    <Elemento
      className={className ? `co-group ${className}` : "co-group"}
      data-inset={inset === "text" ? undefined : inset}
      data-elevation={elevation === "flat" ? undefined : elevation}
      aria-labelledby={nomeado}
      aria-describedby={descreve === "" ? undefined : descreve}
      aria-invalid={invalido ?? (controle && error !== undefined ? true : undefined)}
      {...atributos}
    >
      {children}
    </Elemento>
  );

  if (label === undefined && note === undefined && error === undefined) return caixa;

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
          <Text variant="label" id={idRotulo}>
            {label}
          </Text>
          {labelTrailing === undefined ? null : (
            <Text variant="caption" tone="subtle" numeric>
              {labelTrailing}
            </Text>
          )}
        </div>
      )}
      {caixa}
      {note === undefined ? null : (
        <Text
          id={idNota}
          className="co-group__note"
          variant="caption"
          tone="subtle"
          style={{ textWrap: "pretty" }}
        >
          {note}
        </Text>
      )}
      {error === undefined ? null : (
        // `polite`, como no `Field`: o erro que chega enquanto a pessoa ainda
        // escolhe não corta o que o leitor de tela está dizendo.
        <p className="co-group__error" id={idErro} aria-live="polite">
          <Icon className="co-group__error-icon" name="info" size={15} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
