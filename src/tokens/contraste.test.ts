import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { hourStops, hourVars } from "../theme/hour";
import { bloco, type Declaracao } from "../test/folha";

/**
 * O piso de contraste do "Relógio de Sol", conferido na FONTE dos tokens, nos
 * dois temas (ADR-016, ADR-022).
 *
 * Sem este arquivo o piso é uma frase num documento: alguém clareia uma
 * primitiva por motivo estético, o CSS continua válido, o TypeScript continua
 * compilando, e o defeito só aparece para quem não consegue ler a tela.
 *
 * A conta é a do WCAG 2.2 (luminância relativa e razão de contraste), sobre o
 * valor JÁ RESOLVIDO de cada token. A cor da hora é OKLCH, e o teste a converte
 * para sRGB ele mesmo (as matrizes da CSS Color 4). Uma cor OKLCH pode cair
 * fora do sRGB, e os navegadores não a trazem de volta do mesmo jeito: uns
 * cortam cada canal, a especificação reduz o croma até caber. O teste mede os
 * DOIS caminhos, e o piso tem de valer nos dois.
 */

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

type Folha = Record<string, unknown>;

function ler(arquivo: string): Folha {
  return JSON.parse(readFileSync(resolve(raiz, "tokens", arquivo), "utf8")) as Folha;
}

const primitivas = ler("cor.json");
const claro = (ler("semantico.claro.json")["claro"] ?? {}) as Folha;
const escuro = (ler("semantico.escuro.json")["escuro"] ?? {}) as Folha;

/** Resolve `{pomes-100}` até o valor cru. */
function cru(token: unknown): string {
  const valor = (token as { $value?: string | number } | undefined)?.$value;
  if (valor === undefined) throw new Error("token sem $value");
  const referencia = /^\{(.+)\}$/.exec(String(valor));
  if (!referencia?.[1]) return String(valor);
  return cru(primitivas[referencia[1]]);
}

// ------------------------------------------------------------ as contas --

type Rgb = [number, number, number];

const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function deHex(hex: string): Rgb {
  const casado = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!casado?.[1]) throw new Error(`esperava #rrggbb, veio ${hex}`);
  const n = Number.parseInt(casado[1], 16);
  return [linear(((n >> 16) & 255) / 255), linear(((n >> 8) & 255) / 255), linear((n & 255) / 255)];
}

/** OKLCH → sRGB linear, sem cortar (CSS Color 4, § OKLab). */
function deOklch(l: number, c: number, h: number): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const cabe = (rgb: Rgb) => rgb.every((canal) => canal >= -1e-6 && canal <= 1 + 1e-6);
const corta = (rgb: Rgb): Rgb => rgb.map((canal) => Math.min(1, Math.max(0, canal))) as Rgb;

/** Os dois jeitos de trazer uma OKLCH fora do sRGB de volta. */
function oklchNosDoisCaminhos(l: number, c: number, h: number): { cortada: Rgb; reduzida: Rgb } {
  const cortada = corta(deOklch(l, c, h));
  // A especificação mantém a luminosidade e o matiz e reduz o croma até a cor
  // caber; a busca binária chega lá com folga de um milésimo de croma.
  let [baixo, alto] = [0, c];
  if (cabe(deOklch(l, c, h))) baixo = c;
  for (let passo = 0; passo < 30 && alto - baixo > 1e-4; passo += 1) {
    const meio = (baixo + alto) / 2;
    if (cabe(deOklch(l, meio, h))) baixo = meio;
    else alto = meio;
  }
  return { cortada, reduzida: corta(deOklch(l, baixo, h)) };
}

const luminancia = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function razao(frente: Rgb, fundo: Rgb): number {
  const [a, b] = [luminancia(frente), luminancia(fundo)];
  const [maior, menor] = a > b ? [a, b] : [b, a];
  return (maior + 0.05) / (menor + 0.05);
}

/** Uma cor de token: `#rrggbb` ou `oklch(l c h)` literal. */
function cor(valor: string): Rgb {
  const ok = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(valor);
  if (ok) return oklchNosDoisCaminhos(Number(ok[1]), Number(ok[2]), Number(ok[3])).cortada;
  return deHex(valor);
}

// ------------------------------------------------ a conversão, presa --

/*
 * A conta de contraste da hora só prova alguma coisa se `deOklch` estiver
 * certa. Sem estas âncoras, zerar o croma, trocar o seno pelo cosseno ou ler o
 * grau como radiano passavam todos os testes de baixo: o piso tem folga, e uma
 * cor errada ainda pode passar nele. Os valores esperados vêm do colorjs.io
 * 0.5.2 (a biblioteca dos autores da CSS Color 4), calculados fora do projeto
 * e escritos aqui: o colorjs não é dependência.
 */
const ANCORAS: [nome: string, oklch: [number, number, number], linear: Rgb][] = [
  ["o vermelho do sRGB", [0.627955, 0.257683, 29.234], [1, 0, 0]],
  ["o verde do sRGB", [0.86644, 0.294827, 142.4953], [0, 1, 0]],
  ["o azul do sRGB", [0.452014, 0.313214, 264.052], [0, 0, 1]],
  ["um ciano qualquer, oklch(0.6 0.1 200)", [0.6, 0.1, 200], [0.003958, 0.286374, 0.312522]],
];

/**
 * A cor de cada parada da hora, por tema, em sRGB linear SEM corte (o colorjs,
 * `to("srgb-linear")`): a tinta (`hora-ink`) e o preenchimento (`hora`). Prende
 * a conversão, as paradas da `hourVars` e a luminosidade de cada tema de uma
 * vez: mudar qualquer um dos três muda o número.
 */
const PARADAS_FIXADAS: Record<"claro" | "escuro", Record<string, { "hora-ink": Rgb; hora: Rgb }>> = {
  claro: {
    "06:00": { "hora-ink": [0.229739, 0.04347, 0.118452], hora: [0.791277, 0.294625, 0.496154] },
    "09:00": { "hora-ink": [0.229193, 0.064322, -0.02525], hora: [0.778961, 0.364758, 0.040805] },
    "12:00": { "hora-ink": [-0.040714, 0.135082, 0.220626], hora: [0.043131, 0.551662, 0.748784] },
    "16:00": { "hora-ink": [0.317351, 0.028213, -0.00251], hora: [1.007149, 0.265744, 0.127894] },
    "20:00": { "hora-ink": [0.085776, 0.071095, 0.31105], hora: [0.397862, 0.380408, 0.958192] },
  },
  escuro: {
    "06:00": { "hora-ink": [0.901596, 0.35228, 0.575317], hora: [0.69013, 0.243489, 0.424601] },
    "09:00": { "hora-ink": [0.886983, 0.431185, 0.065041], hora: [0.67994, 0.305367, 0.021032] },
    "12:00": { "hora-ink": [0.071758, 0.637676, 0.853068], hora: [0.019441, 0.47365, 0.653299] },
    "16:00": { "hora-ink": [1.138827, 0.321383, 0.163875], hora: [0.885645, 0.216577, 0.09712] },
    "20:00": { "hora-ink": [0.46566, 0.448172, 1.08207], hora: [0.337057, 0.319717, 0.843992] },
  },
};

const pertoDe = (medido: Rgb, esperado: Rgb, folga: number) =>
  medido.every((canal, i) => Math.abs(canal - (esperado[i] ?? Number.NaN)) <= folga);

describe("a conversão OKLCH → sRGB do teste, presa a âncoras", () => {
  it.each(ANCORAS)("%s cai onde o colorjs.io diz, com folga de 1e-3", (_nome, [l, c, h], esperado) => {
    const medido = deOklch(l, c, h);
    expect(
      pertoDe(medido, esperado, 1e-3),
      `oklch(${l} ${c} ${h}) deu (${medido.map((x) => x.toFixed(4)).join(", ")}), esperava (${esperado.join(", ")})`,
    ).toBe(true);
  });

  it.each(["claro", "escuro"] as const)("no tema %s, cada parada da hora tem a cor fixada, na tinta e no preenchimento", (nome) => {
    const tema = nome === "claro" ? claro : escuro;
    const l = (token: string) => Number(cru(tema[token]));
    for (const parada of hourStops) {
      const fixada = PARADAS_FIXADAS[nome][parada.time];
      expect(fixada, `a parada ${parada.time} tem valor fixado`).toBeDefined();
      for (const [papel, luz] of [
        ["hora-ink", l("hora-ink-l")],
        ["hora", l("hora-l")],
      ] as const) {
        const medido = deOklch(luz, parada.c, parada.h);
        const esperado = fixada?.[papel] as Rgb;
        expect(
          pertoDe(medido, esperado, 1e-4),
          `${papel} às ${parada.time} deu (${medido.map((x) => x.toFixed(6)).join(", ")}), esperava (${esperado.join(", ")})`,
        ).toBe(true);
      }
    }
  });
});

const PISO_TEXTO = 4.5;
const PISO_DESENHO = 3;

const TEMAS: [string, Folha][] = [
  ["claro", claro],
  ["escuro", escuro],
];

// ------------------------------------------------------------ a pedra --

/**
 * Os controles cujo LIMITE é o que diz "aqui se toca" (WCAG 1.4.11): o
 * contorno é desenho, então o piso é 3:1, sobre todo fundo em que um controle
 * mora. O segmentado e o stepper entram aqui mesmo tendo fundo próprio: sem o
 * contorno, as opções viram texto solto, sem cara de opção.
 */
const CONTROLES = [
  [".co-input", "campo"],
  [".co-search", "busca"],
  [".co-chip", "chip"],
  [".co-list-row__mark", "marca de radio e de checkbox"],
  [".co-segmented", "segmentado"],
  [".co-stepper", "stepper"],
  // O carrossel e as abas moram dentro de cartão: a seta e a fileira têm o
  // mesmo fundo do cartão, e sem o limite somem nele (slipalison/basalto#120).
  [".co-deck__arrow", "seta do carrossel"],
  [".co-tabs__list", "fileira de abas"],
] as const;

/** As declarações de contorno de um bloco, na ordem — sem o raio, que é forma. */
const contorno = (declaracoes: Declaracao[]) =>
  declaracoes.filter(([propriedade]) => /^border(?!-radius)/.test(propriedade));

describe.each(TEMAS)("a pedra no tema %s", (_nome, tema) => {
  const valor = (token: string) => cor(cru(tema[token]));

  // Todo fundo em que texto de verdade aparece. `surface-3` NÃO entra: é o
  // pressionado e o trilho de barra, e no claro a legenda mede 4,28:1 sobre
  // ele. Ele tem a prova dele logo abaixo, só com o que pode morar nele.
  const fundos = ["bg", "surface", "surface-2"] as const;

  it.each(["ink", "ink-2", "ink-3"])("%s passa em 4,5:1 em todo fundo de texto", (token) => {
    for (const fundo of fundos) {
      const r = razao(valor(token), valor(fundo));
      expect(r, `${token} sobre ${fundo} deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_TEXTO);
    }
  });

  it.each(["ok", "warn", "bad"])("%s passa em 4,5:1, porque também é texto (o erro, o aviso)", (token) => {
    for (const fundo of fundos) {
      const r = razao(valor(token), valor(fundo));
      expect(r, `${token} sobre ${fundo} deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_TEXTO);
    }
  });

  it.each([
    ["ok", "ok-soft"],
    ["warn", "warn-soft"],
    ["bad", "bad-soft"],
  ])("sobre %s-soft, a cor do estado, a tinta e a tinta 2 passam em 4,5:1", (estado, suave) => {
    for (const frente of [estado, "ink", "ink-2"]) {
      const r = razao(valor(frente), valor(suave));
      expect(r, `${frente} sobre ${suave} deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_TEXTO);
    }
  });

  it("surface-3 segura o que mora nele: a tinta e a tinta 2 (o ligado do botão-ícone) e o anel de foco", () => {
    for (const [frente, piso] of [
      ["ink", PISO_TEXTO],
      ["ink-2", PISO_TEXTO],
      ["focus", PISO_DESENHO],
    ] as const) {
      const r = razao(valor(frente), valor("surface-3"));
      expect(r, `${frente} sobre surface-3 deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(piso);
    }
  });

  it("o texto sobre a tinta sólida (primário, escolhido) passa em 4,5:1, e no hover também", () => {
    for (const fundo of ["ink", "ink-2"]) {
      const r = razao(valor("on-ink"), valor(fundo));
      expect(r, `on-ink sobre ${fundo} deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_TEXTO);
    }
  });

  it("a tinta sólida (o chip e o segmentado escolhidos, a marca ligada) se separa do fundo em 3:1", () => {
    for (const fundo of fundos) {
      const r = razao(valor("ink"), valor(fundo));
      expect(r, `ink sobre ${fundo} deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_DESENHO);
    }
  });

  it("o limite de controle passa em 3:1 sobre todo fundo onde um controle mora, e os controles o desenham", () => {
    // `--co-line` é a fissura do que NÃO se toca e fica abaixo de 3:1 de
    // propósito: um contorno de cartão a 3:1 pesaria a tela inteira. O limite
    // de controle é outro papel, com token próprio.
    for (const fundo of fundos) {
      const r = razao(valor("control"), valor(fundo));
      expect(r, `control sobre ${fundo} deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_DESENHO);
    }
    expect(razao(valor("line"), valor("bg")), "a fissura fica abaixo do limite de controle").toBeLessThan(
      razao(valor("control"), valor("bg")),
    );

    // E o token só vale se os controles o desenham: um chip que volta para
    // `--co-line` passa na conta acima e some na tela.
    for (const [seletor, controle] of CONTROLES) {
      expect(contorno(bloco(seletor)), `o contorno de ${controle} (${seletor})`).toEqual([
        ["border", "var(--co-control-width) solid var(--co-control)"],
      ]);
    }

    // O chip escolhido troca o contorno de controle pela tinta, e o limite dele
    // continua passando em 3:1 contra o que está atrás.
    const escolhido = contorno(bloco('.co-chip[data-selected="true"]'));
    expect(escolhido, "o contorno do chip escolhido").toEqual([["border-color", "var(--co-ink)"]]);
  });

  it("o anel de foco passa em 3:1 sobre todo fundo, o corpo da folha inclusive", () => {
    for (const fundo of [...fundos, "surface-3"]) {
      const r = razao(valor("focus"), valor(fundo));
      expect(r, `o anel sobre ${fundo} deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_DESENHO);
    }
  });

  it("ink-3 é o piso do texto, e control (desenho) fica abaixo dele", () => {
    // A hierarquia importa: se o desenho subisse acima da legenda, os dois
    // papéis colapsariam e a regra "isto não é para texto" perderia o sentido.
    for (const fundo of fundos) {
      expect(razao(valor("control"), valor(fundo))).toBeLessThan(razao(valor("ink-3"), valor(fundo)));
    }
  });

  it("os números da identidade (design/identidade.md, 'Contraste medido') batem, com uma casa", () => {
    const medido = (frente: string, fundo: string) => Math.round(razao(valor(frente), valor(fundo)) * 10) / 10;
    const esperado =
      _nome === "claro"
        ? { ink: 14.1, "ink-2": 7.5, "ink-3": 5.3, control: 3.7, focus: 5.5 }
        : { ink: 15.6, "ink-2": 9.8, "ink-3": 6.3, control: 5.1, focus: 8.9 };
    for (const [token, numero] of Object.entries(esperado)) expect(medido(token, "bg"), token).toBe(numero);
  });
});

// ------------------------------------------------------------ a hora --

describe.each(TEMAS)("a cor da hora no tema %s, o dia inteiro", (_nome, tema) => {
  const numero = (token: string) => Number(cru(tema[token]));
  const pedra = (token: string) => cor(cru(tema[token]));

  // As cinco paradas e, entre elas, a cada 15 minutos: a interpolação também
  // tem de passar, e não só as paradas que o desenho escolheu.
  const horas = Array.from({ length: 96 }, (_, i) => i * 15);

  /** O pior caso de um par ao longo do dia, nos dois caminhos de volta ao sRGB. */
  function pior(frente: (h: number, c: number) => Rgb[], fundo: (h: number, c: number) => Rgb[]) {
    let menor = { r: Number.POSITIVE_INFINITY, quando: "" };
    for (const minuto of horas) {
      const { h, c } = hourVars(minuto);
      const fs = frente(h, c);
      const bs = fundo(h, c);
      for (let i = 0; i < 2; i += 1) {
        const r = razao(fs[i % fs.length] as Rgb, bs[i % bs.length] as Rgb);
        if (r < menor.r) menor = { r, quando: `${Math.floor(minuto / 60)}h${String(minuto % 60).padStart(2, "0")}` };
      }
    }
    return menor;
  }

  const composta = (l: string, croma?: string) => (h: number, c: number) => {
    const { cortada, reduzida } = oklchNosDoisCaminhos(numero(l), croma ? numero(croma) : c, h);
    return [cortada, reduzida];
  };
  const fixa = (token: string) => () => [pedra(token)];

  it("as paradas que o teste percorre são as cinco da hourVars", () => {
    expect(hourStops.map((parada) => parada.time)).toEqual(["06:00", "09:00", "12:00", "16:00", "20:00"]);
    for (const parada of hourStops) expect(horas).toContain(Number(parada.time.slice(0, 2)) * 60);
  });

  it.each(["bg", "surface", "surface-2"])("a tinta da hora (texto) passa em 4,5:1 sobre %s", (fundo) => {
    const { r, quando } = pior(composta("hora-ink-l"), fixa(fundo));
    expect(r, `hora-ink sobre ${fundo} às ${quando} deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_TEXTO);
  });

  it("o texto sobre a cor da hora (on-hora) passa em 4,5:1", () => {
    const { r, quando } = pior(fixa("on-hora"), composta("hora-l"));
    expect(r, `on-hora sobre hora às ${quando} deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_TEXTO);
  });

  it("a tinta da hora e a tinta da pedra passam em 4,5:1 sobre o lavado da hora", () => {
    const tinta = pior(composta("hora-ink-l"), composta("hora-soft-l", "hora-soft-c"));
    expect(tinta.r, `hora-ink sobre hora-soft às ${tinta.quando} deu ${tinta.r.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      PISO_TEXTO,
    );
    const pedraNoLavado = pior(fixa("ink"), composta("hora-soft-l", "hora-soft-c"));
    expect(pedraNoLavado.r, `ink sobre hora-soft às ${pedraNoLavado.quando}`).toBeGreaterThanOrEqual(PISO_TEXTO);
  });

  /*
   * A marca de estado — o traço do destino atual no `Rail` e no `NavList`, e o
   * `Dot tone="accent"` — é desenho que diz "é aqui" (WCAG 1.4.11): 3:1 contra
   * o fundo em que ela está, a TODO minuto do dia. A cor e o fundo são lidos da
   * folha, e não escritos aqui: a marca que voltar para `--co-hora` (o
   * preenchimento, 1,56 a 2,15:1 no claro) reprova pela conta.
   */
  const ABA_ATUAL = '.co-tabbar__item[aria-current="page"]';
  const MARCAS = [
    ['.co-rail__item[aria-current="page"]::before', ['.co-rail__item[aria-current="page"]'], "a marca do trilho"],
    [".co-nav-list__item[aria-current]::after", [".co-nav-list__item[aria-current]"], "a marca da lista de destinos"],
    // A marca da aba atual mora na área da aba e encosta na barra: 3:1 contra
    // as duas (a área mede só 1,16 a 1,22:1 contra a barra, e por isso não é o
    // sinal).
    [`${ABA_ATUAL}::before`, [ABA_ATUAL, ".co-tabbar"], "a marca da aba atual"],
    ['.co-dot[data-tone="accent"]', [], "o Dot accent"],
  ] as const;
  const fundoDe = (itens: readonly string[]) => {
    if (itens.length === 0) return ["bg", "surface", "surface-2"];
    return itens.map((seletor) => {
      const valor = bloco(seletor).filter(([p]) => p === "background").at(-1)?.[1] ?? "";
      const token = /^var\(--co-([\w-]+)\)$/.exec(valor)?.[1];
      if (!token) throw new Error(`o fundo de ${seletor} não é um token: ${valor}`);
      return token;
    });
  };
  const todoMinuto = Array.from({ length: 24 * 60 }, (_, i) => i);

  it.each(MARCAS)("%s passa em 3:1 sobre o fundo do item, todo minuto do dia", (marca, itens, nome) => {
    const valor = bloco(marca).filter(([p]) => p === "background").at(-1)?.[1] ?? "";
    const papel = /^var\(--co-(hora(?:-ink)?)\)$/.exec(valor)?.[1];
    expect(papel, `${nome} pinta com a cor da hora (${valor})`).toBeDefined();
    for (const fundo of fundoDe(itens)) {
      let menor = { r: Number.POSITIVE_INFINITY, quando: 0 };
      for (const minuto of todoMinuto) {
        const { h, c } = hourVars(minuto);
        const { cortada, reduzida } = oklchNosDoisCaminhos(numero(`${papel}-l`), c, h);
        for (const frente of [cortada, reduzida]) {
          const r = razao(frente, pedra(fundo));
          if (r < menor.r) menor = { r, quando: minuto };
        }
      }
      const quando = `${Math.floor(menor.quando / 60)}h${String(menor.quando % 60).padStart(2, "0")}`;
      expect(menor.r, `${nome} (--co-${papel}) sobre ${fundo} às ${quando} deu ${menor.r.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        PISO_DESENHO,
      );
    }
  });

  it("a marca da aba atual é um traço de 3px na tinta da hora, no alto da área, e a aba a posiciona", () => {
    const marca = bloco(`${ABA_ATUAL}::before`);
    const de = (propriedade: string) => marca.filter(([p]) => p === propriedade).at(-1)?.[1];
    expect(de("content"), "a marca existe").toBe('""');
    expect(de("position")).toBe("absolute");
    expect(de("top"), "no alto da área").toBe("0");
    expect(de("height"), "3px de espessura").toBe("var(--co-marker-width)");
    expect(de("width")).toBe("var(--co-mark-size)");
    expect(bloco(".co-tabbar__item").find(([p]) => p === "position")?.[1], "a aba é o ponto de referência").toBe("relative");
  });

  /*
   * A aba atual da `TabBar` não pode se distinguir só pelo matiz: no escuro, a
   * tinta da hora contra o cinza das outras abas mede 1,00 a 1,12:1. Ela ganha
   * uma área de fundo sólida, mais escura que a barra (a s7 pede "área mais
   * escura"), com o raio de controle. A área não precisa de 3:1 contra a barra
   * (não é o único sinal: o peso e o `aria-current` vão junto), mas o rótulo e
   * o ícone sobre ela continuam a 4,5:1 e a 3:1, a todo minuto.
   */
  it("a aba atual da TabBar tem área de fundo sólida, e o rótulo e o ícone sobre ela passam em 4,5:1 e 3:1 todo minuto", () => {
    const atual = bloco('.co-tabbar__item[aria-current="page"]');
    const valor = (propriedade: string) => atual.filter(([p]) => p === propriedade).at(-1)?.[1] ?? "";
    const area = /^var\(--co-(surface-[23])\)$/.exec(valor("background"))?.[1];
    expect(area, `a aba atual tem área sólida em surface-2 ou -3 (veio "${valor("background")}")`).toBeDefined();
    expect(bloco(".co-tabbar__item").find(([p]) => p === "border-radius")?.[1]).toBe("var(--co-radius-control)");
    // Mais escura que a barra, nos dois temas.
    const barra = bloco(".co-tabbar").filter(([p]) => p === "background").at(-1)?.[1] ?? "";
    const fundoDaBarra = /^var\(--co-([\w-]+)\)$/.exec(barra)?.[1] ?? "";
    expect(luminancia(pedra(area ?? "bg")), "a área é mais escura que a barra").toBeLessThan(luminancia(pedra(fundoDaBarra)));

    const corDe = (seletor: string) =>
      /^var\(--co-([\w-]+)\)$/.exec(bloco(seletor).filter(([p]) => p === "color").at(-1)?.[1] ?? "")?.[1] ?? "";
    const rotulo = corDe('.co-tabbar__item[aria-current="page"]');
    const icone = corDe('.co-tabbar__item[aria-current="page"] .co-tabbar__icon');
    for (const [papel, piso, nome] of [
      [rotulo, PISO_TEXTO, "o rótulo"],
      [icone, PISO_DESENHO, "o ícone"],
    ] as const) {
      expect(papel, `${nome} da aba atual pinta com a tinta da hora`).toBe("hora-ink");
      let menor = { r: Number.POSITIVE_INFINITY, quando: 0 };
      for (let minuto = 0; minuto < 24 * 60; minuto += 1) {
        const { h, c } = hourVars(minuto);
        const { cortada, reduzida } = oklchNosDoisCaminhos(numero("hora-ink-l"), c, h);
        for (const frente of [cortada, reduzida]) {
          const r = razao(frente, pedra(area ?? "bg"));
          if (r < menor.r) menor = { r, quando: minuto };
        }
      }
      const quando = `${Math.floor(menor.quando / 60)}h${String(menor.quando % 60).padStart(2, "0")}`;
      expect(menor.r, `${nome} da aba atual sobre ${area} às ${quando} deu ${menor.r.toFixed(2)}:1`).toBeGreaterThanOrEqual(piso);
    }
  });

  it("a isca: a tinta da hora na luminosidade do preenchimento reprova sobre o fundo", () => {
    // Prova que a conta morde: trocar a L do texto pela do preenchimento (o
    // erro mais provável numa edição de token) derruba o contraste.
    const { r } = pior(composta(_nome === "claro" ? "hora-l" : "hora-soft-l"), fixa("bg"));
    expect(r).toBeLessThan(PISO_TEXTO);
  });
});

// ------------------------------------------------- os papéis do alimento --

/**
 * Os seis grupos do prato, na ordem em que o app os escreve (a ordem do `Plate`:
 * proteína, carboidrato, hortaliça, fruta, laticínio, gordura).
 *
 * A identidade (ADR-022) pede a MESMA luminosidade nos seis, para nenhum gritar
 * mais que o outro, e o piso se cumpre sem mexer nela: a cor nunca é o único
 * sinal (WCAG 1.4.1) e as partes do gráfico têm 3:1 contra o que está ao lado
 * (1.4.11). Quem separa os grupos é o PADRÃO de cada um (o mesmo na amostra da
 * legenda) e o separador de setor, em `role-mark`, que passa de 3:1 sobre todo
 * grupo — provados em `src/livro-de-receitas.test.tsx` e aqui —, com a legenda
 * em texto e o `summary` (ADR-005, ADR-025).
 */
const PAPEIS = ["role-protein", "role-carb", "role-veg", "role-fruit", "role-dairy", "role-fat"] as const;
/** Quanto a luminância relativa de um papel do alimento fica longe da tinta de ação (ADR-022). */
const DISTANCIA_DA_TINTA = 0.2;

describe.each(TEMAS)("os papéis do alimento no tema %s", (_nome, tema) => {
  const partes = (token: string) => {
    const casado = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(cru(tema[token]));
    if (!casado) throw new Error(`${token} não é oklch(l c h)`);
    return { l: Number(casado[1]), c: Number(casado[2]), h: Number(casado[3]) };
  };
  const luz = (papel: string, caminho: "cortada" | "reduzida") => {
    const { l, c, h } = partes(papel);
    return luminancia(oklchNosDoisCaminhos(l, c, h)[caminho]);
  };

  it("têm os matizes da identidade e a mesma luminosidade (o carboidrato, +0,06), nenhum grita mais que o outro", () => {
    expect(PAPEIS.map((papel) => partes(papel).h)).toEqual([25, 80, 150, 350, 240, 300]);
    const base = partes("role-protein").l;
    const croma = partes("role-protein").c;
    for (const papel of PAPEIS) {
      expect(partes(papel).l, papel).toBeCloseTo(papel === "role-carb" ? base + 0.06 : base, 5);
      expect(partes(papel).c, papel).toBeCloseTo(papel === "role-dairy" ? croma * 0.8 : croma, 5);
    }
  });

  it("se separam da tinta de ação em 0,2 de luminância, nos dois jeitos de voltar ao sRGB", () => {
    // A cor do dado nunca é o único sinal (o nome e a quantidade vão junto,
    // ADR-005). O que se garante aqui é que ela não se confunde com a ação (a
    // tinta) nem com o estado: croma de verdade e luminância longe da tinta.
    const tinta = luminancia(cor(cru(tema["ink"])));
    for (const papel of PAPEIS) {
      expect(partes(papel).c, papel).toBeGreaterThan(0.09);
      for (const caminho of ["cortada", "reduzida"] as const) {
        expect(Math.abs(luz(papel, caminho) - tinta), `${papel} (${caminho})`).toBeGreaterThan(DISTANCIA_DA_TINTA);
      }
    }
  });

  it("a tinta escura do padrão e do separador (role-mark) passa em 3:1 sobre o fundo de CADA grupo, nos dois jeitos de voltar ao sRGB", () => {
    // O padrão e o separador são o desenho que separa os setores (WCAG 1.4.11):
    // a marca e o traço precisam se ver sobre a cor de qualquer papel.
    const marca = cor(cru(tema["role-mark"]));
    for (const papel of PAPEIS) {
      for (const caminho of ["cortada", "reduzida"] as const) {
        const { l, c, h } = partes(papel);
        const r = razao(marca, oklchNosDoisCaminhos(l, c, h)[caminho]);
        expect(r, `role-mark sobre ${papel} (${caminho}) deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_DESENHO);
      }
    }
  });

  it("o separador de setor se vê: o traço escuro (role-mark) separa de cada grupo vizinho, e o contorno (role-edge) o separa da fissura, em 3:1 nos dois temas", () => {
    // O traço fica na fissura entre duas células, sobre o fundo do prato (bg,
    // surface ou surface-2) e entre duas cores de papel. No claro, a tinta
    // escura passa dos dois lados. No escuro, a escura passa contra os papéis e
    // some contra a fissura (1,05:1), e uma cor só não passa dos dois lados (os
    // papéis têm luminância média): o contorno claro, por baixo do traço, é o
    // que o separa da fissura, e o traço escuro, o que o separa dos papéis.
    const fissuras = ["bg", "surface", "surface-2"].map((fundo) => cor(cru(tema[fundo])));
    const marca = cor(cru(tema["role-mark"]));
    const contorno = cor(cru(tema["role-edge"]));
    for (const fundo of fissuras) {
      const r = razao(contorno, fundo);
      expect(r, `role-edge sobre a fissura deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_DESENHO);
    }
    for (const papel of PAPEIS) {
      for (const caminho of ["cortada", "reduzida"] as const) {
        const { l, c, h } = partes(papel);
        const fundoDoPapel = oklchNosDoisCaminhos(l, c, h)[caminho];
        const r = razao(marca, fundoDoPapel);
        expect(r, `role-mark sobre ${papel} (${caminho}) deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_DESENHO);
      }
    }
  });

  it("a isca: o role-mark sozinho, o único traço do tema escuro antes do contorno, mede perto de 1:1 contra a fissura", () => {
    // Prova que a medida morde: sem o `role-edge`, o traço escuro some no tema escuro.
    if (_nome !== "escuro") return;
    const marca = cor(cru(tema["role-mark"]));
    const piores = ["bg", "surface", "surface-2"].map((fundo) => razao(marca, cor(cru(tema[fundo]))));
    expect(Math.max(...piores)).toBeLessThan(1.5);
  });

  it("a isca: uma tinta de marca clara (role-mark baixado) reprova em 3:1 sobre algum grupo", () => {
    // Prova que a medida morde: a tinta de ação do tema, clara no escuro e escura
    // no claro, é o que NÃO pode servir de marca onde o fundo é do mesmo lado.
    const clara = cor(cru(tema[_nome === "claro" ? "surface" : "ink"]));
    const piores = PAPEIS.map((papel) => {
      const { l, c, h } = partes(papel);
      return razao(clara, oklchNosDoisCaminhos(l, c, h).cortada);
    });
    expect(Math.min(...piores)).toBeLessThan(PISO_DESENHO);
  });
});

describe.each(TEMAS)("o prato, no tema %s: a célula vazia se vê", (_nome, tema) => {
  const valor = (token: string) => cor(cru(tema[token]));

  it("a célula vazia se contorna com o limite de controle, que passa em 3:1 sobre todo fundo onde o prato mora", () => {
    // O trilho `surface-3` mede 1,2:1 contra o fundo: a parte que falta para o
    // alvo só existia como uma mancha. O contorno é o desenho que a mostra.
    expect(Object.fromEntries(bloco(".co-plate__cell:not([data-group])"))).toMatchObject({
      stroke: "var(--co-control)",
      "stroke-width": "var(--co-control-width)",
    });
    for (const fundo of ["bg", "surface", "surface-2"]) {
      const r = razao(valor("control"), valor(fundo));
      expect(r, `o contorno da célula vazia sobre ${fundo} deu ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(PISO_DESENHO);
    }
  });

  it("a isca: o trilho sozinho, sem contorno, fica abaixo de 3:1 sobre o fundo", () => {
    expect(razao(valor("surface-3"), valor("bg"))).toBeLessThan(PISO_DESENHO);
  });
});
