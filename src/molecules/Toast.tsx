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
   * O teto, em ms, contado desde que abriu, com ou sem pausa: o prazo do
   * servidor para a ação (no Basalto, 2 min), e NÃO o pulso do aviso. Passou
   * dele, o aviso fecha — menos enquanto alguém está com ele: o FOCO dentro, o
   * PONTEIRO em cima ou o dedo que tocou nele. Quem está no "Desfazer" pelo
   * teclado, pelo leitor de tela, pelo mouse ou pelo toque não perde a ação por
   * demorar (WCAG 2.2.1): o teto fica de pé e o aviso fecha quando a pessoa
   * solta o aviso. Também é de quem usa, e deve ser maior que `duration`: um
   * valor menor ou igual avisa no console e vale 10 vezes `duration`, em vez de
   * derrubar a tela.
   *
   * A ação que o aviso oferece deve existir também fora dele (a refeição feita
   * se desmarca, a receita apagada volta da lixeira) — o aviso é o atalho,
   * nunca o único caminho.
   */
  maxDuration: number;
  /** `warn` para o que deu errado e não bloqueia ("Não deu para trocar agora"): ícone de atenção junto do texto. */
  tone?: "neutral" | "warn";
  /**
   * O aviso nasceu de uma ação da pessoa (marcar feita, apagar): ao abrir, o
   * foco vai ao "Desfazer", e ao fechar volta ao elemento de onde veio (ou a
   * `returnFocus`). Sem isto (o padrão), o aviso NÃO move o foco: ele pode
   * nascer de um efeito, de um prazo ou de outra aba, e roubar o foco de quem
   * digita é pior que perder o atalho. Quem consome decide quando usar.
   */
  focusOnOpen?: boolean;
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
 * - NÃO ROUBA O FOCO, salvo se quem consome pedir (`focusOnOpen`, para o aviso
 *   que nasce de uma ação da pessoa). Quem estava digitando continua digitando:
 *   nenhum atalho global, que sequestraria a digitação (a tecla morta do "ã" no
 *   macOS). O Esc, com o foco dentro, o dispensa.
 * - DEVOLVE O FOCO. Fechou com o foco dentro (a ação, o ×, o Esc, o teto), o
 *   foco volta para `returnFocus` ou para onde estava antes de entrar — nunca
 *   cai no `<body>` com o botão que sumiu.
 * - SOME NO TEMPO DE QUEM USA, E PAUSA. `duration` só conta enquanto o aviso não
 *   tem foco, ponteiro nem dedo (WCAG 2.2.1); `maxDuration` é o teto, o prazo do
 *   servidor, contado desde que abriu — e que espera quem está com o aviso
 *   (foco, ponteiro ou toque) soltá-lo. A caixa é focável por script
 *   (`tabIndex={-1}`, fora do Tab): clicar na mensagem leva o foco a ela.
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
  focusOnOpen = false,
  closeLabel = "Fechar aviso",
  position = "fixed",
  className,
}: ToastProps) {
  // Um teto menor ou igual ao tempo anularia a pausa: avisa e usa 10 × o tempo, em
  // vez de derrubar a tela de quem consome por um valor de configuração.
  const tetoInvalido = !(maxDuration > duration);
  const teto = tetoInvalido ? duration * 10 : maxDuration;
  useEffect(() => {
    if (tetoInvalido) {
      console.warn(
        `Toast: maxDuration (${maxDuration} ms) precisa ser maior que duration (${duration} ms); um teto menor ou igual anula a pausa. Usando ${duration * 10} ms (10 × duration).`,
      );
    }
  }, [tetoInvalido, maxDuration, duration]);
  const caixa = useRef<HTMLDivElement>(null);
  const origem = useRef<HTMLElement | null>(null);
  /** De onde o foco veio quando `focusOnOpen` o levou ao aviso (o `relatedTarget` pode vir vazio). */
  const origemFixada = useRef<HTMLElement | null>(null);
  const focoDentro = useRef(false);
  /** O teto passou com alguém com o aviso: ele espera a pessoa soltá-lo para fechar. */
  const tetoVencido = useRef(false);
  const ponteiroDentro = useRef(false);
  /** O dedo (ou a caneta) tocou no aviso e não o soltou: ele fica seguro até um toque fora. */
  const segurado = useRef(false);
  const focoAoAbrir = useRef(focusOnOpen);
  focoAoAbrir.current = focusOnOpen;
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

  const emUso = () => focoDentro.current || ponteiroDentro.current || segurado.current;

  const contar = useCallback(() => {
    if (relogio.current !== undefined || focoDentro.current || ponteiroDentro.current || segurado.current) return;
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
    tetoVencido.current = false;
    contar();
    // Quem está com o aviso (foco, ponteiro, dedo) segura o teto: não perde o "Desfazer" por demorar.
    const tetoDoServidor = setTimeout(() => {
      if (focoDentro.current || ponteiroDentro.current || segurado.current) tetoVencido.current = true;
      else fechar("timeout");
    }, teto);
    return () => {
      clearTimeout(tetoDoServidor);
      if (relogio.current !== undefined) clearTimeout(relogio.current);
      relogio.current = undefined;
    };
  }, [open, duration, teto, contar, fechar]);

  // Solta o aviso (o foco saiu, o ponteiro saiu, o dedo tocou fora): se o teto
  // já tinha passado, fecha; senão volta a contar o tempo que faltava.
  const soltar = useCallback(() => {
    if (emUso()) return;
    if (tetoVencido.current) fechar("timeout");
    else contar();
  }, [contar, fechar]);

  // Um toque fora do aviso solta o aviso segurado pelo dedo.
  useEffect(() => {
    if (!open) return;
    const fora = (evento: PointerEvent) => {
      if (!segurado.current || (evento.target instanceof Node && caixa.current?.contains(evento.target))) return;
      segurado.current = false;
      soltar();
    };
    document.addEventListener("pointerdown", fora, true);
    return () => document.removeEventListener("pointerdown", fora, true);
  }, [open, soltar]);

  // O aviso que nasce de uma ação da pessoa leva o foco ao "Desfazer" ao abrir;
  // ao fechar, o foco volta a quem o tinha. Depois do efeito do tempo, para a
  // pausa do foco valer desde a abertura.
  useEffect(() => {
    if (!open || !focoAoAbrir.current) return;
    const de = document.activeElement;
    origemFixada.current = de instanceof HTMLElement && de !== document.body && !caixa.current?.contains(de) ? de : null;
    caixa.current?.querySelector<HTMLElement>(".co-toast__action, .co-toast__close")?.focus();
  }, [open]);

  // Fechou por fora (quem consome pôs `open` em false) com o foco dentro: devolve.
  useLayoutEffect(() => {
    if (!open) {
      devolverFoco();
      ponteiroDentro.current = false;
      segurado.current = false;
      origemFixada.current = null;
    }
  }, [open, devolverFoco]);

  const classe = className ? `co-toast ${className}` : "co-toast";
  return (
    <div
      ref={caixa}
      className={classe}
      tabIndex={-1}
      data-open={open ? "true" : undefined}
      data-tone={tone === "neutral" ? undefined : tone}
      data-position={position === "fixed" ? undefined : position}
      onFocus={(evento) => {
        if (!focoDentro.current) {
          const de = evento.relatedTarget;
          origem.current = de instanceof HTMLElement && !caixa.current?.contains(de) ? de : origemFixada.current;
        }
        focoDentro.current = true;
        parar();
      }}
      onBlur={(evento) => {
        const para = evento.relatedTarget;
        if (para instanceof Node && caixa.current?.contains(para)) return;
        focoDentro.current = false;
        if (open) soltar();
      }}
      onPointerEnter={() => {
        ponteiroDentro.current = true;
        parar();
      }}
      onPointerLeave={() => {
        ponteiroDentro.current = false;
        if (open) soltar();
      }}
      onPointerDown={(evento) => {
        // O mouse já segura pelo ponteiro em cima; o toque não tem "em cima"
        // depois que o dedo levanta, e fica seguro até um toque fora.
        if (evento.pointerType === "mouse") return;
        segurado.current = true;
        parar();
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
