/// <reference types="vite/client" />
import { expect } from "vitest";
import folha from "../styles.css?raw";

/**
 * A folha lida e a conta avaliada, para os testes que provam geometria de tela
 * pelo texto das regras: a área segura (`src/area-segura.test.tsx`, ADR-011 e
 * ADR-012) e a barra de ação (`src/barra-de-acao.test.tsx`, ADR-013).
 *
 * O happy-dom troca `var()` pelo valor que o ancestral declarou, mas não faz
 * conta, não expande atalho e descarta `max()` no `padding`; e erra o `:has()`
 * com seletor composto. Então quem prova geometria lê o texto da regra, desta
 * folha sem comentário, e o AVALIA aqui, na ordem em que a cascata aplicaria.
 * O número em pixel, medido na tela, é do navegador.
 *
 * Quem usa `raiz()` precisa ter importado `../styles.css` (o `:root` da folha
 * carregada é de onde vêm os tokens e as `--co-safe-*`).
 */

// ------------------------------------------------------------ a folha lida --

export type Declaracao = readonly [propriedade: string, valor: string];
export interface Regra {
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
export const normalizar = (texto: string) =>
  texto
    .replace(/\s+/g, " ")
    .replace(/\( /g, "(")
    .replace(/ \)/g, ")")
    .replace(/ ?, ?/g, ", ")
    .trim();

const SEM_COMENTARIO = folha.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * A regra dentro de um `@media` ou de um `@supports` só vale às vezes — num
 * tema, numa largura —, e o regex plano abaixo a lê como se valesse sempre. A
 * profundidade de chave antes de cada posição é o que separa as duas.
 */
const DEGRAU: Readonly<Record<string, number>> = { "{": 1, "}": -1 };
const PROFUNDIDADE: number[] = [0];
for (let k = 0; k < SEM_COMENTARIO.length; k++) {
  PROFUNDIDADE.push((PROFUNDIDADE[k] ?? 0) + (DEGRAU[SEM_COMENTARIO[k] ?? ""] ?? 0));
}

/**
 * Cada bloco sem chave dentro (`seletor { declarações }`), na ordem da folha:
 * o seletor é o texto desde a última `{`, `}` ou `;`. Uma varredura, e não o
 * regex `([^{};]*)\{([^{}]*)\}`, que acha os mesmos blocos mas recomeça o
 * seletor a cada posição e custa quadrático numa folha longa.
 */
function blocosPlanos(css: string): { inicio: number; seletor: string; corpo: string }[] {
  const blocos: { inicio: number; seletor: string; corpo: string }[] = [];
  let inicio = 0;
  let k = 0;
  while (k < css.length) {
    const caractere = css[k];
    if (caractere === "{") {
      const fim = css.indexOf("}", k + 1);
      const outra = css.indexOf("{", k + 1);
      if (fim !== -1 && (outra === -1 || fim < outra)) {
        blocos.push({ inicio, seletor: css.slice(inicio, k), corpo: css.slice(k + 1, fim) });
        k = fim;
      }
      inicio = k + 1;
    } else if (caractere === ";" || caractere === "}") {
      inicio = k + 1;
    }
    k++;
  }
  return blocos;
}

const paraRegra = (seletor: string, corpo: string, profundidade: number): Regra => ({
  profundidade,
  seletores: normalizar(seletor).split(", "),
  declaracoes: corpo
    .split(";")
    .map(normalizar)
    .filter(Boolean)
    .map((linha) => {
      const doisPontos = linha.indexOf(":");
      return [linha.slice(0, doisPontos).trim(), normalizar(linha.slice(doisPontos + 1))] as const;
    }),
});

export const REGRAS: Regra[] = blocosPlanos(SEM_COMENTARIO).map((achado) =>
  paraRegra(achado.seletor, achado.corpo, PROFUNDIDADE[achado.inicio] ?? 0),
);

/**
 * As regras de DENTRO de uma at-rule do nível de cima — `@keyframes x`,
 * `@media (...)` —, na ordem da folha, pelo cabeçalho normalizado. `REGRAS`
 * sabe que uma regra mora numa at-rule, e não em qual: o `from` de um
 * `@keyframes` é igual ao de outro, e a regra de um `@media` de movimento é
 * igual à de um `@media` de largura.
 *
 * Uma só at-rule com esse cabeçalho: um segundo `@keyframes` com o mesmo nome
 * venceria o primeiro em silêncio, e um segundo `@media` igual seria a mesma
 * condição escrita em dois lugares.
 */
export function dentroDe(cabecalho: string): Regra[] {
  const achados = [...SEM_COMENTARIO.matchAll(/@[^{};@]+\{/g)].filter(
    (achado) => PROFUNDIDADE[achado.index] === 0 && normalizar(achado[0].slice(0, -1)) === cabecalho,
  );
  expect(
    achados.map((achado) => normalizar(achado[0].slice(0, -1))),
    `at-rules ${cabecalho}`,
  ).toEqual([cabecalho]);
  const abre = (achados[0]?.index ?? 0) + (achados[0]?.[0].length ?? 0);
  let fecha = abre;
  while (fecha < SEM_COMENTARIO.length && (PROFUNDIDADE[fecha + 1] ?? 0) > 0) fecha++;
  return blocosPlanos(SEM_COMENTARIO.slice(abre, fecha)).map((achado) =>
    paraRegra(achado.seletor, achado.corpo, 1),
  );
}

/** Onde a regra vale: o seletor, com `@ ` na frente quando ela mora numa at-rule. */
export const lugar = (regra: Regra) => `${regra.profundidade ? "@ " : ""}${regra.seletores.join(", ")}`;

/**
 * O bloco do seletor — e só um, no nível de cima: um segundo bloco igual mais
 * abaixo venceria este, e um bloco dentro de `@media` só valeria às vezes.
 */
export function bloco(seletor: string): Declaracao[] {
  const achados = REGRAS.filter((r) => r.seletores.length === 1 && r.seletores[0] === seletor);
  expect(achados.map(lugar), `blocos de ${seletor}`).toEqual([seletor]);
  return achados[0]?.declaracoes ?? [];
}

export const paddings = (declaracoes: Declaracao[]) =>
  declaracoes.filter(([p]) => p.startsWith("padding"));

/**
 * O NOME da classe, e não o texto `.co-x`: casa também o seletor de atributo
 * (`[class~="co-x"]`), que alcança o mesmo elemento sem escrever o ponto.
 */
export const classe = (...nomes: string[]) => new RegExp(String.raw`(^|[^\w-])(${nomes.join("|")})(?![\w-])`);

/** Nenhuma outra regra que alcança o seletor mexe no `padding` dele. */
export function soEstesMexemNoPadding(alcanca: RegExp, donos: string[]) {
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
export const ultimoComposto = (seletor: string) =>
  seletor
    .replace(/:not\((?:[^()]|\([^()]*\))*\)/g, "")
    .split(/\s*[\s>+~]\s*/)
    .pop() ?? "";

/** Regras cujo último composto não tem classe da coluna e que mexem em `propriedades`. */
export function genericas(propriedades: RegExp, alcanca: (seletor: string) => boolean = () => true) {
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
export function soOsTokensDeclaram(tokens: Readonly<Record<string, string>>) {
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
export type Valores = Readonly<Record<string, string>>;

export const raiz = (nome: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(nome).trim();

export function aparelho(topo: number, direita: number, baixo: number, esquerda: number): Valores {
  return {
    "safe-area-inset-top": `${topo}px`,
    "safe-area-inset-right": `${direita}px`,
    "safe-area-inset-bottom": `${baixo}px`,
    "safe-area-inset-left": `${esquerda}px`,
  };
}

export const SEM_AREA: Valores = {};

/**
 * `calc`, `max`, `min`, `var` e `env`, em px, com as quatro operações — o que a
 * folha usa nessas regras.
 * Sem fallback e sem valor, `env()` e `var()` FALHAM em vez de valer zero: uma
 * declaração que não chega até a regra é o defeito que este teste procura.
 */
export function avaliar(texto: string, valores: Valores): number {
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
      pular();
      while (texto[i] === ",") {
        i++;
        argumentos.push(soma());
        pular();
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
    pular();
    while (texto[i] === "*" || texto[i] === "/") {
      const operador = texto[i];
      i++;
      const outro = termo();
      valor = operador === "*" ? valor * outro : valor / outro;
      pular();
    }
    return valor;
  }

  function soma(): number {
    let valor = produto();
    pular();
    while ((texto[i] === "+" || texto[i] === "-") && /\s/.test(texto[i + 1] ?? "")) {
      const sinal = texto[i];
      i++;
      const outro = produto();
      valor = sinal === "+" ? valor + outro : valor - outro;
      pular();
    }
    return valor;
  }

  const valor = soma();
  pular();
  if (i !== texto.length) throw new Error(`sobrou "${texto.slice(i)}" em: ${texto}`);
  return valor;
}

/** Corta um valor nos espaços de primeiro nível: `max(a, b) max(c, d)` são dois. */
export function partes(valor: string): string[] {
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

export interface Caixa {
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
export function paddingQueVale(declaracoes: Declaracao[], valores: Valores): Caixa {
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

// ------------------------------------------------- os blocos da barra de ação --

/**
 * Os seletores que a barra de ação escreve (ADR-013), na forma normalizada da
 * leitura acima. A condição "com conteúdo" é a mesma nos cinco que a usam: a
 * barra vazia não pinta (`vazia`), e a tela não reserva nem recua a rolagem
 * por ela (`reserva*`, `recuo*`). Desde a 1.8.1, a ação que acabou de chegar
 * se arma antes do toque (`arma`).
 */
export const BARRA_DE_ACAO = {
  barra: ".co-screen__actionbar",
  comAbas: '.co-screen[data-tabbar="true"] > .co-screen__actionbar',
  divide: ".co-screen__actionbar > *, .co-screen__actionbar .co-button",
  vazia: ".co-screen__actionbar:not(:has(:not(:empty)))",
  reserva: '.co-screen[data-actionbar="true"]:has(> .co-screen__actionbar :not(:empty))',
  reservaComAbas:
    '.co-screen[data-tabbar="true"][data-actionbar="true"]:has(> .co-screen__actionbar :not(:empty))',
  recuoComAbas: ':root:has(.co-screen[data-tabbar="true"])',
  recuo: ':root:has(.co-screen[data-actionbar="true"] > .co-screen__actionbar :not(:empty))',
  recuoComAmbas:
    ':root:has(.co-screen[data-tabbar="true"][data-actionbar="true"] > .co-screen__actionbar :not(:empty))',
  /**
   * Os controles da barra, que se armam antes do toque (ADR-013, adendo
   * 1.8.1): a mesma lista na regra da trava e na exceção do movimento reduzido.
   */
  arma: '.co-screen__actionbar button, .co-screen__actionbar a, .co-screen__actionbar [role="button"]',
} as const;
