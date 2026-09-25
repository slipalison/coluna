import type { CSSProperties } from "react";
import { Text } from "../atoms/Text";

export interface RulerMark {
  /** Onde a marca fica, na unidade da régua (kcal, kg, o que for). */
  value: number;
  /**
   * A marca em destaque: a estimativa usada, o valor de hoje.
   *
   * Ela muda de FORMA e de cor — traço da altura inteira e mais grosso —,
   * porque cor sozinha não é sinal (ADR-005): em escala de cinza, e para quem
   * não separa o acento do cinza, a marca usada continua sendo a mais alta.
   */
  emphasis?: boolean;
}

export interface RulerTick {
  value: number;
  /** O texto, JÁ FORMATADO. O sistema não formata número: formato é do idioma, e idioma é do aplicativo. */
  text: string;
}

export interface RulerProps {
  marks: readonly RulerMark[];
  /** A faixa pintada entre duas posições: a incerteza, o intervalo em que o valor mora. */
  band?: { from: number; to: number } | undefined;
  /**
   * Os extremos da régua. Sem eles, ela vai da menor à maior posição pedida
   * (marcas, faixa e rótulos), com 10% de folga de cada lado — a folga é o
   * que deixa o rótulo da ponta caber sem escapar da moldura.
   */
  min?: number | undefined;
  max?: number | undefined;
  /** Rótulos embaixo da régua, em HTML, centrados na posição de cada um. */
  ticks?: readonly RulerTick[] | undefined;
  /** Rótulo para leitor de tela. Sem ele a régua sai decorativa, como a `Slat`. */
  label?: string | undefined;
  className?: string | undefined;
}

/** Folga de cada lado quando os extremos não são dados, em fração do intervalo. */
const FOLGA = 0.1;

type Escala = { readonly de: number; readonly ate: number };

function escalaDe(posicoes: readonly number[], min?: number, max?: number): Escala {
  const finitas = posicoes.filter(Number.isFinite);
  const menor = finitas.length > 0 ? Math.min(...finitas) : 0;
  const maior = finitas.length > 0 ? Math.max(...finitas) : 0;
  const folga = (maior - menor) * FOLGA || 1;
  const de = min !== undefined && Number.isFinite(min) ? min : menor - folga;
  const ate = max !== undefined && Number.isFinite(max) ? max : maior + folga;
  return { de, ate };
}

/** A posição em porcentagem da largura, grampeada na régua: fora dela é a ponta, não um erro. */
function porcento({ de, ate }: Escala, valor: number): string {
  const fracao = ate === de ? 0.5 : (valor - de) / (ate - de);
  const grampeada = Math.min(1, Math.max(0, fracao));
  return `${Math.round(grampeada * 10000) / 100}%`;
}

function posicao(escala: Escala, valor: number): CSSProperties {
  return { ["--co-ruler-at" as string]: porcento(escala, valor) };
}

/**
 * Várias estimativas do mesmo número numa escala só.
 *
 * Três fórmulas dão três taxas basais diferentes para a mesma pessoa, e a
 * distância entre a menor e a maior é o quanto nenhuma delas sabe. Em prosa
 * isso vira "as fórmulas divergem em até 86 kcal"; na régua a faixa É a
 * incerteza, desenhada, e a marca usada aparece dentro dela — ou fora, que é
 * a informação mais importante de todas.
 *
 * É HTML e CSS, e não SVG, pelo mesmo motivo de a `Series` não ter eixo:
 * texto dentro do desenho prende a cor no tema de quem desenhou e escapa da
 * moldura. As posições saem de propriedades CSS (`--co-ruler-at`), como o
 * valor da `Slat`.
 *
 * A régua não sabe o que mede. Recebe números e já recebe o texto formatado
 * dos rótulos — quem sabe que aquilo é kcal, e qual fórmula é qual, é o
 * aplicativo (ADR-003).
 *
 * Sem `label` ela sai `aria-hidden`, rótulos inclusive: quase sempre ela
 * acompanha uma lista que já diz cada número em texto, e repetir os números
 * para o leitor de tela só dobra a leitura. Com `label`, ela vira uma imagem
 * com nome — e o nome tem de dizer o que a régua mostra.
 */
export function Ruler({ marks, band, min, max, ticks, label, className }: Readonly<RulerProps>) {
  const posicoes = [
    ...marks.map((marca) => marca.value),
    ...(band ? [band.from, band.to] : []),
    ...(ticks ?? []).map((rotulo) => rotulo.value),
  ];
  const escala = escalaDe(posicoes, min, max);
  const classe = className ? `co-ruler ${className}` : "co-ruler";
  const visiveis = marks.filter((marca) => Number.isFinite(marca.value));
  const faixa =
    band && Number.isFinite(band.from) && Number.isFinite(band.to)
      ? { de: Math.min(band.from, band.to), ate: Math.max(band.from, band.to) }
      : undefined;

  return (
    <div
      className={classe}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div className="co-ruler__track">
        <span className="co-ruler__axis" />
        {faixa ? (
          <span
            className="co-ruler__band"
            style={{
              ["--co-ruler-from" as string]: porcento(escala, faixa.de),
              ["--co-ruler-to" as string]: porcento(escala, faixa.ate),
            }}
          />
        ) : null}
        {visiveis.map((marca, indice) => (
          <span
            // Duas estimativas podem cair no mesmo número; a ordem é a
            // identidade que sobra, e a lista não se reordena sozinha.
            key={indice}
            className="co-ruler__mark"
            data-emphasis={marca.emphasis ? "true" : undefined}
            style={posicao(escala, marca.value)}
          />
        ))}
      </div>
      {ticks && ticks.length > 0 ? (
        <div className="co-ruler__ticks">
          {ticks
            .filter((rotulo) => Number.isFinite(rotulo.value))
            .map((rotulo) => (
              <Text
                key={`${rotulo.value}-${rotulo.text}`}
                as="span"
                variant="caption"
                tone="subtle"
                numeric
                className="co-ruler__tick"
                style={posicao(escala, rotulo.value)}
              >
                {rotulo.text}
              </Text>
            ))}
        </div>
      ) : null}
    </div>
  );
}
