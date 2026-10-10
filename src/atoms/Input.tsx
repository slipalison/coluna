import { useId, type InputHTMLAttributes, type ReactNode } from "react";

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

/** O que `reservarFim` devolve quando não mediu nada: não há o que desfazer. */
const semLimpeza = () => undefined;

/**
 * A largura do que fica por cima do fim do controle — a unidade do `Input`, a
 * contagem e a tecla da `SearchField` —, escrita na moldura como
 * `--co-field-end`, que é o respiro do fim do controle na folha.
 *
 * O controle ocupa a moldura inteira, para o toque em qualquer ponto dela ser
 * o toque no campo, sem tratador de clique nenhum: o navegador entrega o toque
 * ao controle porque é ele que está ali (ADR-016). O que fica por cima dele não
 * recebe o toque (`pointer-events: none`), mas o texto não pode correr por
 * baixo — e a largura de "kg", de "6 resultados" ou de "Buscando…" a folha não
 * sabe de antemão. Esta função só mede: o toque e o teclado não passam por ela.
 *
 * É a `ref` do elemento do fim. Mede ao montar, de novo a cada vez que ele muda
 * de tamanho (o texto da contagem, a fonte que chega, a tecla que sai de cena),
 * e devolve a limpeza que o React 19 chama quando ele sai. Sem largura, a
 * propriedade sai, e o controle volta ao respiro da moldura.
 */
export function reservarFim(fim: HTMLElement | null): () => void {
  const moldura = fim?.parentElement;
  if (!fim || !moldura) return semLimpeza;

  const medir = () => {
    const largura = fim.getBoundingClientRect().width;
    if (largura > 0) moldura.style.setProperty("--co-field-end", `${largura}px`);
    else moldura.style.removeProperty("--co-field-end");
  };

  medir();
  const observador = new ResizeObserver(medir);
  observador.observe(fim);
  return () => {
    observador.disconnect();
    moldura.style.removeProperty("--co-field-end");
  };
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
 * A moldura inteira é o alvo, e não só o texto: o controle a ocupa inteira — os
 * 14px de respiro dos lados são dele —, e a unidade fica por cima do respiro do
 * fim sem receber o toque. O toque em qualquer ponto cai no controle pelo
 * navegador, e a moldura mede pelo menos 44 × 44px mesmo quando quem usa a
 * aperta numa coluna estreita.
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
    <span
      className={classe}
      data-invalid={invalid ? "true" : undefined}
      data-align={align === "end" ? "end" : undefined}
      data-full={full ? "true" : undefined}
    >
      <input
        className="co-input__control"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={descreve === "" ? undefined : descreve}
        {...atributos}
      />
      {unit ? (
        <span className="co-input__unit" id={idUnidade} ref={reservarFim}>
          {unit}
        </span>
      ) : null}
    </span>
  );
}
