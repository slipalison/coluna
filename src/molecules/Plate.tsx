import { useId } from "react";
import { Text } from "../atoms/Text";
import { Legend } from "./Legend";
import { PLATE_PATTERN, type PlatePatternKind } from "./plate-pattern";

/**
 * Os grupos do prato, os papéis do alimento da identidade (design/identidade.md):
 * proteína, carboidrato, hortaliça, fruta, laticínio e gordura. O tempero não
 * entra no prato. É um enum, e não uma cor: a proteína tem a mesma cor em toda
 * tela do aplicativo, e quem consome não escolhe o tom.
 */
export type PlateGroup = "protein" | "carb" | "veg" | "fruit" | "dairy" | "fat";

export interface PlateSlice {
  group: PlateGroup;
  /**
   * A fatia do prato, de 0 a 1, já calculada por quem consome (a fração do
   * alvo da refeição que este grupo ocupa). O prato não faz conta de
   * nutrição: só desenha.
   */
  fraction: number;
  /** O nome e os gramas, escritos: "Frango · 150 g". É o texto, e não a cor, que carrega a informação. */
  label: string;
}

export interface PlateProps {
  /** A composição pronta, na ordem em que as fatias se seguem no prato, do topo, no sentido do relógio. */
  slices: readonly PlateSlice[];
  /**
   * Quanto o prato fecha do alvo, ou quanto falta, escrito por quem consome:
   * "Fecha 90% do alvo do almoço", "Falta 10% para o alvo", "Passou 40 kcal do
   * alvo". É OBRIGATÓRIO: a parte vazia do prato é informação ("essa receita
   * fecha a minha refeição?") e o desenho é `aria-hidden` — sem este texto,
   * quem não vê o desenho não tem a resposta (WCAG 1.1.1). O prato o mostra
   * junto da legenda, visível, e é ele que o leitor de tela lê.
   */
  summary: string;
  /**
   * `sm` é o prato mini, do cartão de receita e do painel do editor; `lg` é o
   * grande, da receita aberta.
   */
  size?: "sm" | "lg";
  /**
   * A receita passou do alvo. O aro do prato fica tracejado, na cor de
   * atenção; o número que diz quanto passou é o `summary`, em texto — o aro
   * sozinho não diz nada a quem não vê a cor (ADR-005).
   */
  over?: boolean;
  /** O nome da legenda para o leitor de tela. */
  label?: string;
  className?: string | undefined;
}

// ------------------------------------------------------------ a geometria --

/** Os anéis em volta da célula do meio: 3 anéis, 37 células (1 + 6 + 12 + 18). */
const ANEIS = 3;
/** O raio de uma célula (do centro ao vértice), na unidade do viewBox. */
const RAIO = 10;
/** A célula desenhada é menor que a casa dela: o vão entre as duas é a fissura. */
const DESENHO = 0.88;

export interface PlateCell {
  /** A distância, em anéis, até a célula do meio: a onda anda por ela. */
  ring: number;
  x: number;
  y: number;
  /** O ângulo em volta do meio, do topo, no sentido do relógio, em graus. */
  angle: number;
}

const arredondar = (n: number) => Math.round(n * 100) / 100;

/**
 * As células do prato, em coordenadas axiais de hexágono de topo chato, na
 * ordem em que o prato se enche: o meio primeiro, depois cada uma pelo ângulo
 * em volta do meio, a partir do topo, no sentido do relógio. Encher nessa
 * ordem faz cada grupo virar um setor contínuo, como a fatia de um prato, e a
 * parte vazia ficar junta no fim — o prato "se completa" quando fecha o alvo.
 */
function celulas(): PlateCell[] {
  const todas: PlateCell[] = [];
  for (let q = -ANEIS; q <= ANEIS; q++) {
    for (let r = Math.max(-ANEIS, -q - ANEIS); r <= Math.min(ANEIS, -q + ANEIS); r++) {
      const x = RAIO * 1.5 * q;
      const y = RAIO * Math.sqrt(3) * (r + q / 2);
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      // atan2 a partir do topo, no sentido do relógio (y cresce para baixo).
      const angle = ring === 0 ? -1 : (Math.atan2(x, -y) * 180) / Math.PI;
      todas.push({ ring, x: arredondar(x), y: arredondar(y), angle: angle < 0 && ring > 0 ? angle + 360 : angle });
    }
  }
  return todas.sort((a, b) => a.angle - b.angle || a.ring - b.ring);
}

export const PLATE_CELLS: readonly PlateCell[] = celulas();

/** Os seis vértices de uma célula de topo chato em volta de (x, y). */
function hexagono(x: number, y: number, raio: number): string {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k;
    return `${arredondar(x + raio * Math.cos(a))},${arredondar(y + raio * Math.sin(a))}`;
  }).join(" ");
}

const PONTOS = PLATE_CELLS.map((c) => hexagono(c.x, c.y, RAIO * DESENHO));
/** O aro: um círculo que passa por fora da última fileira, com folga. */
const ARO = RAIO * (ANEIS * 2 + 0.6);
const LADO = ARO + 4;
const CAIXA = `${-LADO} ${-LADO} ${LADO * 2} ${LADO * 2}`;

/**
 * Quantas células cada fatia pinta, pelo maior resto: a soma das frações vira
 * a parte cheia do prato (grampeada em 1), e cada fatia maior que zero pinta
 * pelo menos uma célula, para nenhum grupo da legenda sumir do desenho. É
 * desenho, e não conta de nutrição: a fração chega pronta.
 */
export function plateCounts(slices: readonly Pick<PlateSlice, "fraction">[], total = PLATE_CELLS.length): number[] {
  const fracoes = slices.map((s) => (Number.isFinite(s.fraction) ? Math.max(0, s.fraction) : 0));
  const soma = fracoes.reduce((a, b) => a + b, 0);
  if (soma === 0) return fracoes.map(() => 0);
  const cheias = Math.round(Math.min(1, soma) * total);
  const exatas = fracoes.map((f) => (f / soma) * cheias);
  const contas = exatas.map(Math.floor);
  const ordem = exatas.map((e, i) => [e - Math.floor(e), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  let falta = cheias - contas.reduce((a, b) => a + b, 0);
  for (const [, i] of ordem) {
    if (falta <= 0) break;
    contas[i] = (contas[i] ?? 0) + 1;
    falta--;
  }
  // A fatia pequena demais para uma célula ganha uma, tirada da maior.
  fracoes.forEach((f, i) => {
    if (f > 0 && contas[i] === 0) {
      const maior = contas.indexOf(Math.max(...contas));
      if ((contas[maior] ?? 0) > 1) {
        contas[maior] = (contas[maior] ?? 0) - 1;
        contas[i] = 1;
      }
    }
  });
  return contas;
}

/** O grupo de cada célula, na ordem de `PLATE_CELLS`; `undefined` é célula vazia. */
export function plateFill(slices: readonly PlateSlice[]): (PlateGroup | undefined)[] {
  const contas = plateCounts(slices);
  const grupos: (PlateGroup | undefined)[] = [];
  slices.forEach((s, i) => {
    for (let k = 0; k < (contas[i] ?? 0); k++) grupos.push(s.group);
  });
  return PLATE_CELLS.map((_, i) => grupos[i]);
}

// ------------------------------------------------ o separador de setor --

/** Os pares de células vizinhas (índice menor primeiro) e a aresta que as divide, uma vez. */
interface PlateEdge {
  a: number;
  b: number;
  /** A aresta compartilhada, do vértice ao vértice, no raio inteiro da casa (no meio da fissura). */
  d: string;
}

/**
 * As arestas entre células vizinhas, achadas pelas COORDENADAS: a vizinha de
 * uma célula de topo chato está a 3^½ do raio, na direção de 30° + 60°·k, e a
 * aresta que as divide liga os vértices k e k + 1 da célula.
 */
const ARESTAS: readonly PlateEdge[] = (() => {
  const achadas: PlateEdge[] = [];
  PLATE_CELLS.forEach((celula, a) => {
    for (let k = 0; k < 6; k++) {
      const graus = 60 * k + 30;
      const x = celula.x + RAIO * Math.sqrt(3) * Math.cos((graus * Math.PI) / 180);
      const y = celula.y + RAIO * Math.sqrt(3) * Math.sin((graus * Math.PI) / 180);
      const b = PLATE_CELLS.findIndex((o) => Math.abs(o.x - x) < 0.1 && Math.abs(o.y - y) < 0.1);
      if (b <= a) continue;
      const vertice = (n: number) => {
        const angulo = (Math.PI / 3) * n;
        return `${arredondar(celula.x + RAIO * Math.cos(angulo))} ${arredondar(celula.y + RAIO * Math.sin(angulo))}`;
      };
      achadas.push({ a, b, d: `M${vertice(k)}L${vertice(k + 1)}` });
    }
  });
  return achadas;
})();

/**
 * Os separadores de setor: onde duas células vizinhas pintam grupos DIFERENTES,
 * a aresta entre elas ganha um traço escuro. Separa qualquer par de grupos em
 * qualquer ordem — a célula do meio toca os seis, e a última fatia encosta na
 * primeira quando o prato fecha —, sem depender da cor.
 * Célula vazia não entra: ela já tem o contorno dela.
 */
export function plateDividers(fill: readonly (PlateGroup | undefined)[]): { a: number; b: number }[] {
  return arestasDeSetor(fill).map(({ a, b }) => ({ a, b }));
}

const arestasDeSetor = (fill: readonly (PlateGroup | undefined)[]) =>
  ARESTAS.filter(({ a, b }) => fill[a] !== undefined && fill[b] !== undefined && fill[a] !== fill[b]);

// ------------------------------------------------------- os padrões --

/** A marca de cada padrão, em unidades do viewBox: uma telha que se repete e, às vezes, gira. */
const FORMAS: Record<PlatePatternKind, { tamanho: number; giro: number; marcas: "linha" | "grade" | "pontos" }> = {
  diagonal: { tamanho: 5, giro: 45, marcas: "linha" },
  "counter-diagonal": { tamanho: 5, giro: -45, marcas: "linha" },
  horizontal: { tamanho: 5, giro: 0, marcas: "linha" },
  vertical: { tamanho: 5, giro: 90, marcas: "linha" },
  cross: { tamanho: 6, giro: 0, marcas: "grade" },
  dots: { tamanho: 5, giro: 0, marcas: "pontos" },
};

/**
 * O `<pattern>` de um grupo: o fundo é a cor do papel (uma classe da folha) e
 * as marcas, a tinta escura `--co-role-mark`. Atributos de apresentação, e
 * nenhum `style`: a CSP (`style-src 'self'`) aceita (ADR-024).
 */
function Padrao({ id, grupo }: { id: string; grupo: PlateGroup }) {
  const { tamanho, giro, marcas } = FORMAS[PLATE_PATTERN[grupo]];
  const meio = tamanho / 2;
  return (
    <pattern
      id={id}
      patternUnits="userSpaceOnUse"
      width={tamanho}
      height={tamanho}
      patternTransform={giro === 0 ? undefined : `rotate(${giro})`}
    >
      <rect className="co-plate__ground" data-group={grupo} width={tamanho} height={tamanho} />
      {marcas === "linha" ? <line className="co-plate__mark" x1="0" y1={meio} x2={tamanho} y2={meio} /> : null}
      {marcas === "grade" ? (
        <>
          <line className="co-plate__mark" x1="0" y1={meio} x2={tamanho} y2={meio} />
          <line className="co-plate__mark" x1={meio} y1="0" x2={meio} y2={tamanho} />
        </>
      ) : null}
      {marcas === "pontos" ? <circle className="co-plate__dot" cx={meio} cy={meio} r="1.2" /> : null}
    </pattern>
  );
}

export interface PlateArtProps {
  slices: readonly PlateSlice[];
  size?: "sm" | "lg";
  over?: boolean;
  /** O esqueleto: as células todas vazias, e elas pulsam enquanto carrega. */
  skeleton?: boolean;
  className?: string | undefined;
}

/**
 * Só o desenho, sem a legenda: o `Plate`, o `RecipeCard` e o `Skeleton` o
 * usam, e nenhum deles o mostra sem o texto que ele ilustra. Não é exportado
 * pelo pacote: um prato sem legenda seria cor sozinha.
 *
 * O setor de cada grupo tem o PADRÃO dele (`plate-pattern.ts`) e, onde o grupo
 * muda entre duas células vizinhas, um separador escuro (`plateDividers`): a
 * cor nunca é o único sinal, e assim nenhum par se confunde em cinza, por
 * protanopia ou no prato mini.
 *
 * Cada célula é um `<polygon>` com a chave da posição E do grupo: quando a
 * composição muda, só as células que trocam de grupo nascem de novo, e a
 * animação de entrada delas, atrasada pelo anel (`data-ring`), faz a onda do
 * centro para a borda. Nada de atributo `style`: o atraso é uma regra da folha
 * por anel, e a CSP do app continua de pé (ADR-024, ADR-025).
 */
export function PlateArt({ slices, size = "lg", over = false, skeleton = false, className }: PlateArtProps) {
  const prefixo = useId().replace(/[^\w-]/g, "");
  const grupos = skeleton ? PLATE_CELLS.map(() => undefined) : plateFill(slices);
  const usados = [...new Set(grupos.filter((g): g is PlateGroup => g !== undefined))];
  const arestas = arestasDeSetor(grupos);
  const classe = className ? `co-plate__art ${className}` : "co-plate__art";
  return (
    <svg
      className={classe}
      data-size={size}
      data-over={over ? "true" : undefined}
      data-skeleton={skeleton ? "true" : undefined}
      viewBox={CAIXA}
      aria-hidden="true"
      focusable="false"
    >
      {usados.length > 0 ? (
        <defs>
          {usados.map((grupo) => (
            <Padrao key={grupo} id={`${prefixo}-${grupo}`} grupo={grupo} />
          ))}
        </defs>
      ) : null}
      <circle className="co-plate__rim" cx="0" cy="0" r={ARO} />
      {PLATE_CELLS.map((celula, i) => {
        const grupo = grupos[i];
        return (
          <polygon
            key={`${i}:${grupo ?? "vazia"}`}
            className="co-plate__cell"
            data-ring={celula.ring}
            data-group={grupo}
            data-pattern={grupo ? PLATE_PATTERN[grupo] : undefined}
            fill={grupo ? `url(#${prefixo}-${grupo})` : undefined}
            points={PONTOS[i]}
          />
        );
      })}
      {arestas.length > 0 ? (
        <path
          className="co-plate__divider"
          d={arestas.map((e) => e.d).join("")}
        />
      ) : null}
    </svg>
  );
}

/**
 * O prato de colunas: a imagem de toda receita, nunca uma foto.
 *
 * Um mosaico de 37 colunas hexagonais, vistas de cima, que se completa
 * exatamente quando a receita fecha o alvo da refeição. Cada célula tem a cor
 * do grupo do alimento, com a mesma luminosidade nos seis (a identidade,
 * ADR-022), e cada grupo tem o seu padrão e o seu separador de setor: em cinza,
 * ou para quem não distingue o matiz, um setor não se funde ao vizinho. A célula vazia tem contorno de controle (3:1), e não só um fundo
 * quase igual ao da tela.
 *
 * A cor nunca é o único sinal (ADR-005): a legenda, com o nome e os gramas de
 * cada fatia, vem SEMPRE junto, em texto, e o `summary` diz quanto do alvo o
 * prato fecha. Por isso o desenho sai `aria-hidden` — quem não vê o desenho lê
 * a legenda, que é uma lista com nome, e o resumo.
 *
 * O prato recebe a composição pronta e não calcula nada: a fração de cada
 * grupo vem de quem consome. Quando ela muda, as células que trocam de cor
 * entram numa onda do centro para a borda, 12 ms por anel
 * (`--co-duration-wave`); com `prefers-reduced-motion`, elas trocam todas de
 * uma vez, com um esmaecer.
 */
export function Plate({
  slices,
  summary,
  size = "lg",
  over = false,
  label = "Composição do prato",
  className,
}: PlateProps) {
  const classe = className ? `co-plate ${className}` : "co-plate";
  return (
    <div className={classe} data-size={size}>
      <PlateArt slices={slices} size={size} over={over} />
      <div className="co-plate__text">
        <Text as="p" variant="footnote" tone="secondary" className="co-plate__summary">
          {summary}
        </Text>
        <Legend
          className="co-plate__legend"
          label={label}
          items={slices.map((s) => ({ label: s.label, tone: s.group, swatch: "hex" as const }))}
        />
      </div>
    </div>
  );
}
