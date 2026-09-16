import { useRef, type KeyboardEvent } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  /** Obrigatório: um grupo de escolha sem nome é mudo no leitor de tela. */
  label: string;
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
  options,
  value,
  onChange,
  full = false,
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const classe = className ? `co-segmented ${className}` : "co-segmented";

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

  return (
    <div className={classe} role="radiogroup" aria-label={label} data-full={full ? "true" : undefined}>
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
            // Só a opção marcada entra na ordem do Tab; as outras se alcançam
            // pelas setas. É o que faz o grupo custar um Tab, e não N.
            tabIndex={marcado ? 0 : -1}
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
}
