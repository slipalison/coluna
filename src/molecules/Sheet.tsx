import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /**
   * `overlay` (padrão) sobe do rodapé por cima da tela — o gesto do telefone.
   * `inline` abre DENTRO do cartão que o chamou, sem véu e sem prender o foco:
   * é o mesmo painel quando há largura sobrando.
   *
   * Esta prop é a regra "largura nunca vira modal" escrita como código. No
   * desktop, trocar a porção de uma refeição não pode escurecer a tela inteira
   * e esconder a conta do dia — que é justamente o número que faz a pessoa
   * escolher a porção. Quem quiser o contrário tem de escrever `overlay` e
   * olhar para a palavra.
   */
  mode?: "overlay" | "inline";
  /**
   * Só vale em `overlay`. `fixed` gruda na janela; `absolute` faz o mesmo dentro
   * de uma moldura posicionada — a pré-visualização de aparelho no catálogo.
   */
  position?: "fixed" | "absolute";
  /** A faixa de ações no rodapé do painel. */
  footer?: ReactNode;
  className?: string | undefined;
}

const FOCALIZAVEIS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * O painel que abre por cima (telefone) ou por dentro (desktop).
 *
 * Um componente só para os dois, e não dois componentes, porque é o MESMO
 * painel: mesmo título, mesmo conteúdo, mesmas ações. Separar em `Sheet` e
 * `Panel` faria as duas versões divergirem no primeiro ajuste feito com pressa
 * — e a que diverge é sempre a que menos gente testa.
 *
 * Em `overlay` ele é um diálogo de verdade: `aria-modal`, foco que entra ao
 * abrir, Tab que dá a volta dentro do painel, Esc que fecha e foco que VOLTA
 * para quem abriu. Esse último é o que mais falta por aí: sem ele, fechar o
 * painel joga o teclado no começo da página, e quem navega sem mouse perde o
 * lugar que levou vinte teclas para alcançar.
 *
 * Em `inline` nada disso acontece, e também é de propósito: prender o foco num
 * painel que a pessoa vê ao lado do resto da tela é prender sem motivo.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  mode = "overlay",
  position = "fixed",
  footer,
  className,
}: SheetProps) {
  const painel = useRef<HTMLDivElement>(null);
  const quemAbriu = useRef<HTMLElement | null>(null);
  const idTitulo = useId();
  const sobreposto = mode === "overlay";

  useEffect(() => {
    if (!open) return;

    const anterior = document.activeElement;
    quemAbriu.current = anterior instanceof HTMLElement ? anterior : null;
    painel.current?.focus();

    return () => {
      quemAbriu.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "Escape") {
      evento.stopPropagation();
      onClose();
      return;
    }

    if (evento.key !== "Tab" || !sobreposto) return;

    const alvos = painel.current?.querySelectorAll<HTMLElement>(FOCALIZAVEIS) ?? [];
    const primeiro = alvos[0];
    const ultimo = alvos[alvos.length - 1];
    if (!primeiro || !ultimo) return;

    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  const classe = className ? `co-sheet ${className}` : "co-sheet";

  const painelJsx = (
    <div
      ref={painel}
      className={classe}
      data-mode={sobreposto ? undefined : "inline"}
      role={sobreposto ? "dialog" : "group"}
      aria-modal={sobreposto ? true : undefined}
      aria-labelledby={idTitulo}
      tabIndex={-1}
      onKeyDown={aoTeclar}
    >
      <div className="co-sheet__header">
        <Text id={idTitulo} as="h2" variant="headline" weight="semibold">
          {title}
        </Text>
        <button type="button" className="co-sheet__close" aria-label="Fechar" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="co-sheet__body">{children}</div>

      {footer ? <div className="co-sheet__footer">{footer}</div> : null}
    </div>
  );

  if (!sobreposto) return painelJsx;

  return (
    <div className="co-sheet-overlay" data-position={position === "fixed" ? undefined : position}>
      {/*
        O véu fecha ao ser tocado, e ele é um `<button>` para que isso não seja
        um `<div>` com `onClick` — mas ele fica FORA da ordem do Tab e sem nome
        visível: quem usa teclado tem o Esc e o botão de fechar, e mais um alvo
        anônimo no caminho só atrapalha.
      */}
      <button
        type="button"
        className="co-sheet-overlay__veil"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
      />
      {painelJsx}
    </div>
  );
}
