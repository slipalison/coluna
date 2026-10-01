/// <reference types="vite/client" />
import { render } from "@testing-library/react";
import type { CSSProperties, ReactNode } from "react";
import { expect, it } from "vitest";
import { Screen } from "./atoms/Screen";
import { Rail } from "./molecules/Rail";
import { TabBar } from "./molecules/TabBar";
import "./styles.css";
import folha from "./styles.css?raw";

/**
 * A área segura do aparelho (ADR-011): qual custom property cada regra lê, e a
 * sobrescrita de quem consome chegando até a regra.
 *
 * O happy-dom troca `var()` pelo valor que o ancestral declarou, mas não faz
 * conta: devolve `calc(28px + 59px)` como TEXTO, não expande `padding-block` em
 * `padding-top`, e descarta o `padding-bottom` com `max()` da barra (fica o
 * `10px` do atalho, que num navegador de verdade estaria errado). Então cada
 * regra é provada de um destes jeitos, e nenhuma fica sem um:
 *
 * - VALOR RESOLVIDO, onde o happy-dom substitui o `var()`: a moldura em cima,
 *   embaixo e nas laterais, a reserva da tela com barra e o recuo do trilho. A
 *   área segura é declarada num `div` ANCESTRAL, como o aparelho (ou o
 *   consumidor) faria, e o teste lê o que chegou à regra.
 * - TEXTO DA REGRA, lido desta folha sem comentário e AVALIADO, onde ele não
 *   resolve: a barra de abas e a ordem das declarações. A avaliação aplica as
 *   declarações na ordem em que vêm, como a cascata faz dentro de um bloco — é
 *   o que vê um atalho `padding` depois do recuo, que um teste de "contém"
 *   aprovaria.
 *
 * O número em pixel, medido na tela, é do Chromium: o E2E do Basalto o mede.
 */

// ------------------------------------------------------------ a folha lida --

type Declaracao = readonly [propriedade: string, valor: string];
interface Regra {
  seletores: string[];
  declaracoes: Declaracao[];
}

const normalizar = (texto: string) => texto.replace(/\s+/g, " ").trim();

const REGRAS: Regra[] = [
  ...folha.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{};]*)\{([^{}]*)\}/g),
].map(([, seletor = "", corpo = ""]) => ({
  seletores: normalizar(seletor).split(/\s*,\s*/),
  declaracoes: corpo
    .split(";")
    .map(normalizar)
    .filter(Boolean)
    .map((linha) => {
      const doisPontos = linha.indexOf(":");
      return [linha.slice(0, doisPontos).trim(), normalizar(linha.slice(doisPontos + 1))] as const;
    }),
}));

/** O bloco do seletor — e só um: um segundo bloco igual mais abaixo venceria este. */
function bloco(seletor: string): Declaracao[] {
  const achados = REGRAS.filter((r) => r.seletores.length === 1 && r.seletores[0] === seletor);
  expect(achados, `blocos de ${seletor}`).toHaveLength(1);
  return achados[0]?.declaracoes ?? [];
}

const paddings = (declaracoes: Declaracao[]) =>
  declaracoes.filter(([p]) => p.startsWith("padding"));

/** Nenhuma outra regra que alcança o seletor mexe no `padding` dele. */
function soEstesMexemNoPadding(alcanca: RegExp, donos: string[]) {
  const outras = REGRAS.filter(
    (r) =>
      r.seletores.some((s) => alcanca.test(s)) &&
      !donos.includes(r.seletores.join(", ")) &&
      paddings(r.declaracoes).length > 0,
  ).map((r) => r.seletores.join(", "));
  expect(outras, `outras regras com padding em ${String(alcanca)}`).toEqual([]);
}

// -------------------------------------------------------- a conta avaliada --

/**
 * Valores que a conta usa no lugar do navegador. As chaves `safe-area-inset-*`
 * são o APARELHO (o que o `env()` devolveria); as `--co-*`, o CONSUMIDOR que
 * sobrescreve uma propriedade. O que não estiver aqui vem do `:root` da folha
 * carregada — os tokens e as próprias `--co-safe-*`.
 */
type Valores = Readonly<Record<string, string>>;

const raiz = (nome: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(nome).trim();

function aparelho(topo: number, direita: number, baixo: number, esquerda: number): Valores {
  return {
    "safe-area-inset-top": `${topo}px`,
    "safe-area-inset-right": `${direita}px`,
    "safe-area-inset-bottom": `${baixo}px`,
    "safe-area-inset-left": `${esquerda}px`,
  };
}

const SEM_AREA: Valores = {};

/**
 * `calc`, `max`, `min`, `var` e `env`, em px — o que a folha usa nessas regras.
 * Sem fallback e sem valor, `env()` e `var()` FALHAM em vez de valer zero: uma
 * declaração que não chega até a regra é o defeito que este teste procura.
 */
function avaliar(texto: string, valores: Valores): number {
  let i = 0;
  const pular = () => {
    while (/\s/.test(texto[i] ?? "")) i++;
  };
  const esperar = (caractere: string) => {
    pular();
    if (texto[i] !== caractere) throw new Error(`esperava "${caractere}" em ${i}: ${texto}`);
    i++;
  };
  const nome = () => {
    const achado = /^[-\w]+/.exec(texto.slice(i));
    if (!achado) throw new Error(`esperava um nome em ${i}: ${texto}`);
    i += achado[0].length;
    return achado[0];
  };
  // O fallback de var()/env() fica cru até a vírgula ou o parêntese que fecha.
  const cru = () => {
    pular();
    const inicio = i;
    for (let nivel = 0; i < texto.length; i++) {
      if (texto[i] === "(") nivel++;
      else if (texto[i] === ")" && nivel-- === 0) break;
    }
    return texto.slice(inicio, i).trim();
  };

  function termo(): number {
    pular();
    if (texto[i] === "(") {
      i++;
      const valor = soma();
      esperar(")");
      return valor;
    }
    const numero = /^\d+(\.\d+)?(px)?/.exec(texto.slice(i));
    if (numero) {
      i += numero[0].length;
      return Number.parseFloat(numero[0]);
    }
    const funcao = nome();
    esperar("(");
    if (funcao === "calc") {
      const valor = soma();
      esperar(")");
      return valor;
    }
    if (funcao === "max" || funcao === "min") {
      const argumentos = [soma()];
      for (pular(); texto[i] === ","; pular()) {
        i++;
        argumentos.push(soma());
      }
      esperar(")");
      return funcao === "max" ? Math.max(...argumentos) : Math.min(...argumentos);
    }
    if (funcao === "var" || funcao === "env") {
      pular();
      const chave = nome();
      pular();
      let reserva: string | undefined;
      if (texto[i] === ",") {
        i++;
        reserva = cru();
      }
      esperar(")");
      const valor =
        valores[chave] ?? (funcao === "var" ? raiz(chave) || undefined : undefined) ?? reserva;
      if (valor === undefined) throw new Error(`${funcao}(${chave}) sem valor e sem fallback`);
      return avaliar(valor, valores);
    }
    throw new Error(`função que esta conta não conhece: ${funcao}()`);
  }

  function soma(): number {
    let valor = termo();
    for (
      pular();
      (texto[i] === "+" || texto[i] === "-") && /\s/.test(texto[i + 1] ?? "");
      pular()
    ) {
      const sinal = texto[i];
      i++;
      const outro = termo();
      valor = sinal === "+" ? valor + outro : valor - outro;
    }
    return valor;
  }

  const valor = soma();
  pular();
  if (i !== texto.length) throw new Error(`sobrou "${texto.slice(i)}" em: ${texto}`);
  return valor;
}

/** Corta um valor nos espaços de primeiro nível: `max(a, b) max(c, d)` são dois. */
function partes(valor: string): string[] {
  const saida: string[] = [];
  let atual = "";
  let nivel = 0;
  for (const caractere of valor) {
    if (caractere === "(") nivel++;
    if (caractere === ")") nivel--;
    if (caractere === " " && nivel === 0) {
      if (atual) saida.push(atual);
      atual = "";
    } else atual += caractere;
  }
  if (atual) saida.push(atual);
  return saida;
}

interface Caixa {
  topo: number;
  direita: number;
  baixo: number;
  esquerda: number;
}

/**
 * O `padding` que vale depois de aplicar as declarações NA ORDEM, como a
 * cascata faz dentro de um bloco: um atalho depois do lado apaga o lado.
 * Escrita horizontal, então `block` é topo/baixo e `inline` é esquerda/direita.
 */
function paddingQueVale(declaracoes: Declaracao[], valores: Valores): Caixa {
  const caixa: Caixa = { topo: 0, direita: 0, baixo: 0, esquerda: 0 };
  for (const [propriedade, valor] of paddings(declaracoes)) {
    const v = partes(valor).map((parte) => avaliar(parte, valores));
    const [a = 0, b = a, c = a, d = b] = v;
    switch (propriedade) {
      case "padding":
        Object.assign(caixa, { topo: a, direita: b, baixo: c, esquerda: d });
        break;
      case "padding-block":
        Object.assign(caixa, { topo: a, baixo: b });
        break;
      case "padding-inline":
        Object.assign(caixa, { esquerda: a, direita: b });
        break;
      case "padding-top":
      case "padding-block-start":
        caixa.topo = a;
        break;
      case "padding-bottom":
      case "padding-block-end":
        caixa.baixo = a;
        break;
      case "padding-left":
      case "padding-inline-start":
        caixa.esquerda = a;
        break;
      case "padding-right":
      case "padding-inline-end":
        caixa.direita = a;
        break;
      default:
        throw new Error(`propriedade de padding que esta conta não conhece: ${propriedade}`);
    }
  }
  return caixa;
}

// ----------------------------------------------------- o que se monta aqui --

const ABAS = [
  { value: "diario", label: "Diário", icon: "book" },
  { value: "gasto", label: "Gasto", icon: "chart" },
] as const;

/** Um ancestral que declara a área segura, como o consumidor faria por cima da folha. */
function Por({
  area,
  children,
}: Readonly<{ area: Readonly<Record<string, string>>; children: ReactNode }>) {
  return <div style={area as CSSProperties}>{children}</div>;
}

const IPHONE = {
  "--co-safe-top": "59px",
  "--co-safe-right": "47px",
  "--co-safe-bottom": "34px",
  "--co-safe-left": "21px",
};

function resolvido(elemento: Element | null, propriedade: string): string {
  expect(elemento, `elemento para ${propriedade}`).not.toBeNull();
  return normalizar(getComputedStyle(elemento as Element).getPropertyValue(propriedade));
}

function montar(area: Readonly<Record<string, string>>) {
  const { container } = render(
    <Por area={area}>
      <Screen data-testid="sem-barra">conteúdo</Screen>
      <Screen tabBar data-testid="com-barra">
        conteúdo
      </Screen>
      <TabBar label="Seções" items={ABAS} value="diario" onChange={() => undefined} />
      <Rail
        label="Aberto"
        items={ABAS}
        value="diario"
        onChange={() => undefined}
        header={<span>Basalto</span>}
      />
      <Rail
        label="Recolhido"
        items={ABAS}
        value="diario"
        onChange={() => undefined}
        header={<span>Basalto</span>}
        collapsed
      />
    </Por>,
  );
  return {
    semBarra: container.querySelector('[data-testid="sem-barra"]'),
    comBarra: container.querySelector('[data-testid="com-barra"]'),
    cabecalho: container.querySelector('nav[aria-label="Aberto"] .co-rail__header'),
    cabecalhoRecolhido: container.querySelector('nav[aria-label="Recolhido"] .co-rail__header'),
  };
}

/** A primeira e a segunda parte do `padding-block` resolvido: o topo e o rodapé. */
function blocoResolvido(elemento: Element | null): [string, string] {
  const [topo = "", baixo = ""] = partes(resolvido(elemento, "padding-block"));
  return [topo, baixo];
}

const BARRA = () => bloco(".co-tabbar");
const RESERVA = '.co-screen[data-tabbar="true"]';
const CABECALHO = ".co-rail__header";
const RECOLHIDO = '.co-rail[data-collapsed="true"] .co-rail__header';

// ------------------------------------------------------------------ testes --

it("a área segura é pública: quatro custom properties com env() e reserva de 0px", () => {
  // Declaradas SÓ no `:root`, uma vez cada, na ordem. Repetida num componente,
  // a declaração dele faria sombra à do consumidor (a tela debaixo do aviso
  // voltaria a somar a área de cima).
  const declaradas = REGRAS.flatMap((r) =>
    r.declaracoes
      .filter(([p]) => p.startsWith("--co-safe-"))
      .map(([p, v]) => [r.seletores.join(", "), p, v]),
  );
  expect(declaradas).toEqual(
    ["top", "right", "bottom", "left"].map((lado) => [
      ":root",
      `--co-safe-${lado}`,
      `env(safe-area-inset-${lado}, 0px)`,
    ]),
  );
  for (const lado of ["top", "right", "bottom", "left"]) {
    expect(raiz(`--co-safe-${lado}`)).toBe(`env(safe-area-inset-${lado}, 0px)`);
  }

  // Pública quer dizer que quem consome zera: um contêiner com
  // `--co-safe-top: 0px` faz a moldura e o trilho de dentro deixarem de recuar.
  const zerado = montar({ "--co-safe-top": "0px" });
  expect(blocoResolvido(zerado.semBarra)[0]).toBe("calc(28px + 0px)");
  expect(resolvido(zerado.cabecalho, "padding-block-start")).toBe("0px");
});

it("a moldura soma a área segura de cima ao respiro de 28px", () => {
  const { semBarra, comBarra } = montar(IPHONE);
  expect(blocoResolvido(semBarra)[0]).toBe("calc(28px + 59px)");
  expect(blocoResolvido(comBarra)[0]).toBe("calc(28px + 59px)");
  expect(avaliar(blocoResolvido(semBarra)[0], SEM_AREA)).toBe(87);

  const moldura = bloco(".co-screen");
  soEstesMexemNoPadding(/\.co-screen(?![\w-])/, [".co-screen"]);
  expect(paddingQueVale(moldura, aparelho(59, 0, 34, 0)).topo).toBe(87);
  expect(paddingQueVale(moldura, SEM_AREA).topo).toBe(28);
});

it("a moldura sem barra soma a área segura de baixo ao respiro de 40px", () => {
  const { semBarra } = montar(IPHONE);
  expect(blocoResolvido(semBarra)[1]).toBe("calc(40px + 34px)");
  expect(avaliar(blocoResolvido(semBarra)[1], SEM_AREA)).toBe(74);
  expect(paddingQueVale(bloco(".co-screen"), aparelho(59, 0, 34, 0)).baixo).toBe(74);
});

it("a calha lateral fica com o maior entre 16px e a área segura de cada lado", () => {
  const { semBarra } = montar(IPHONE);
  const calha = resolvido(semBarra, "padding-inline");
  expect(calha).toBe("max(16px, 21px) max(16px, 47px)");
  expect(partes(calha).map((lado) => avaliar(lado, SEM_AREA))).toEqual([21, 47]);

  // Menor que a calha, o entalhe não a encolhe; maior, ele a alarga sem somar.
  const moldura = bloco(".co-screen");
  const { esquerda, direita } = paddingQueVale(moldura, aparelho(0, 12, 0, 8));
  expect([esquerda, direita]).toEqual([16, 16]);
  const paisagem = paddingQueVale(moldura, aparelho(0, 47, 21, 47));
  expect([paisagem.esquerda, paisagem.direita]).toEqual([47, 47]);
});

it("a barra de abas usa a área segura de baixo sem somar respiro a ela", () => {
  // Prova por TEXTO: o happy-dom descarta o `max()` do `padding-bottom` e fica
  // com os 10px do atalho. O `max` vem DEPOIS do atalho, que senão o zeraria.
  expect(paddings(BARRA())).toEqual([
    ["padding", "var(--co-space-10) var(--co-space-10)"],
    ["padding-bottom", "max(var(--co-space-10), var(--co-safe-bottom))"],
  ]);
  soEstesMexemNoPadding(/\.co-tabbar(?![\w-])/, [".co-tabbar"]);

  expect(paddingQueVale(BARRA(), aparelho(59, 0, 34, 0))).toEqual({
    topo: 10,
    direita: 10,
    baixo: 34,
    esquerda: 10,
  });
  expect(paddingQueVale(BARRA(), aparelho(0, 0, 4, 0)).baixo).toBe(10);
  expect(paddingQueVale(BARRA(), SEM_AREA).baixo).toBe(10);
});

it("sem área segura a reserva da tela com barra continua 104px, e cresce o que a barra cresce embaixo", () => {
  // A letra da D-10 do Basalto, e uma regra só declara a reserva.
  const reserva = bloco(RESERVA);
  expect(reserva).toEqual([
    [
      "--co-screen-bottom",
      "calc(104px - var(--co-space-10) + max(var(--co-space-10), var(--co-safe-bottom)))",
    ],
  ]);
  const declaram = REGRAS.filter((r) => r.declaracoes.some(([p]) => p === "--co-screen-bottom"));
  expect(declaram.map((r) => r.seletores.join(", "))).toEqual([RESERVA]);

  // O termo `max(...)` da reserva é o MESMO texto do rodapé da barra: se um
  // mudar sem o outro, a folga entre a última linha e o vidro muda junto.
  const texto = reserva[0]?.[1] ?? "";
  const inicio = texto.indexOf("max(");
  let fim = inicio + 4;
  for (let nivel = 1; nivel > 0 && fim < texto.length; fim++) {
    if (texto[fim] === "(") nivel++;
    if (texto[fim] === ")") nivel--;
  }
  const rodapeDaBarra = Object.fromEntries(BARRA())["padding-bottom"];
  expect(inicio).toBeGreaterThan(-1);
  expect(texto.slice(inicio, fim)).toBe(rodapeDaBarra);

  // A sobrescrita chega à reserva, e a reserva chega ao rodapé da moldura. A
  // barra cresce embaixo o que o `max` dela crescer; a reserva cresce o mesmo,
  // e a folga de 104 − 10 = 94px acima do rodapé da barra fica igual.
  const medidas = [0, 21, 34, 48].map((baixo) => {
    const { comBarra } = montar({ "--co-safe-bottom": `${baixo}px` });
    const resolvida = resolvido(comBarra, "--co-screen-bottom");
    expect(resolvida).toBe(`calc(104px - 10px + max(10px, ${baixo}px))`);
    expect(blocoResolvido(comBarra)[1]).toBe(resolvida);
    const valor = avaliar(resolvida, SEM_AREA);
    expect(valor - paddingQueVale(BARRA(), aparelho(0, 0, baixo, 0)).baixo).toBe(94);
    return valor;
  });
  expect(medidas).toEqual([104, 115, 128, 142]);
});

it("o cabeçalho do trilho recua da área segura de cima, aberto e recolhido", () => {
  // iPad em paisagem: a área de cima é menor que a do telefone.
  const { cabecalho, cabecalhoRecolhido } = montar({ "--co-safe-top": "24px" });
  expect(resolvido(cabecalho, "padding-block-start")).toBe("24px");
  expect(resolvido(cabecalhoRecolhido, "padding-block-start")).toBe("24px");

  // O recuo vem DEPOIS do atalho (antes, o atalho o zeraria), e o recolhido só
  // zera as laterais (um `padding: 0` ali, mais específico, apagaria o recuo).
  expect(paddings(bloco(CABECALHO))).toEqual([
    ["padding", "0 var(--co-space-12)"],
    ["padding-block-start", "var(--co-safe-top)"],
  ]);
  expect(paddings(bloco(RECOLHIDO))).toEqual([["padding-inline", "0"]]);
  soEstesMexemNoPadding(/\.co-rail__header(?![\w-])/, [CABECALHO, RECOLHIDO]);

  const ipad = aparelho(24, 0, 20, 0);
  expect(paddingQueVale(bloco(CABECALHO), ipad)).toEqual({
    topo: 24,
    direita: 12,
    baixo: 0,
    esquerda: 12,
  });
  expect(paddingQueVale([...bloco(CABECALHO), ...bloco(RECOLHIDO)], ipad)).toEqual({
    topo: 24,
    direita: 0,
    baixo: 0,
    esquerda: 0,
  });
});

it("sem área segura, a conta fecha igual à 1.5.0", () => {
  // Sem ancestral nenhum: cada regra lê o `env()` do `:root`, e o `env()` sem
  // aparelho cai no `, 0px`. Os números são os da 1.5.0, que não tinha área
  // segura nenhuma além da soma na barra.
  const { semBarra, comBarra, cabecalho } = montar({});
  expect(blocoResolvido(semBarra)).toEqual([
    "calc(28px + env(safe-area-inset-top, 0px))",
    "calc(40px + env(safe-area-inset-bottom, 0px))",
  ]);
  expect(resolvido(cabecalho, "padding-block-start")).toBe("env(safe-area-inset-top, 0px)");

  const conta = {
    "moldura em cima": avaliar(blocoResolvido(semBarra)[0], SEM_AREA),
    "moldura embaixo, sem barra": avaliar(blocoResolvido(semBarra)[1], SEM_AREA),
    calha: partes(resolvido(semBarra, "padding-inline")).map((lado) => avaliar(lado, SEM_AREA)),
    "reserva da tela com barra": avaliar(blocoResolvido(comBarra)[1], SEM_AREA),
    barra: paddingQueVale(BARRA(), SEM_AREA),
    "cabeçalho do trilho": paddingQueVale(bloco(CABECALHO), SEM_AREA),
    "cabeçalho recolhido": paddingQueVale([...bloco(CABECALHO), ...bloco(RECOLHIDO)], SEM_AREA),
  };
  expect(conta).toEqual({
    "moldura em cima": 28,
    "moldura embaixo, sem barra": 40,
    calha: [16, 16],
    "reserva da tela com barra": 104,
    barra: { topo: 10, direita: 10, baixo: 10, esquerda: 10 },
    "cabeçalho do trilho": { topo: 0, direita: 12, baixo: 0, esquerda: 12 },
    "cabeçalho recolhido": { topo: 0, direita: 0, baixo: 0, esquerda: 0 },
  });
});
