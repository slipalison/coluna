import type { HTMLAttributes } from "react";

export type SlatTone = "accent" | "protein" | "carb" | "fat" | "status";

export interface SlatProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  /** Quanto está preenchido, de 0 a 1. Fora disso é grampeado, não recusado. */
  value: number;
  size?: "md" | "sm";
  /**
   * `slat` é a colunata basáltica; `solid` é a barra lisa.
   *
   * A escolha é de escala, não de gosto: com 6px de altura a ripa de 3px vira
   * xadrez em vez de textura, então a barra miúda que acompanha uma linha de
   * lista sai lisa e a barra grande do cartão sai ripada.
   */
  pattern?: "slat" | "solid";
  /** A cor do preenchimento. Sai do mesmo token do ponto colorido ao lado. */
  tone?: SlatTone;
  /**
   * Desenha um marcador na posição em vez de preencher até ela.
   *
   * É a forma de mostrar uma mistura entre dois extremos — fórmula de um lado,
   * medição do outro — em que "62%" não é progresso, é um ponto na régua.
   */
  marker?: boolean;
  /** Rótulo para leitor de tela. Sem ele a barra sai decorativa. */
  label?: string;
}

/**
 * A barra do sistema, desenhada como colunata basáltica vista de cima.
 *
 * O desenho vem de `repeating-linear-gradient`, e nao de um no por ripa: com
 * 24 ripas por barra e tres barras por tela, seriam 72 elementos para pintar
 * o que duas regras de CSS pintam.
 *
 * Sem `label` o componente sai `aria-hidden`, e isso e deliberado: quase toda
 * barra deste sistema aparece grudada no numero que ela ilustra, e anunciar
 * "52 por cento" logo depois de "68 de 135 g" so faz o leitor de tela repetir
 * a mesma informacao com outras palavras.
 */
export function Slat({
  value,
  size = "md",
  pattern = "slat",
  tone = "accent",
  marker = false,
  label,
  className,
  style,
  ...resto
}: SlatProps) {
  const fracao = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const porcento = `${Math.round(fracao * 100)}%`;
  const classe = className ? `co-slat ${className}` : "co-slat";

  return (
    <div
      className={classe}
      data-size={size}
      data-pattern={pattern === "slat" ? undefined : pattern}
      data-tone={tone === "accent" ? undefined : tone}
      style={{ ["--co-slat-value" as string]: porcento, ...style }}
      role={label ? "progressbar" : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      aria-valuenow={label ? Math.round(fracao * 100) : undefined}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      {...resto}
    >
      <div className={marker ? "co-slat__marker" : "co-slat__fill"} />
    </div>
  );
}
