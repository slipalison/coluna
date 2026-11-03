import {
  Children,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Icon } from "../atoms/Icon";

export interface DeckProps {
  /** O que o carrossel mostra: "Cardápio do dia". Vira o nome dele — um carrossel sem nome é "carrossel" e nada mais. */
  label: string;
  /** Um card por filho, na ordem. */
  children: ReactNode;
  /** O card na tela, controlado. Sem ele, o carrossel guarda a posição sozinho, a partir de `defaultIndex`. */
  index?: number | undefined;
  defaultIndex?: number | undefined;
  /** Chamado com a posição nova a cada troca: seta, teclado ou arrasto. */
  onIndexChange?: ((index: number) => void) | undefined;
  /** O nome do botão de voltar, inteiro. */
  previousLabel?: string | undefined;
  /** O nome do botão de avançar, inteiro. */
  nextLabel?: string | undefined;
  /**
   * O nome de cada card, que o leitor de tela diz quando o foco chega nele.
   * O padrão é a posição, "2 de 5"; quem tem um nome melhor ("Almoço") o põe
   * junto da posição, e não no lugar dela.
   */
  cardLabel?: ((index: number, total: number) => string) | undefined;
  className?: string | undefined;
}

/** A distância, em px, a partir da qual o dedo que desce no card vira arrasto, e não toque. */
export const DECK_FOLGA = 8;
/** A distância, em px, a partir da qual o arrasto solto troca de card. Abaixo dela, o card volta. */
export const DECK_LIMIAR = 64;
/** O giro máximo do card arrastado, em graus: leve, para dizer "isto sai de lado", e não para chacoalhar. */
export const DECK_GIRO_MAX = 6;

const posicao = (indice: number, total: number) => `${indice + 1} de ${total}`;

/** O giro do card para um deslocamento de `dx` px: proporcional, e preso ao máximo. */
export function giroDoDeck(dx: number): number {
  const giro = dx / 20;
  return Math.max(-DECK_GIRO_MAX, Math.min(DECK_GIRO_MAX, giro));
}

/**
 * Cards um de cada vez, que se trocam arrastando para os lados — o cardápio em
 * cards.
 *
 * O gesto nunca é o único caminho (WCAG 2.5.1 e 2.5.7): embaixo do card ficam
 * as duas setas, com o alvo de 44px e o limite de controle, e as setas do
 * teclado trocam de card com o foco nele ou nas setas. É o padrão de carrossel
 * do WAI-ARIA: a raiz é uma região com `aria-roledescription="carrossel"`, e
 * cada card é um grupo com `aria-roledescription="card"` e o nome da posição.
 *
 * - **O foco vai para o card novo** em toda troca feita pela pessoa: quem usa
 *   leitor de tela ouve "2 de 5, card" e já está dentro dele, e quem usa
 *   teclado continua com as setas dali.
 * - **O indicador de posição** marca a vaga cheia com um traço largo e cheio, e
 *   as vazias com um anel: forma diferente, e não só cor (ADR-005). Ele é
 *   desenho (`aria-hidden`); a posição falada é a do nome do card.
 * - **O arrasto** leva o card com o dedo, com um giro leve, e troca quando
 *   passa de `DECK_LIMIAR`; abaixo disso, o card volta. O toque que não anda
 *   `DECK_FOLGA` continua sendo toque no que está dentro do card. Na vertical,
 *   a página rola (`touch-action: pan-y`).
 * - **Com `prefers-reduced-motion`**, o card não se move nem gira com o dedo,
 *   e nada anima: o arrasto só decide, ao soltar, se troca.
 * - **Nas pontas** não dá a volta: a seta fica `aria-disabled`, e não
 *   `disabled`, para o foco não cair fora da página (como no `Pager`).
 * - Os cards fora da tela ficam montados e `hidden`: o que a pessoa escreveu
 *   num deles continua lá quando ela volta.
 */
export function Deck({
  label,
  children,
  index,
  defaultIndex = 0,
  onIndexChange,
  previousLabel = "Card anterior",
  nextLabel = "Próximo card",
  cardLabel = posicao,
  className,
}: Readonly<DeckProps>) {
  const cards = Children.toArray(children);
  const total = cards.length;
  const [interno, definirInterno] = useState(defaultIndex);
  const bruto = index ?? interno;
  const atual = total === 0 ? 0 : Math.max(0, Math.min(total - 1, bruto));

  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const arrasto = useRef<{ id: number; x0: number; dx: number; ativo: boolean } | null>(null);
  const arrastou = useRef(false);
  const [dx, definirDx] = useState(0);

  const classe = className ? `co-deck ${className}` : "co-deck";
  const temAnterior = atual > 0;
  const temProximo = atual < total - 1;

  function ir(destino: number) {
    if (destino < 0 || destino >= total || destino === atual) return;
    if (index === undefined) definirInterno(destino);
    onIndexChange?.(destino);
    // O card novo já está montado (só `hidden`); o foco espera o React tirar o
    // `hidden` dele, no próximo quadro, porque um elemento escondido não foca.
    requestAnimationFrame(() => refs.current[destino]?.focus());
  }

  function aoTeclar(evento: KeyboardEvent<HTMLElement>) {
    switch (evento.key) {
      case "ArrowRight":
        evento.preventDefault();
        ir(atual + 1);
        break;
      case "ArrowLeft":
        evento.preventDefault();
        ir(atual - 1);
        break;
      case "Home":
        evento.preventDefault();
        ir(0);
        break;
      case "End":
        evento.preventDefault();
        ir(total - 1);
        break;
      default:
        break;
    }
  }

  /** No card, as setas são dele só quando o foco está NO card, e não num campo ou nas abas de dentro. */
  function aoTeclarNoCard(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.target !== evento.currentTarget) return;
    aoTeclar(evento);
  }

  function aoDescer(evento: PointerEvent<HTMLDivElement>) {
    if (evento.button !== 0 || total < 2) return;
    arrasto.current = { id: evento.pointerId, x0: evento.clientX, dx: 0, ativo: false };
    arrastou.current = false;
  }

  function aoMover(evento: PointerEvent<HTMLDivElement>) {
    const estado = arrasto.current;
    if (!estado || estado.id !== evento.pointerId) return;
    estado.dx = evento.clientX - estado.x0;
    if (!estado.ativo && Math.abs(estado.dx) >= DECK_FOLGA) {
      // Só agora o card captura o ponteiro: capturar na descida faria o toque
      // num botão dentro do card cair no card.
      estado.ativo = true;
      arrastou.current = true;
      evento.currentTarget.setPointerCapture?.(evento.pointerId);
    }
    if (estado.ativo) definirDx(estado.dx);
  }

  function aoSoltar(evento: PointerEvent<HTMLDivElement>) {
    const estado = arrasto.current;
    if (!estado || estado.id !== evento.pointerId) return;
    arrasto.current = null;
    definirDx(0);
    if (!estado.ativo) return;
    if (estado.dx <= -DECK_LIMIAR) ir(atual + 1);
    else if (estado.dx >= DECK_LIMIAR) ir(atual - 1);
  }

  function aoCancelar() {
    arrasto.current = null;
    definirDx(0);
  }

  /** O clique que fecha um arrasto não é toque no que está embaixo do dedo. */
  function aoClicar(evento: MouseEvent<HTMLDivElement>) {
    if (!arrastou.current) return;
    arrastou.current = false;
    evento.preventDefault();
    evento.stopPropagation();
  }

  return (
    <section className={classe} aria-roledescription="carrossel" aria-label={label}>
      <div className="co-deck__viewport">
        {cards.map((card, indice) => {
          const naTela = indice === atual;
          const arrastando = naTela && dx !== 0;
          return (
            <div
              // Os filhos do `Children.toArray` já vêm com chave estável.
              key={(card as { key?: string | null }).key ?? indice}
              ref={(no) => {
                refs.current[indice] = no;
              }}
              role="group"
              aria-roledescription="card"
              aria-label={cardLabel(indice, total)}
              tabIndex={-1}
              hidden={!naTela}
              className="co-deck__card"
              data-dragging={arrastando ? "true" : undefined}
              style={
                arrastando
                  ? ({
                      "--co-deck-dx": `${dx}px`,
                      "--co-deck-tilt": `${giroDoDeck(dx)}deg`,
                    } as CSSProperties)
                  : undefined
              }
              onKeyDown={aoTeclarNoCard}
              onPointerDown={aoDescer}
              onPointerMove={aoMover}
              onPointerUp={aoSoltar}
              onPointerCancel={aoCancelar}
              onClickCapture={aoClicar}
            >
              {card}
            </div>
          );
        })}
      </div>

      {total > 1 ? (
        <div className="co-deck__controls">
          <button
            type="button"
            className="co-deck__arrow"
            aria-label={previousLabel}
            title={previousLabel}
            aria-disabled={temAnterior ? undefined : true}
            onClick={temAnterior ? () => ir(atual - 1) : undefined}
            onKeyDown={aoTeclar}
          >
            <Icon name="chevron-left" size={20} />
          </button>
          <ol className="co-deck__dots" aria-hidden="true">
            {cards.map((card, indice) => (
              <li
                key={(card as { key?: string | null }).key ?? indice}
                className="co-deck__dot"
                data-current={indice === atual ? "true" : undefined}
              />
            ))}
          </ol>
          <button
            type="button"
            className="co-deck__arrow"
            aria-label={nextLabel}
            title={nextLabel}
            aria-disabled={temProximo ? undefined : true}
            onClick={temProximo ? () => ir(atual + 1) : undefined}
            onKeyDown={aoTeclar}
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
