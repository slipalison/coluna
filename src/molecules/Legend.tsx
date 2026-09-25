import { Text } from "../atoms/Text";

/**
 * A amostra, e ela copia o desenho que nomeia.
 *
 *   square  o quadrado de categoria: dia fechado, parcial, sem registro.
 *   point   o ponto redondo da medida crua: a pesagem do dia no gráfico.
 *   line    o traço cheio da série principal.
 *   dashed  o traço tracejado: tendência, projeção, a fórmula.
 *   band    a faixa pintada atrás das linhas: onde o número deveria morar.
 *
 * O ponto é o único redondo, e isso não abre exceção nenhuma ao ADR-004: a
 * amostra tem a forma da marca que ela explica. Um quadrado na legenda de um
 * gráfico de círculos ensinaria a procurar um quadrado que não está lá.
 */
export type LegendSwatch = "square" | "point" | "line" | "dashed" | "band";

/** Os tons do sistema, os mesmos do `Dot` e da `Slat` — nunca uma cor solta. */
export type LegendTone = "accent" | "protein" | "carb" | "fat" | "status" | "neutral";

export interface LegendItem {
  /** O que a marca significa, escrito. É o texto, e não a cor, que carrega a legenda. */
  label: string;
  swatch?: LegendSwatch;
  tone?: LegendTone;
}

export interface LegendProps {
  items: readonly LegendItem[];
  /** O nome da lista, quando a legenda não está grudada no gráfico que ela explica. */
  label?: string | undefined;
  className?: string | undefined;
}

/**
 * A legenda de um gráfico ou de um calendário: amostra e nome, lado a lado.
 *
 * Ela existe fora da `Series` pelo mesmo motivo de a série não ter eixo: texto
 * dentro do SVG prende a cor no desenho e escapa da moldura. Aqui o nome é
 * HTML, com o tema e a quebra de linha que o resto da tela já tem.
 *
 * A amostra sai `aria-hidden`, como o `Dot`. Quem não vê a cor lê o nome ao
 * lado — e o gráfico que a legenda explica tem de dizer a mesma coisa em
 * texto, no `label` da `Series` ou num número em HTML (ADR-005). A legenda
 * ajuda o olho a ligar a marca ao nome; ela não é o lugar da informação.
 *
 * O tom `neutral` é o cinza do traço de tendência da `Series`
 * (`--co-text-subtle`), e não o do trilho: a amostra tem de ser a MESMA cor da
 * marca que ela nomeia, e um cinza que não passa em 3:1 contra o fundo não é
 * sinal de nada.
 */
export function Legend({ items, label, className }: LegendProps) {
  const classe = className ? `co-legend ${className}` : "co-legend";
  return (
    <ul className={classe} aria-label={label}>
      {items.map((item) => (
        <li key={item.label} className="co-legend__item">
          <span
            className="co-legend__swatch"
            data-swatch={item.swatch ?? "square"}
            data-tone={item.tone ?? "accent"}
            aria-hidden="true"
          />
          <Text as="span" variant="caption" tone="subtle">
            {item.label}
          </Text>
        </li>
      ))}
    </ul>
  );
}
