/// <reference types="vite/client" />
import { cleanup, render } from "@testing-library/react";
import type { CSSProperties, ReactNode } from "react";
import { expect, it } from "vitest";
import { Screen } from "./atoms/Screen";
import { Rail } from "./molecules/Rail";
import { TabBar } from "./molecules/TabBar";
import "./styles.css";
import folha from "./styles.css?raw";

/**
 * A área segura do aparelho (ADR-011): qual custom property cada regra lê, e a
 * sobrescrita de quem consome chegando até a regra. E o que a 1.7.0 pôs em cima
 * dela (ADR-012): o rodapé da barra de abas, que entra 14px na área de baixo, e
 * a faixa sob o relógio, que a `Screen` monta sempre.
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
  /** Quantas chaves abertas há antes dela: 0 é o nível de cima da folha. */
  profundidade: number;
  seletores: string[];
  declaracoes: Declaracao[];
}

/**
 * Espaço normalizado também junto de parênteses e vírgulas: uma declaração
 * quebrada em linhas (`calc(104px - var(--co-space-10)⏎ + max(...))`, ou um
 * gradiente que um formatador abre em várias) é a mesma regra, e tem de ser
 * lida como a mesma.
 */
const normalizar = (texto: string) =>
  texto
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*,\s*/g, ", ")
    .trim();

const SEM_COMENTARIO = folha.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * A regra dentro de um `@media` ou de um `@supports` só vale às vezes — num
 * tema, numa largura —, e o regex plano abaixo a lê como se valesse sempre. A
 * profundidade de chave antes de cada posição é o que separa as duas.
 */
const PROFUNDIDADE: number[] = [0];
for (let k = 0; k < SEM_COMENTARIO.length; k++) {
  const caractere = SEM_COMENTARIO[k];
  PROFUNDIDADE.push((PROFUNDIDADE[k] ?? 0) + (caractere === "{" ? 1 : caractere === "}" ? -1 : 0));
}

const REGRAS: Regra[] = [...SEM_COMENTARIO.matchAll(/([^{};]*)\{([^{}]*)\}/g)].map((achado) => ({
  profundidade: PROFUNDIDADE[achado.index ?? 0] ?? 0,
  seletores: normalizar(achado[1] ?? "").split(/\s*,\s*/),
  declaracoes: (achado[2] ?? "")
    .split(";")
    .map(normalizar)
    .filter(Boolean)
    .map((linha) => {
      const doisPontos = linha.indexOf(":");
      return [linha.slice(0, doisPontos).trim(), normalizar(linha.slice(doisPontos + 1))] as const;
    }),
}));

/** Onde a regra vale: o seletor, com `@ ` na frente quando ela mora numa at-rule. */
const lugar = (regra: Regra) => `${regra.profundidade ? "@ " : ""}${regra.seletores.join(", ")}`;

/**
 * O bloco do seletor — e só um, no nível de cima: um segundo bloco igual mais
 * abaixo venceria este, e um bloco dentro de `@media` só valeria às vezes.
 */
function bloco(seletor: string): Declaracao[] {
  const achados = REGRAS.filter((r) => r.seletores.length === 1 && r.seletores[0] === seletor);
  expect(achados.map(lugar), `blocos de ${seletor}`).toEqual([seletor]);
  return achados[0]?.declaracoes ?? [];
}

const paddings = (declaracoes: Declaracao[]) =>
  declaracoes.filter(([p]) => p.startsWith("padding"));

/**
 * O NOME da classe, e não o texto `.co-x`: casa também o seletor de atributo
 * (`[class~="co-x"]`), que alcança o mesmo elemento sem escrever o ponto.
 */
const classe = (...nomes: string[]) => new RegExp(`(^|[^\\w-])(${nomes.join("|")})(?![\\w-])`);

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

/**
 * O último composto do seletor, sem os `:not(...)`: é ele que diz QUAL
 * elemento a regra pinta. `.co-root nav:not(.co-rail)` parece da coluna pelo
 * texto, mas pinta qualquer `nav` — a barra de abas inclusive.
 */
const ultimoComposto = (seletor: string) =>
  seletor
    .replace(/:not\((?:[^()]|\([^()]*\))*\)/g, "")
    .split(/\s*[\s>+~]\s*/)
    .pop() ?? "";

/** Regras cujo último composto não tem classe da coluna e que mexem em `propriedades`. */
function genericas(propriedades: RegExp, alcanca: (seletor: string) => boolean = () => true) {
  return REGRAS.flatMap((r) =>
    r.declaracoes.some(([p]) => propriedades.test(p))
      ? r.seletores.filter((s) => !/\.co-[\w-]/.test(ultimoComposto(s)) && alcanca(s))
      : [],
  );
}

/**
 * Os tokens que a conta lê chegam do `:root` dos tokens, intactos: nenhuma
 * regra desta folha os redeclara. Um `--co-space-14: 0px` dentro da barra (ou
 * da moldura) muda o rodapé dela (ou a reserva) sem mudar uma letra da regra.
 */
function soOsTokensDeclaram(tokens: Readonly<Record<string, string>>) {
  const nomes = Object.keys(tokens);
  const redeclarados = REGRAS.flatMap((r) =>
    r.declaracoes.filter(([p]) => nomes.includes(p)).map(([p]) => `${r.seletores.join(", ")} ${p}`),
  );
  expect(redeclarados, "tokens redeclarados nesta folha").toEqual([]);
  expect(Object.fromEntries(nomes.map((nome) => [nome, raiz(nome)]))).toEqual(tokens);
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
 * `calc`, `max`, `min`, `var` e `env`, em px, com as quatro operações — o que a
 * folha usa nessas regras.
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

  // `*` e `/` antes de `+` e `-`, como no `calc()`: a faixa sob o relógio é
  // `calc(var(--co-statusbar-height) * 4 / 3)`.
  function produto(): number {
    let valor = termo();
    for (pular(); texto[i] === "*" || texto[i] === "/"; pular()) {
      const operador = texto[i];
      i++;
      const outro = termo();
      valor = operador === "*" ? valor * outro : valor / outro;
    }
    return valor;
  }

  function soma(): number {
    let valor = produto();
    for (
      pular();
      (texto[i] === "+" || texto[i] === "-") && /\s/.test(texto[i + 1] ?? "");
      pular()
    ) {
      const sinal = texto[i];
      i++;
      const outro = produto();
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

/**
 * O rodapé da barra (ADR-012): os destinos entram `--co-space-14` na área de
 * baixo, e nunca descem dos 10px de respiro. É o MESMO texto na reserva.
 */
const RODAPE = "max(var(--co-space-10), calc(var(--co-safe-bottom) - var(--co-space-14)))";
/** A faixa sob o relógio (ADR-012) e a máscara que esmaece o desfoque dela. */
const FAIXA = ".co-screen__statusbar";
const MASCARA = "linear-gradient(to bottom, #000 0%, #000 75%, transparent 100%)";
const CABECALHO = ".co-rail__header";
const RECOLHIDO = '.co-rail[data-collapsed="true"] .co-rail__header';

// ------------------------------------------------------------------ testes --

it("a área segura é pública: quatro custom properties com env() e reserva de 0px", () => {
  // Declaradas SÓ no `:root`, uma vez cada, na ordem. Repetida num componente,
  // a declaração dele faria sombra à do consumidor (a tela debaixo do aviso
  // voltaria a somar a área de cima).
  const declaradas = REGRAS.flatMap((r) =>
    r.declaracoes.filter(([p]) => p.startsWith("--co-safe-")).map(([p, v]) => [lugar(r), p, v]),
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

  // A moldura é `.co-screen` e, com o grão (o padrão), `.co-grain`: uma regra
  // de qualquer das duas classes alcança o mesmo elemento.
  const moldura = bloco(".co-screen");
  soEstesMexemNoPadding(classe("co-screen", "co-grain"), [".co-screen"]);
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

it("a barra de abas entra 14px na área segura de baixo e nunca desce do respiro de 10px", () => {
  // Prova por TEXTO: o happy-dom descarta o `max()` do `padding-bottom` e fica
  // com os 10px do atalho. O `max` vem DEPOIS do atalho, que senão o zeraria.
  expect(paddings(BARRA())).toEqual([
    ["padding", "var(--co-space-10) var(--co-space-10)"],
    ["padding-bottom", RODAPE],
  ]);
  // Nenhuma outra regra mexe no `padding` da barra: nem pelo nome da classe
  // (seletor de atributo incluído), nem por um seletor genérico que a alcance
  // (`nav`, `*`, ainda que atrás de um `:not(...)`, ainda que só num tema).
  soEstesMexemNoPadding(classe("co-tabbar"), [".co-tabbar"]);
  expect(genericas(/^padding/), "regras genéricas com padding").toEqual([]);
  soOsTokensDeclaram({ "--co-space-10": "10px", "--co-space-14": "14px" });

  // O gesto do indicador dispara nos últimos milímetros da borda, e não nos
  // 34px inteiros: o rodapé é a área menos 14px, com o piso dos 10px.
  const rodapes = [0, 21, 24, 30, 34, 48].map(
    (baixo) => paddingQueVale(BARRA(), aparelho(0, 0, baixo, 0)).baixo,
  );
  expect(rodapes).toEqual([10, 10, 10, 16, 20, 34]);
  expect(paddingQueVale(BARRA(), aparelho(59, 0, 34, 0))).toEqual({
    topo: 10,
    direita: 10,
    baixo: 20,
    esquerda: 10,
  });
  expect(paddingQueVale(BARRA(), SEM_AREA).baixo).toBe(10);
});

it("sem área segura a reserva da tela com barra continua 104px, e cresce o que a barra cresce embaixo", () => {
  // A letra da D-10 do Basalto, e uma regra só declara a reserva.
  const reserva = bloco(RESERVA);
  expect(reserva).toEqual([["--co-screen-bottom", `calc(104px - var(--co-space-10) + ${RODAPE})`]]);
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
    expect(resolvida).toBe(`calc(104px - 10px + max(10px, calc(${baixo}px - 14px)))`);
    expect(blocoResolvido(comBarra)[1]).toBe(resolvida);
    const valor = avaliar(resolvida, SEM_AREA);
    expect(valor - paddingQueVale(BARRA(), aparelho(0, 0, baixo, 0)).baixo).toBe(94);
    return valor;
  });
  expect(medidas).toEqual([104, 104, 114, 128]);
  soOsTokensDeclaram({ "--co-border-width": "1px" });

  // E a folga em si: a barra mede o respiro de cima, o destino de 52px, o fio
  // e o rodapé — 73px sem área segura, 83px com o indicador de 34px —, e a
  // última linha fica 31px acima dela com qualquer área de baixo. Um destino
  // mais baixo, ou um fio mais grosso, muda a folga sem tocar na reserva.
  const destino = Object.fromEntries(bloco(".co-tabbar__item"))["min-height"] ?? "";
  const fio = partes(Object.fromEntries(BARRA())["border-top"] ?? "")[0] ?? "";
  const barras = [0, 21, 34, 48].map((baixo) => {
    const { topo, baixo: rodape } = paddingQueVale(BARRA(), aparelho(0, 0, baixo, 0));
    return topo + avaliar(destino, SEM_AREA) + avaliar(fio, SEM_AREA) + rodape;
  });
  expect(barras).toEqual([73, 73, 83, 97]);
  expect(medidas.map((valor, i) => valor - (barras[i] ?? 0))).toEqual([31, 31, 31, 31]);
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
  soEstesMexemNoPadding(classe("co-rail__header"), [CABECALHO, RECOLHIDO]);

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
    "faixa sob o relógio": avaliar(Object.fromEntries(bloco(FAIXA))["height"] ?? "", SEM_AREA),
  };
  expect(conta).toEqual({
    "moldura em cima": 28,
    "moldura embaixo, sem barra": 40,
    calha: [16, 16],
    "reserva da tela com barra": 104,
    barra: { topo: 10, direita: 10, baixo: 10, esquerda: 10 },
    "cabeçalho do trilho": { topo: 0, direita: 12, baixo: 0, esquerda: 12 },
    "cabeçalho recolhido": { topo: 0, direita: 0, baixo: 0, esquerda: 0 },
    "faixa sob o relógio": 0,
  });
});

// ------------------------------------------------------ a faixa sob o relógio --

/**
 * O que, numa regra, mexe em ONDE e COMO a faixa aparece: posição, caixa,
 * largura, margem, exibição, opacidade, camada, ponteiro, fundo, desfoque,
 * máscara, transformação, mistura, isolamento e contenção.
 */
const PINTA =
  /^(-webkit-)?(position|top|right|bottom|left|inset|(min-|max-)?(height|width|block-size|inline-size)|display|visibility|opacity|z-index|pointer-events|background|backdrop-filter|mask|transform|translate|scale|rotate|filter|clip|margin|zoom|mix-blend-mode|isolation|contain|content-visibility|will-change)/;

/** As classes do seletor, fora as que estão dentro de um `:not(...)`. */
const classesDe = (seletor: string) =>
  [...seletor.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, "").matchAll(/\.(co-[\w-]+)/g)].map(
    ([, nome]) => nome,
  );

/** A faixa e o resto do que a `Screen` montou. */
function telaMontada(elemento: ReactNode) {
  const { container } = render(elemento);
  const tela = container.querySelector(".co-screen");
  const faixa = container.querySelector(FAIXA);
  expect(tela, "a moldura").not.toBeNull();
  expect(faixa, "a faixa").not.toBeNull();
  return { container, tela: tela as Element, faixa: faixa as Element };
}

it("a altura da faixa do relógio é pública e declarada só no :root, a partir da área de cima", () => {
  // Uma declaração só, no `:root` das quatro, depois delas. Repetida na tela,
  // ela leria o `--co-safe-top` que o consumidor zera debaixo de um aviso, e a
  // faixa sumiria com o aviso de pé — com o relógio no mesmo lugar.
  const declaradas = REGRAS.flatMap((r) =>
    r.declaracoes.filter(([p]) => p === "--co-statusbar-height").map(([p, v]) => [lugar(r), p, v]),
  );
  expect(declaradas).toEqual([[":root", "--co-statusbar-height", "var(--co-safe-top)"]]);
  const daArea = REGRAS.filter((r) => r.declaracoes.some(([p]) => p === "--co-safe-left"));
  expect(daArea.map((r) => r.declaracoes.map(([p]) => p))).toEqual([
    [
      "--co-safe-top",
      "--co-safe-right",
      "--co-safe-bottom",
      "--co-safe-left",
      "--co-statusbar-height",
    ],
  ]);

  // Resolvida no `:root`: o happy-dom troca o `var()` ali mesmo, e quem a lê
  // recebe o `env()` do aparelho.
  expect(raiz("--co-statusbar-height")).toBe("env(safe-area-inset-top, 0px)");
});

it("o Screen monta a faixa do relógio uma vez, aria-hidden, sem style e antes do conteúdo", () => {
  // Sempre, sem prop: com e sem a barra, sem o grão, com classe e `style` de
  // fora. O `style` do consumidor fica na moldura — nada inline chega à faixa
  // (CSP `style-src 'self'`).
  const casos: [string, ReactNode][] = [
    ["padrão", <Screen key="padrao">conteúdo</Screen>],
    [
      "com barra",
      <Screen key="barra" tabBar>
        conteúdo
      </Screen>,
    ],
    [
      "sem grão",
      <Screen key="grao" grain={false}>
        conteúdo
      </Screen>,
    ],
    [
      "com classe e style",
      <Screen key="classe" className="x" style={{ color: "red" }}>
        conteúdo
      </Screen>,
    ],
  ];
  const montadas = casos.map(([nome, elemento]) => {
    const { container, tela, faixa } = telaMontada(elemento);
    const montada = {
      nome,
      faixas: container.querySelectorAll(FAIXA).length,
      filhos: [...tela.childNodes].map((no) => (no === faixa ? "faixa" : no.textContent)),
      atributos: faixa.getAttributeNames().sort(),
      classe: faixa.getAttribute("class"),
      ariaHidden: faixa.getAttribute("aria-hidden"),
      vazia: faixa.childNodes.length === 0,
      elemento: faixa.tagName,
    };
    cleanup();
    return montada;
  });
  expect(montadas).toEqual(
    casos.map(([nome]) => ({
      nome,
      faixas: 1,
      filhos: ["faixa", "conteúdo"],
      atributos: ["aria-hidden", "class"],
      classe: "co-screen__statusbar",
      ariaHidden: "true",
      vazia: true,
      elemento: "DIV",
    })),
  );

  const { tela, faixa } = telaMontada(
    <Screen tabBar className="x" style={{ color: "red" }}>
      conteúdo
    </Screen>,
  );
  expect(tela.getAttribute("style")).toBe("color: red;");
  expect(tela.getAttribute("class")).toBe("co-screen co-grain x");
  expect(faixa.hasAttribute("style")).toBe(false);
});

it("a faixa é opaca na área do relógio e esmaece só no terço extra, com o desfoque na mesma máscara", () => {
  // As doze, nesta ordem, num bloco só e no nível de cima da folha.
  expect(bloco(FAIXA)).toEqual([
    ["position", "fixed"],
    ["top", "0"],
    ["left", "0"],
    ["right", "0"],
    ["z-index", "20"],
    ["height", "calc(var(--co-statusbar-height) * 4 / 3)"],
    ["pointer-events", "none"],
    [
      "background",
      "linear-gradient(to bottom, var(--co-canvas) 0%, var(--co-canvas) 75%, transparent 100%)",
    ],
    ["backdrop-filter", "blur(22px)"],
    ["-webkit-backdrop-filter", "blur(22px)"],
    ["-webkit-mask-image", MASCARA],
    ["mask-image", MASCARA],
  ]);

  // Nenhuma outra regra cita a classe (seletor de atributo incluído), e
  // nenhuma regra genérica a alcança: um `.co-screen > :first-child` ou um
  // `.co-screen > :not(.co-text)`, ainda que só num tema, pinta a faixa sem
  // escrever o nome dela.
  const citam = REGRAS.filter((r) =>
    r.seletores.some((s) => classe("co-screen__statusbar").test(s)),
  );
  expect(citam.map(lugar)).toEqual([FAIXA]);
  const alcancam = genericas(
    PINTA,
    (s) =>
      !/^(from|to|[\d.]+%)$/.test(s) &&
      classesDe(s).every((nome) => ["co-root", "co-screen", "co-grain"].includes(nome ?? "")),
  );
  expect(alcancam, "regras genéricas que alcançam a faixa").toEqual([]);
  const canvas = REGRAS.filter((r) => r.declaracoes.some(([p]) => p === "--co-canvas"));
  expect(canvas.map(lugar), "regras desta folha que redeclaram --co-canvas").toEqual([]);

  // Os dois temas pelo `--co-canvas`: o fundo da faixa é o da própria tela, opaco
  // até 75% e transparente no fim, no claro e no escuro.
  const temas = ["light", "dark"].map((tema) => {
    const { tela, faixa } = telaMontada(
      <div className="co-root" data-theme={tema}>
        <Screen>conteúdo</Screen>
      </div>,
    );
    const cor = resolvido(tela, "background-color");
    expect(resolvido(faixa, "background-image")).toBe(
      `linear-gradient(to bottom, ${cor} 0%, ${cor} 75%, transparent 100%)`,
    );
    expect(resolvido(faixa, "backdrop-filter")).toBe("blur(22px)");
    expect(resolvido(faixa, "mask-image")).toBe(MASCARA);
    cleanup();
    return cor;
  });
  expect(temas).toEqual(["#f2eef8", "#0d0b11"]);
});

it("a faixa tem a área de cima mais um terço, e 0 sem área segura", () => {
  const altura = Object.fromEntries(bloco(FAIXA))["height"] ?? "";
  const faixa = (topo: number) => avaliar(altura, aparelho(topo, 0, 0, 0));
  expect(faixa(59)).toBeCloseTo(78.67, 2);
  expect(faixa(24)).toBe(32);
  expect(faixa(0)).toBe(0);
  expect(avaliar(altura, SEM_AREA)).toBe(0);

  // O que o happy-dom resolve na faixa montada: sem área segura, o `env()` do
  // `:root`; com o aparelho simulado pela propriedade pública, o número.
  expect(resolvido(telaMontada(<Screen>conteúdo</Screen>).faixa, "height")).toBe(
    "calc(env(safe-area-inset-top, 0px) * 4 / 3)",
  );
  cleanup();
  const simulada = resolvido(
    telaMontada(
      <Por area={{ "--co-statusbar-height": "59px" }}>
        <Screen>conteúdo</Screen>
      </Por>,
    ).faixa,
    "height",
  );
  expect(simulada).toBe("calc(59px * 4 / 3)");
  expect(avaliar(simulada, SEM_AREA)).toBeCloseTo(78.67, 2);

  // Em repouso, o título (28 + área) e a marca do trilho (20 + área) ficam fora
  // dela: com 59px, 8,33px e 0,33px abaixo. O título fica fora enquanto a área
  // for de até 84px, e a marca enquanto for de até 60px.
  const titulo = (topo: number) =>
    paddingQueVale(bloco(".co-screen"), aparelho(topo, 0, 0, 0)).topo;
  const marca = (topo: number) =>
    paddingQueVale(bloco(".co-rail"), SEM_AREA).topo +
    paddingQueVale(bloco(CABECALHO), aparelho(topo, 0, 0, 0)).topo;
  expect([titulo(59), marca(59)]).toEqual([87, 79]);
  expect(titulo(59) - faixa(59)).toBeCloseTo(8.33, 2);
  expect(marca(59) - faixa(59)).toBeCloseTo(0.33, 2);
  expect([0, 24, 59, 84, 85].map((topo) => titulo(topo) >= faixa(topo))).toEqual([
    true,
    true,
    true,
    true,
    false,
  ]);
  expect([0, 24, 59, 60, 61].map((topo) => marca(topo) >= faixa(topo))).toEqual([
    true,
    true,
    true,
    true,
    false,
  ]);
});

it("só a faixa lê a altura dela, e ela não lê a área de cima direto", () => {
  const leem = REGRAS.flatMap((r) =>
    r.declaracoes
      .filter(([p, v]) => p !== "--co-statusbar-height" && v.includes("--co-statusbar-height"))
      .map(([p]) => `${lugar(r)} ${p}`),
  );
  expect(leem).toEqual([".co-screen__statusbar height"]);
  expect(bloco(FAIXA).filter(([, v]) => /--co-safe-|safe-area-inset/.test(v))).toEqual([]);

  // A lista fechada de quem lê a área segura: as regras do ADR-011, a `.co-sheet`
  // de sempre e, agora, a altura da faixa — no `:root`, e em mais lugar nenhum.
  const leemArea = REGRAS.flatMap((r) =>
    r.declaracoes
      .filter(([p, v]) => !p.startsWith("--co-safe-") && /--co-safe-|safe-area-inset/.test(v))
      .map(([p]) => `${lugar(r)} ${p}`),
  ).sort();
  expect(leemArea).toEqual([
    ".co-rail__header padding-block-start",
    ".co-screen padding-block",
    ".co-screen padding-inline",
    '.co-screen[data-tabbar="true"] --co-screen-bottom',
    ".co-sheet padding-bottom",
    ".co-tabbar padding-bottom",
    ":root --co-statusbar-height",
  ]);
});
