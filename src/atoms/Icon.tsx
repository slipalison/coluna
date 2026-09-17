import type { SVGProps } from "react";

/**
 * O conjunto de ícones, e ele é fechado.
 *
 * Todos são de traço, na mesma grade de 24 e com a mesma espessura de 1,5 —
 * um pictograma cheio no meio de contornos salta como erro de impressão.
 * Emoji não entra: não escala, não recolore, e muda de desenho por sistema
 * operacional.
 */
export type IconName =
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "plus"
  | "minus"
  | "check"
  | "close"
  | "search"
  | "refresh"
  | "info"
  | "bell"
  | "gear"
  | "user"
  | "book"
  | "calendar"
  | "chart"
  | "scale"
  | "utensils"
  | "offline"
  | "more";

const CAMINHOS: Record<IconName, string> = {
  "chevron-down": "M6 9l6 6 6-6",
  "chevron-left": "M15 5l-7 7 7 7",
  "chevron-right": "M9 5l7 7-7 7",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M5 12l5 5L19 7",
  close: "M6 6l12 12M18 6L6 18",
  search: "M17.5 11a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0M16 16l4 4",
  refresh: "M4 11a7 7 0 0 1 12-4.5L19 9M19 4v5h-5M20 13a7 7 0 0 1-12 4.5L5 15M5 20v-5h5",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 8v5M12 16h.01",
  bell: "M6 10a6 6 0 0 1 12 0c0 4 1.5 5 1.5 5h-15S6 14 6 10M10.5 19a1.8 1.8 0 0 0 3 0",
  gear:
    "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1",
  user: "M15.2 9a3.2 3.2 0 1 1-6.4 0 3.2 3.2 0 0 1 6.4 0M5.5 19.5a6.8 6.8 0 0 1 13 0",
  book: "M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM9 9h6M9 13h6",
  calendar: "M7 4h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2M5 9.5h14M9 2.5v4M15 2.5v4",
  chart: "M4 16l4.5-5 3.5 3.5L19 7M15 7h4v4",
  scale: "M6 20h12l-1.4-11H7.4zM9.5 9a2.5 2.5 0 1 1 5 0",
  utensils: "M6 3v8a3 3 0 0 0 6 0V3M9 11v10M18 3c-1.5 2-2 4-2 6s.5 3 2 3v9",
  offline: "M4 8.5a12 12 0 0 1 16 0M7.5 12a7.5 7.5 0 0 1 9 0M12 16h.01",
  more: "M6 12h.01M12 12h.01M18 12h.01",
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** Lado do quadrado, em pixels. A grade é de 24, então 16/18/20/24 caem certo. */
  size?: number;
  /**
   * Texto para quem não vê o desenho.
   *
   * Sem isto o ícone sai `aria-hidden`, que é o certo para o caso comum: o
   * ícone acompanha um rótulo e repeti-lo só faz o leitor de tela falar duas
   * vezes. Preencha quando o ícone for a ÚNICA coisa dentro do controle.
   */
  title?: string;
}

export function Icon({ name, size = 20, title, className, ...resto }: IconProps) {
  const classe = className ? `co-icon ${className}` : "co-icon";
  const decorativo = title === undefined;
  return (
    <svg
      className={classe}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={decorativo ? undefined : "img"}
      aria-hidden={decorativo ? true : undefined}
      aria-label={title}
      {...resto}
    >
      <path d={CAMINHOS[name]} />
    </svg>
  );
}

/** Os nomes disponíveis, para montar uma página de referência sem repetir a lista. */
export const iconNames = Object.keys(CAMINHOS) as IconName[];
