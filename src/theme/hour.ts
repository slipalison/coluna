/**
 * A cor da hora (ADR-022, ADR-024).
 *
 * No "Relógio de Sol" a cor do aplicativo anda com o relógio: cada refeição é
 * tingida pela hora em que acontece — aurora rosada às 6h, açafrão às 9h, céu
 * ao meio-dia, entardecer às 16h, anil às 20h —, sobre uma pedra que não muda.
 * A hora é cor de LUGAR, nunca de ação: o botão principal é a pedra.
 *
 * A cor é composta em OKLCH pela folha, e a divisão é esta:
 *
 *   o JS dá o matiz e o croma   `--co-hora-h`, `--co-hora-c` (esta função)
 *   o tema dá a luminosidade    `--co-hora-l`, `--co-hora-ink-l`, `--co-hora-soft-l`
 *   a folha compõe              `--co-hora`, `--co-hora-ink`, `--co-hora-soft`
 *
 * É por isso que o contraste é garantido pelo tema, e não por quem chama: a
 * luminosidade de cada composição é fixa por tema, e o teste de contraste
 * percorre o dia inteiro com esta mesma função.
 */

import type { CSSProperties } from "react";

/** As cinco paradas do dia: minuto do dia, matiz (graus) e croma. */
const PARADAS: readonly (readonly [minuto: number, matiz: number, croma: number])[] = [
  [6 * 60, 350, 0.11], // aurora
  [9 * 60, 75, 0.14], // manhã
  [12 * 60, 215, 0.12], // meio-dia
  [16 * 60, 40, 0.15], // entardecer
  [20 * 60, 285, 0.12], // noite
];

const DIA = 24 * 60;

/** O matiz (0 a 360, uma casa) e o croma (três casas) de uma hora do dia. */
export interface HourVars {
  h: number;
  c: number;
}

/** As paradas, para quem precisa percorrê-las (o teste de contraste, a vitrine). */
export const hourStops: readonly { time: string; h: number; c: number }[] = PARADAS.map(([minuto, h, c]) => ({
  time: `${String(minuto / 60).padStart(2, "0")}:00`,
  h,
  c,
}));

/**
 * Lê `"HH:MM"` (00:00 a 23:59) ou um minuto do dia (0 a 1439). Hora que não
 * existe é erro de quem chama, e erro alto: uma cor errada em silêncio pintaria
 * a refeição de outra hora sem ninguém notar. Tudo que não é hora — inclusive o
 * que não é texto nem número — é `RangeError`.
 */
function minutoDoDia(time: string | number): number {
  if (typeof time === "number") {
    if (!Number.isInteger(time) || time < 0 || time >= DIA) {
      throw new RangeError(`minuto do dia fora de 0 a 1439: ${time}`);
    }
    return time;
  }
  // O tipo diz texto ou número, mas a hora vem de JSON e de JS sem tipo: um
  // `null` ou um objeto chegaria ao `trim()` e sairia como `TypeError`, um
  // erro que diz "bug de código" quando o que houve foi uma hora inválida.
  if (typeof time !== "string") throw new RangeError(`hora fora do formato HH:MM: ${Object.prototype.toString.call(time)}`);
  const casado = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!casado) throw new RangeError(`hora fora do formato HH:MM: "${time}"`);
  return Number(casado[1]) * 60 + Number(casado[2]);
}

const umaCasa = (n: number) => Math.round(n * 10) / 10;
const tresCasas = (n: number) => Math.round(n * 1000) / 1000;

/**
 * O matiz e o croma da hora. Entre duas paradas, interpola: o matiz pelo arco
 * MENOR do círculo (das 16h às 20h ele vai de 40 a 285 passando por 0, e não
 * pelo verde), e o croma em linha reta. Das 20h às 6h a conta atravessa a
 * meia-noite: a noite vai do anil à aurora sem salto às 00:00.
 *
 *   hourVars("12:30")  // { h: 193.1, c: 0.124 }
 */
export function hourVars(time: string | number): HourVars {
  const minuto = minutoDoDia(time);
  // A primeira parada depois deste minuto; nenhuma (depois das 20h) ou a
  // primeira (antes das 6h) quer dizer que estamos na noite, entre a última e
  // a primeira.
  const seguinte = PARADAS.findIndex(([m]) => m > minuto);
  const fim = seguinte <= 0 ? 0 : seguinte;
  const inicio = (fim - 1 + PARADAS.length) % PARADAS.length;
  const [mA, hA, cA] = PARADAS[inicio] as (typeof PARADAS)[number];
  const [mB, hB, cB] = PARADAS[fim] as (typeof PARADAS)[number];

  const vao = (mB - mA + DIA) % DIA;
  const andado = (minuto - mA + DIA) % DIA;
  const t = andado / vao;

  let giro = hB - hA;
  if (giro > 180) giro -= 360;
  if (giro < -180) giro += 360;

  return {
    h: umaCasa((((hA + giro * t) % 360) + 360) % 360),
    c: tresCasas(cA + (cB - cA) * t),
  };
}

/**
 * As duas propriedades, prontas para a prop `style` do React:
 *
 *   <section style={hourStyle(refeicao.horario)}>…</section>
 *
 * O React escreve uma propriedade personalizada pelo CSSOM
 * (`style.setProperty`), e a CSP `style-src 'self'` do Basalto não barra o
 * CSSOM — barra o ATRIBUTO `style` escrito na marcação e o `<style>`
 * injetado. Por isso isto vale no aplicativo que renderiza no navegador; HTML
 * gerado no servidor sairia com o atributo, e a CSP o recusaria.
 */
export function hourStyle(time: string | number): HourStyle {
  const { h, c } = hourVars(time);
  // O tipo do React não conhece propriedade personalizada; a interseção diz
  // as duas que vêm aqui e continua cabendo na prop `style`.
  return { "--co-hora-h": String(h), "--co-hora-c": String(c) } as HourStyle;
}

/** O que `hourStyle` devolve: a prop `style` com as duas propriedades da hora. */
export type HourStyle = CSSProperties & Record<"--co-hora-h" | "--co-hora-c", string>;

/**
 * O mesmo, fora do React: escreve as duas propriedades no elemento pelo
 * CSSOM. NUNCA `setAttribute("style", …)`, que é o atributo que a CSP barra.
 * O elemento e tudo dentro dele passam a ter a cor daquela hora.
 */
export function applyHour(element: HTMLElement, time: string | number): void {
  const { h, c } = hourVars(time);
  element.style.setProperty("--co-hora-h", String(h));
  element.style.setProperty("--co-hora-c", String(c));
}
