export interface SeriesPoint {
  x: number;
  y: number;
}

export interface SeriesProps {
  /** A medida crua, na ordem em que aconteceu. */
  points: readonly SeriesPoint[];
  /**
   * A segunda linha, tracejada: a tendência por trás do ruído.
   *
   * Ela é tracejada e não de outra cor porque forma sobrevive ao daltonismo, à
   * impressão em preto e branco e ao tema claro (ADR-005). Quem enxerga as duas
   * cores ganha a cor de brinde; quem não enxerga continua vendo duas linhas.
   */
  trend?: readonly SeriesPoint[];
  /** A faixa que o número deveria habitar, pintada atrás das linhas. */
  band?: { from: number; to: number };
  /**
   * O que a série diz, em uma frase. Sem ele o desenho sai `aria-hidden`, que é
   * o certo no caso comum: quase todo gráfico aqui acompanha o número que
   * ilustra, e repetir o número em voz alta é ruído.
   */
  label?: string;
  width?: number;
  height?: number;
  className?: string | undefined;
}

/** Folga em volta do desenho, para o traço e a marca não encostarem na borda. */
const BORDA = 6;

/**
 * A série no tempo: peso ao longo do mês, energia ao longo da semana.
 *
 * Ela não sabe o que está medindo. Recebe pares `{x, y}` em qualquer unidade,
 * calcula a escala a partir dos próprios dados e desenha — nenhum eixo, nenhum
 * rótulo, nenhum número. Isso é decisão, não economia: eixo com texto dentro do
 * SVG é o lugar onde um design system quebra o tema (a cor do texto fica presa
 * no desenho) e estoura a moldura (o rótulo sai do `viewBox`). Aqui o número
 * mora no `Stat` ao lado, em HTML, com o tema e o leitor de tela que ele já tem.
 *
 * A escala sai de TODOS os dados — série, tendência e faixa —, então a faixa
 * nunca fica meio de fora do desenho. Série chapada (todos os valores iguais)
 * não divide por zero: ela vira uma reta no meio da caixa.
 *
 * O TAMANHO é `width`/`height`, e o desenho encolhe junto se o contêiner for
 * mais estreito — nunca cresce além do que foi pedido. Um SVG solto com
 * `width: 100%` e altura automática vira um gráfico de seiscentos pixels de
 * altura na primeira coluna larga, e ninguém escreveu isso em lugar nenhum.
 * Para ocupar uma coluna maior, peça um `width` maior.
 */
export function Series({
  points,
  trend,
  band,
  label,
  width = 324,
  height = 150,
  className,
}: SeriesProps) {
  const todos = [...points, ...(trend ?? [])];
  if (todos.length === 0) return null;

  const xs = todos.map((p) => p.x);
  const ys = todos.map((p) => p.y);
  if (band) ys.push(band.from, band.to);

  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMinBruto = Math.min(...ys);
  const yMaxBruto = Math.max(...ys);
  const folga = (yMaxBruto - yMinBruto || 1) * 0.12;
  const yMin = yMinBruto - folga;
  const yMax = yMaxBruto + folga;

  const larguraUtil = width - BORDA * 2;
  const alturaUtil = height - BORDA * 2;
  const px = (x: number) => BORDA + ((x - xMin) / (xMax - xMin || 1)) * larguraUtil;
  const py = (y: number) => height - BORDA - ((y - yMin) / (yMax - yMin || 1)) * alturaUtil;

  const caminho = (serie: readonly SeriesPoint[]) =>
    serie.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x).toFixed(2)} ${py(p.y).toFixed(2)}`).join(" ");

  const ultimo = points.at(-1);
  const classe = className ? `co-series ${className}` : "co-series";

  return (
    <svg
      className={classe}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {band ? (
        <rect
          className="co-series__band"
          x={BORDA}
          y={py(band.to)}
          width={larguraUtil}
          height={Math.max(py(band.from) - py(band.to), 1)}
        />
      ) : null}

      {trend && trend.length > 1 ? (
        <path className="co-series__trend" d={caminho(trend)} />
      ) : null}

      {points.length > 1 ? <path className="co-series__line" d={caminho(points)} /> : null}

      {ultimo ? (
        <circle className="co-series__mark" cx={px(ultimo.x)} cy={py(ultimo.y)} r={4} />
      ) : null}
    </svg>
  );
}
