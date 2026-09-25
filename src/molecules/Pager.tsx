import { Icon } from "../atoms/Icon";
import { VisuallyHidden } from "../atoms/VisuallyHidden";

export interface PagerProps {
  /** O que se pagina: "Dia", "Mês". Vira o nome do grupo — dois botões soltos não dizem o que andam. */
  label: string;
  /** O nome do botão de voltar, inteiro: "Dia anterior", "Mês anterior". */
  previousLabel: string;
  /** O nome do botão de avançar, inteiro: "Próximo dia", "Próximo mês". */
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  /** Há para onde voltar. O começo do registro é a ponta da esquerda. */
  hasPrevious?: boolean;
  /**
   * Há para onde avançar. Hoje é a ponta da direita: o dia de amanhã não tem
   * registro para abrir, e um botão que leva a uma tela vazia de propósito é
   * um botão que mente.
   */
  hasNext?: boolean;
  /**
   * O período que está na tela, dito por extenso: "setembro de 2026",
   * "quarta, 16 de setembro". É anunciado quando muda.
   *
   * Sem ele, quem usa leitor de tela aperta "Próximo mês" e não ouve nada — o
   * título mudou lá em cima, fora do foco, e a pessoa tem de sair do botão
   * para descobrir onde está.
   */
  current?: string;
  className?: string | undefined;
}

/**
 * Anterior e próximo: o dia no diário, o mês no histórico.
 *
 * O par mora ao lado do título que ele troca, e não no rodapé da lista: o
 * título diz ONDE a pessoa está, e o paginador é o que muda isso — separar os
 * dois obriga o olho a ir e voltar a cada toque.
 *
 * Os botões têm 46px pelo mesmo motivo dos do `Stepper`: andam em par colado e
 * fazem coisas opostas, e com o alvo no limite exato o dedo que erra por 2px
 * volta um mês em vez de avançar.
 *
 * Na ponta, o botão fica `aria-disabled` e NÃO `disabled`. É a diferença entre
 * o foco ficar onde a pessoa deixou e o foco cair no começo da página: quem
 * avança até hoje apertando Enter tem o botão desligado debaixo do próprio foco
 * no último toque, e um `disabled` joga esse foco fora sem avisar.
 */
export function Pager({
  label,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
  hasPrevious = true,
  hasNext = true,
  current,
  className,
}: Readonly<PagerProps>) {
  const classe = className ? `co-pager ${className}` : "co-pager";

  return (
    // `<fieldset>`, e não `<div role="group">`: é o elemento que já nasce
    // grupo, e o papel escrito à mão é o que some no primeiro ajuste de marcação.
    <fieldset className={classe} aria-label={label}>
      <button
        type="button"
        className="co-pager__button"
        aria-label={previousLabel}
        title={previousLabel}
        aria-disabled={hasPrevious ? undefined : true}
        onClick={hasPrevious ? onPrevious : undefined}
      >
        <Icon name="chevron-left" size={18} />
      </button>
      <button
        type="button"
        className="co-pager__button"
        aria-label={nextLabel}
        title={nextLabel}
        aria-disabled={hasNext ? undefined : true}
        onClick={hasNext ? onNext : undefined}
      >
        <Icon name="chevron-right" size={18} />
      </button>
      {current === undefined ? null : (
        <VisuallyHidden aria-live="polite" aria-atomic="true">
          {current}
        </VisuallyHidden>
      )}
    </fieldset>
  );
}
