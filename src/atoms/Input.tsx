import { useId, type InputHTMLAttributes, type MouseEvent, type ReactNode } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * O campo recusou o que foi digitado.
   *
   * Liga `aria-invalid` junto com a moldura vermelha, porque a moldura sozinha
   * não é sinal (ADR-005). A MENSAGEM do erro não mora aqui — ela é do `Field`,
   * que a liga ao campo por `aria-describedby`.
   */
  invalid?: boolean;
  /**
   * `end` alinha o valor à direita, que é o certo para número: casas decimais
   * empilhadas na mesma coluna são comparáveis à distância; encostadas à
   * esquerda, não.
   */
  align?: "start" | "end";
  /** A unidade impressa dentro do campo: `kg`, `cm`, `kcal`. */
  unit?: ReactNode;
  /** Ocupa a largura do contêiner. */
  full?: boolean;
}

/**
 * O toque na moldura fora do controle — o respiro dos lados, a unidade, a lupa
 * da busca, a contagem — vai para o controle: a moldura que a pessoa vê é o
 * campo inteiro, e não só a faixa do meio onde o texto aparece (ADR-016).
 *
 * O `preventDefault` no aperto é o que segura o foco onde está: sem ele, o
 * campo já focado perde o foco no aperto e o recebe de volta no clique — o
 * anel pisca e o teclado do telefone desce e sobe.
 *
 * O toque no próprio controle segue com o navegador (o cursor, a seleção de
 * texto), e o de outro controle dentro da moldura (o × da busca) fica com ele.
 *
 * É a mesma função para o `Input` e para a `SearchField`, que a ouvem no aperto
 * e no clique da moldura: o que uma moldura de campo faz ao toque não pode
 * mudar de um campo para o outro.
 */
export function levarAoCampo(evento: MouseEvent<HTMLElement>) {
  const moldura = evento.currentTarget;
  const campo = moldura.querySelector("input");
  if (campo === null) return;
  const alvo = evento.target;
  const controle =
    alvo instanceof Element ? alvo.closest("input, button, select, textarea, a[href]") : null;
  if (controle !== null && moldura.contains(controle)) return;
  if (evento.type === "mousedown") evento.preventDefault();
  campo.focus();
}

/**
 * O campo de entrada. Só o controle — rótulo, dica e erro são do `Field`.
 *
 * Ele tem 44px de altura pelo mesmo motivo que o botão (ADR-003): é o alvo que
 * um polegar acerta. E ele é um `<input>` de verdade, não um `<div>` editável:
 * teclado numérico no celular, autopreenchimento, `Enter` que envia o
 * formulário e seleção por duplo toque vêm todos de graça, e nenhum deles volta
 * depois de ter sido jogado fora.
 *
 * A moldura inteira é o alvo, e não só o texto: o toque nos 14px de respiro dos
 * lados ou na unidade leva o foco ao campo (`levarAoCampo`), e a moldura mede
 * pelo menos 44 × 44px mesmo quando quem usa a aperta numa coluna estreita.
 *
 * A unidade é desenho E é lida: ela ganha um id próprio e entra no
 * `aria-describedby` do campo. Sem isso, quem usa leitor de tela ouve "peso" e
 * digita 83 sem saber se o campo quer quilo ou libra — e a unidade impressa na
 * tela não aparece em lugar nenhum para essa pessoa. Um `aria-describedby` que
 * venha de fora (o `Field` manda o da dica e o do erro) é PRESERVADO e somado,
 * nunca sobrescrito: sobrescrever silenciosamente é como a mensagem de erro
 * some sem ninguém notar.
 */
export function Input({
  invalid = false,
  align = "start",
  unit,
  full = false,
  className,
  ...resto
}: InputProps) {
  const idUnidade = useId();
  const { "aria-describedby": descritoPor, ...atributos } = resto;

  const descreve = [descritoPor, unit ? idUnidade : undefined].filter(Boolean).join(" ");
  const classe = className ? `co-input ${className}` : "co-input";

  return (
    // Os ouvintes de ponteiro da moldura não fazem dela um controle: o caminho
    // do teclado até o campo é o próprio campo, e quem toca na moldura já tem o
    // campo inteiro a um toque.
    <span
      className={classe}
      data-invalid={invalid ? "true" : undefined}
      data-align={align === "end" ? "end" : undefined}
      data-full={full ? "true" : undefined}
      onMouseDown={levarAoCampo}
      onClick={levarAoCampo}
    >
      <input
        className="co-input__control"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={descreve === "" ? undefined : descreve}
        {...atributos}
      />
      {unit ? (
        <span className="co-input__unit" id={idUnidade}>
          {unit}
        </span>
      ) : null}
    </span>
  );
}
