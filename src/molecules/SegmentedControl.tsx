import { useId, useRef, type KeyboardEvent } from "react";
import { Text } from "../atoms/Text";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  /** Obrigatório: um grupo de escolha sem nome é mudo no leitor de tela. */
  label: string;
  /**
   * Mostra o `label` em cima do grupo, visível, com o estilo do rótulo do
   * `Field` (o versalete). O nome do grupo passa a ser esse texto, por
   * `aria-labelledby`, e não um `aria-label` invisível: o que se vê é o que o
   * leitor de tela lê (WCAG 2.5.3). Sem ele (o padrão), o nome é o `label`
   * invisível, para quando o título da seção já diz o que se escolhe.
   */
  legend?: boolean;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  full?: boolean;
  className?: string | undefined;
}

/**
 * Escolha única entre poucas opções visíveis ao mesmo tempo.
 *
 * É `radiogroup`, e não um punhado de botões: com `role="radio"` o leitor de
 * tela anuncia "2 de 4, marcado", que é a informação que falta num grupo de
 * botões comuns.
 *
 * A navegação é por SETA, não por Tab, com tabindex itinerante — um grupo de
 * seis opções que exige seis Tabs para atravessar é um grupo que ninguém
 * atravessa. É o comportamento que o padrão WAI-ARIA descreve para este
 * controle, e o que o usuário de teclado já espera de um rádio.
 */
export function SegmentedControl<T extends string>({
  label,
  legend = false,
  options,
  value,
  onChange,
  full = false,
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idLegenda = useId();
  const classe = className ? `co-segmented ${className}` : "co-segmented";

  // Onde o tabindex itinerante pousa quando NENHUMA opção casa o `value`.
  //
  // Sem isto o grupo inteiro fica em `-1` e desaparece da ordem do Tab: quem
  // chega pelo teclado passa por cima dele e não tem como responder. O tipo de
  // `value` não deixa esse estado ser pedido de propósito, mas ele chega
  // sozinho — um valor que veio do servidor e não está na lista, uma opção
  // removida, um `"" as T`. É o que o WAI-ARIA manda para o grupo sem resposta:
  // a primeira opção segura o Tab, e as setas cuidam do resto.
  const escolhida = options.findIndex((opcao) => opcao.value === value);
  const noTab = escolhida === -1 ? 0 : escolhida;

  function mover(indice: number, passo: number) {
    const total = options.length;
    if (total === 0) return;
    // Circular: da última a seta para a direita volta à primeira. Parar na
    // ponta obriga a voltar apertando a seta contrária N vezes.
    const proximo = (indice + passo + total) % total;
    const opcao = options[proximo];
    if (!opcao) return;
    onChange(opcao.value);
    refs.current[proximo]?.focus();
  }

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    switch (evento.key) {
      case "ArrowRight":
      case "ArrowDown":
        evento.preventDefault();
        mover(indice, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        evento.preventDefault();
        mover(indice, -1);
        break;
      case "Home":
        evento.preventDefault();
        mover(-1, 1);
        break;
      case "End":
        evento.preventDefault();
        mover(0, -1);
        break;
      default:
        break;
    }
  }

  const grupo = (
    <div
      className={classe}
      role="radiogroup"
      aria-label={legend ? undefined : label}
      aria-labelledby={legend ? idLegenda : undefined}
      data-full={full ? "true" : undefined}
    >
      {options.map((opcao, indice) => {
        const marcado = opcao.value === value;
        return (
          <button
            key={opcao.value}
            ref={(no) => {
              refs.current[indice] = no;
            }}
            type="button"
            role="radio"
            aria-checked={marcado}
            // Só uma opção entra na ordem do Tab; as outras se alcançam pelas
            // setas. É o que faz o grupo custar um Tab, e não N — e `noTab`
            // garante que essa uma exista mesmo sem resposta escolhida.
            tabIndex={indice === noTab ? 0 : -1}
            className="co-segmented__option"
            onClick={() => onChange(opcao.value)}
            onKeyDown={(evento) => aoTeclar(evento, indice)}
          >
            {opcao.label}
          </button>
        );
      })}
    </div>
  );

  if (!legend) return grupo;
  // A legenda e o grupo juntos, com o respiro do rótulo do `Field` até o
  // controle: os dois se leem como uma peça só.
  return (
    <div className="co-segmented-field" data-full={full ? "true" : undefined}>
      <Text as="span" id={idLegenda} variant="label" tone="subtle" className="co-segmented__legend">
        {label}
      </Text>
      {grupo}
    </div>
  );
}
