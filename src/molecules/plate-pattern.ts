import type { PlateGroup } from "./Plate";

/**
 * O padrão de cada grupo do prato: a textura do setor e a MESMA da amostra da
 * legenda, para o setor se ligar ao nome sem depender do matiz nem da
 * luminância (que sozinha não separa seis grupos, ADR-025, adendo). Seis
 * formas diferentes de marca, na tinta escura `--co-role-mark`: traço
 * inclinado de um lado e do outro, horizontal, vertical, grade e pontos.
 *
 * É marcação de SVG (`<pattern>`) no prato e `gradient()` de arquivo na
 * amostra: nenhum estilo injetado, e a CSP do app continua de pé.
 */
export const PLATE_PATTERN: Readonly<Record<PlateGroup, PlatePatternKind>> = {
  protein: "diagonal",
  carb: "dots",
  veg: "horizontal",
  fruit: "counter-diagonal",
  dairy: "cross",
  fat: "vertical",
};

export type PlatePatternKind = "diagonal" | "counter-diagonal" | "horizontal" | "vertical" | "cross" | "dots";
