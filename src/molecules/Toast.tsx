import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { Text } from "../atoms/Text";
import { VisuallyHidden } from "../atoms/VisuallyHidden";

/** Por que o aviso fechou: o tempo acabou, a ação foi escolhida, ou a pessoa o dispensou (× ou Esc). */
export type ToastCloseReason = "timeout" | "action" | "dismiss";

export interface ToastProps {
  /** Aberto ou não. O aviso é controlado: quem abre e fecha é quem consome. */
  open: boolean;
  /** O que aconteceu, escrito: "Almoço marcado como feito". */
  message: ReactNode;
  /** O rótulo da ação, que diz o que acontece: "Desfazer". Sem ele, o aviso não tem ação. */
  actionLabel?: string | undefined;
  /** A ação. O aviso fecha logo depois dela, com o motivo `action`. */
  onAction?: (() => void) | undefined;
  /** Chamado quando o aviso pede para fechar; quem consome põe `open` em `false`. */
  onClose: (reason: ToastCloseReason) => void;
  /**
   * Quanto tempo o aviso fica, em ms, contado só enquanto ninguém está com ele:
   * com o foco dentro ou o ponteiro em cima, o tempo PARA, e volta a contar de
   * onde parou quando o foco e o ponteiro saem. Quem escolhe é quem usa: um
   * aviso com "Desfazer" pede tempo para ler e alcançar o botão.
   */
  duration: number;
  /**
   * O teto, em ms, contado desde que abriu, com ou sem pausa: passou dele, o
   * aviso fecha mesmo com o foco dentro (e o foco volta). Também é de quem usa,
   * e precisa ser maior que `duration`.
   *
   * O teto vence a pausa: quem chega ao "Desfazer" pelo teclado ou pelo leitor
   * de tela e demora perde o aviso. Por isso ele deve ser folgado (dezenas de
   * segundos), e a ação que o aviso oferece tem de existir também fora dele
   * (a refeição feita se desmarca, a receita apagada volta da lixeira) — o
   * aviso é o atalho, nunca o único caminho.
   */
  maxDuration: number;
  /** `warn` para o que deu errado e não bloqueia ("Não deu para trocar agora"): ícone de atenção junto do texto. */
  tone?: "neutral" | "warn";
  /**
   * Para onde o foco volta quando o aviso fecha com o foco dentro dele. Sem
   * isto, volta para onde ele estava antes de entrar no aviso.
   */
  returnFocus?: RefObject<HTMLElement | null> | undefined;
  /** O nome do botão de fechar. */
  closeLabel?: string;
  /**
   * `fixed` (padrão) prende o aviso embaixo da tela, acima da barra de abas e
   * da barra de ação, dentro da área segura. `static` o deixa no fluxo — o
   * catálogo e a peça dentro de outra.
   */
  position?: "fixed" | "static";
  className?: string | undefined;
}

/**
 * O aviso passageiro, com uma ação: "Desfazer".
 *
 * - ANUNCIA POR REGIÃO VIVA. A região (`role="status"`, educada) existe sempre,
 *   aberta ou fechada, e a mensagem entra nela ao abrir: região que nasce junto
 *   com o texto o leitor de tela pode não ler. Fechado, ela fica vazia e não
 *   ocupa espaço. O anúncio diz também que há uma ação ("Ação no aviso:
 *   Desfazer"), que senão só quem vê ficaria sabendo.
 * - NÃO ROUBA O FOCO. Quem estava digitando continua digitando; o aviso é a
 *   próxima parada do Tab depois de onde ele está no documento, e o Esc o
 *   dispensa.
 * - DEVOLVE O FOCO. Fechou com o foco dentro (a ação, o ×, o Esc, o teto), o
 *   foco volta para `returnFocus` ou para onde estava antes de entrar — nunca
 *   cai no `<body>` com o botão que sumiu.
 * - SOME NO TEMPO DE QUEM USA, E PAUSA. `duration` só conta enquanto o aviso não
 *   tem foco nem ponteiro (WCAG 2.2.1); `maxDuration` é o teto, contado desde
 *   que abriu, também dado por quem usa.
 *
 * Nada de estilo injetado: a entrada é uma classe com `@keyframes`, e com
 * `prefers-reduced-motion` ela esmaece em vez de subir (ADR-025).
 */
export function Toast({
  open,
  message,
  actionLabel,
  onAction,
  onClose,
  duration,
  maxDuration,
  tone = "neutral",
  returnFocus,
  closeLabel = "Fechar aviso",
  position = "fixed",
  className,
}: ToastProps) {
  const caixa = useRef<HTMLDivElement>(null);
  const origem = useRef<HTMLElement | null>(null);
  const focoDentro = useRef(false);
  const ponteiroDentro = useRef(false);
  const restante = useRef(duration);
  const inicio = useRef(0);
  const relogio = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fecharRef = useRef(onClose);
  fecharRef.current = onClose;

  const devolverFoco = useCallback(() => {
    if (!focoDentro.current) return;
    focoDentro.current = false;
    const alvo = returnFocus?.current ?? origem.current;
    if (alvo?.isConnected) alvo.focus();
    else (document.activeElement as HTMLElement | null)?.blur?.();
  }, [returnFocus]);

  const fechar = useCallback(
    (motivo: ToastCloseReason) => {
      devolverFoco();
      fecharRef.current(motivo);
    },
    [devolverFoco],
  );

  const parar = useCallback(() => {
    if (relogio.current === undefined) return;
    clearTimeout(relogio.current);
    relogio.current = undefined;
    restante.current = Math.max(0, restante.current - (Date.now() - inicio.current));
  }, []);

  const contar = useCallback(() => {
    if (relogio.current !== undefined || focoDentro.current || ponteiroDentro.current) return;
    inicio.current = Date.now();
    relogio.current = setTimeout(() => {
      relogio.current = undefined;
      fechar("timeout");
    }, restante.current);
  }, [fechar]);

  // Abriu: o tempo começa cheio, e o teto começa a contar.
  useEffect(() => {
    if (!open) return;
    restante.current = duration;
    contar();
    const teto = setTimeout(() => fechar("timeout"), Math.max(maxDuration, duration));
    return () => {
      clearTimeout(teto);
      if (relogio.current !== undefined) clearTimeout(relogio.current);
      relogio.current = undefined;
    };
  }, [open, duration, maxDuration, contar, fechar]);

  // Fechou por fora (quem consome pôs `open` em false) com o foco dentro: devolve.
  useLayoutEffect(() => {
    if (!open) {
      devolverFoco();
      ponteiroDentro.current = false;
    }
  }, [open, devolverFoco]);

  const classe = className ? `co-toast ${className}` : "co-toast";
  return (
    <div
      ref={caixa}
      className={classe}
      data-open={open ? "true" : undefined}
      data-tone={tone === "neutral" ? undefined : tone}
      data-position={position === "fixed" ? undefined : position}
      onFocus={(evento) => {
        if (!focoDentro.current) {
          const de = evento.relatedTarget;
          origem.current = de instanceof HTMLElement && !caixa.current?.contains(de) ? de : null;
        }
        focoDentro.current = true;
        parar();
      }}
      onBlur={(evento) => {
        const para = evento.relatedTarget;
        if (para instanceof Node && caixa.current?.contains(para)) return;
        focoDentro.current = false;
        if (open) contar();
      }}
      onPointerEnter={() => {
        ponteiroDentro.current = true;
        parar();
      }}
      onPointerLeave={() => {
        ponteiroDentro.current = false;
        if (open) contar();
      }}
      onKeyDown={(evento) => {
        if (evento.key === "Escape" && open) {
          evento.stopPropagation();
          fechar("dismiss");
        }
      }}
    >
      {open && tone === "warn" ? (
        <span className="co-toast__icon">
          <Icon name="alert" size={20} />
        </span>
      ) : null}
      <div className="co-toast__message" role="status" aria-live="polite" aria-atomic="true">
        {open ? (
          <Text as="span" variant="body">
            {message}
            {actionLabel ? <VisuallyHidden>{`. Ação no aviso: ${actionLabel}.`}</VisuallyHidden> : null}
          </Text>
        ) : null}
      </div>
      {open && actionLabel ? (
        <Button
          className="co-toast__action"
          variant="ghost"
          tone="neutral"
          onClick={() => {
            onAction?.();
            fechar("action");
          }}
        >
          {actionLabel}
        </Button>
      ) : null}
      {open ? (
        <IconButton className="co-toast__close" icon="close" label={closeLabel} onClick={() => fechar("dismiss")} />
      ) : null}
    </div>
  );
}
