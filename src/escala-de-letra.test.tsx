/// <reference types="vite/client" />
import { render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Badge } from "./atoms/Badge";
import { Text } from "./atoms/Text";
import textoDoText from "./atoms/Text.tsx?raw";
import { Disclosure } from "./molecules/Disclosure";
import { EmptyState } from "./molecules/EmptyState";
import { Field } from "./molecules/Field";
import { Group } from "./molecules/Group";
import { ListRow } from "./molecules/ListRow";
import { NavList } from "./molecules/NavList";
import { Notice } from "./molecules/Notice";
import { Rail } from "./molecules/Rail";
import { Reckoning } from "./molecules/Reckoning";
import { Stat } from "./molecules/Stat";
import { TabBar } from "./molecules/TabBar";
import { ThemeProvider } from "./theme/ThemeProvider";
import { REGRAS, avaliar, dentroDe, lugar, type Regra, type Valores } from "./test/folha";
import tokensCss from "./tokens/tokens.css?raw";
import "./styles.css";

/**
 * O piso de letra (`.claude/rules/ux.md` §1, ADR-016, ADR-021).
 *
 * O app que usa a Coluna mediu, no estilo computado, a 1.13.0 abaixo do piso:
 * o corpo a 15px, o corpo do `Notice` e o texto do `EmptyState` a 12px, a
 * legenda e o versalete a 11px, o rótulo de grupo a 10px e o das abas a 10px.
 * Este arquivo prova o piso em três lugares, cada um com a isca que mostra que
 * a prova morde:
 *
 * - NA FOLHA. Toda declaração de `font-size` tem um papel escrito aqui, e o
 *   valor, avaliado pelos tokens, fica no piso do papel. Uma regra nova com
 *   letra e sem papel reprova: quem a escreve diz o que ela é.
 * - NAS VARIANTES. A lista de variantes do `Text` é a do tipo `TextVariant`, e
 *   cada uma, renderizada, tem a letra computada no piso do papel dela.
 * - NAS PEÇAS. Cada texto que uma peça escreve por conta própria — o corpo do
 *   aviso, o texto do vazio, a linha de baixo, a nota, o erro, o rótulo da aba —
 *   tem a letra computada no piso do que ele é. E nenhum texto de nenhuma peça
 *   fica abaixo de 12px, salvo o rótulo da barra de abas, a 11px.
 *
 * O happy-dom resolve `var()` e herança no estilo computado, mas não faz
 * conta: por isso a folha é avaliada por `avaliar`, e as peças pelo
 * `getComputedStyle`, onde o valor de cada letra é um token simples.
 */

// ------------------------------------------------------------------ o piso --

/** O piso de cada papel, em px, como `.claude/rules/ux.md` §1 o escreve. */
const PISO = {
  /** Texto corrido, texto primário de lista, valor de campo, título. */
  corpo: 16,
  /** Texto secundário: a nota que explica, a linha de baixo, o erro, o rótulo de controle e de navegação. */
  secundario: 14,
  /** Legenda, horário, valor ao lado do nome, selo, versalete. */
  legenda: 12,
  /** O rótulo da barra de abas: a convenção do iOS. */
  aba: 11,
} as const;
type Papel = keyof typeof PISO;

/** O papel de cada variante do `Text`, pelo que o comentário do `Text.tsx` diz que ela é. */
const VARIANTES: Readonly<Record<string, Papel>> = {
  "title-lg": "corpo",
  numeral: "corpo",
  headline: "corpo",
  body: "corpo",
  callout: "secundario",
  footnote: "secundario",
  subhead: "legenda",
  caption: "legenda",
  label: "legenda",
  micro: "legenda",
};

/**
 * O papel de cada outra regra da folha que declara letra. O botão, o
 * segmentado e o chip são rótulos de controle; o segmentado e o chip ficam em
 * 13px, a letra do controle segmentado do iOS, e o piso deles é o da legenda
 * (ADR-021 diz por quê, e o que o dono pode trocar).
 */
const REGRAS_DE_LETRA: Readonly<Record<string, Papel>> = {
  ".co-button": "secundario",
  '.co-button[data-size="lg"]': "secundario",
  ".co-badge": "legenda",
  ".co-segmented__option": "legenda",
  ".co-chip": "legenda",
  ".co-tabs__tab": "secundario",
  ".co-tabbar__item": "aba",
  ".co-input__unit": "legenda",
  ".co-field__error, .co-group__error": "secundario",
  ".co-search__count": "legenda",
  ".co-search__key": "legenda",
  ".co-diff__values": "secundario",
  ".co-rail__item": "secundario",
  ".co-nav-list__item": "corpo",
  ".co-stepper__value": "corpo",
  ".co-input__control": "corpo",
  ".co-search__control": "corpo",
  // O título de tela com ponteiro fino (o desktop): 30px (plano s7, ADR-022).
  '@ .co-text[data-variant="title-lg"]': "corpo",
};

const papelDa = (regra: Regra): Papel | undefined => {
  const onde = lugar(regra);
  const variante = /^\.co-text\[data-variant="([\w-]+)"\]$/.exec(onde)?.[1];
  return variante === undefined ? REGRAS_DE_LETRA[onde] : VARIANTES[variante];
};

/**
 * Os tokens pelo nome, lidos do CSS gerado. Vale a primeira declaração de cada
 * nome, a do `:root`: a letra é igual nos dois temas.
 */
const TOKENS: Valores = Object.fromEntries(
  [...tokensCss.matchAll(/(--co-[\w-]+)\s*:\s*([^;]+);/g)]
    .reverse()
    .map((achado) => [achado[1] ?? "", (achado[2] ?? "").trim()]),
);

// -------------------------------------------------------------- na folha --

/** Cada letra da folha fora do piso do papel dela, ou sem papel. Vazio é limpo. */
function faltasNaFolha(regras: readonly Regra[]): string[] {
  return regras.flatMap((regra) =>
    regra.declaracoes.flatMap(([propriedade, valor]) => {
      if (propriedade === "font" && valor !== "inherit") return [`${lugar(regra)}: atalho font sem papel`];
      if (propriedade !== "font-size" || valor === "inherit") return [];
      const papel = papelDa(regra);
      if (papel === undefined) return [`${lugar(regra)}: letra sem papel`];
      const letra = avaliar(valor, TOKENS);
      return letra < PISO[papel] ? [`${lugar(regra)}: ${letra}px, abaixo dos ${PISO[papel]}px de ${papel}`] : [];
    }),
  );
}

/** A folha com a letra de `seletor` trocada por `valor`: a isca. */
const comLetra = (seletor: string, valor: string): Regra[] =>
  REGRAS.map((regra) =>
    lugar(regra) === seletor
      ? {
          ...regra,
          declaracoes: regra.declaracoes.map(([p, v]) => [p, p === "font-size" ? valor : v] as const),
        }
      : regra,
  );

describe("o piso de letra na folha", () => {
  it("toda letra da folha tem papel e fica no piso dele", () => {
    expect(faltasNaFolha(REGRAS)).toEqual([]);
  });

  it("todo papel escrito aqui ainda existe na folha", () => {
    // Uma entrada que não casa nada é uma regra renomeada: a letra dela saiu
    // da prova sem ninguém ver.
    const comLetraNaFolha = new Set(
      REGRAS.filter((r) => r.declaracoes.some(([p, v]) => p === "font-size" && v !== "inherit")).map(lugar),
    );
    const esperados = [
      ...Object.keys(VARIANTES).map((v) => `.co-text[data-variant="${v}"]`),
      ...Object.keys(REGRAS_DE_LETRA),
    ];
    expect(esperados.filter((s) => !comLetraNaFolha.has(s))).toEqual([]);
  });

  it("só o rótulo da barra de abas fica abaixo de 12px", () => {
    const miudas = REGRAS.flatMap((regra) =>
      regra.declaracoes
        .filter(([p, v]) => p === "font-size" && v !== "inherit" && avaliar(v, TOKENS) < PISO.legenda)
        .map(() => lugar(regra)),
    );
    expect(miudas).toEqual([".co-tabbar__item"]);
  });

  it.each([
    ['.co-text[data-variant="body"]', "var(--co-text-15)", "15px, abaixo dos 16px de corpo"],
    ['.co-text[data-variant="footnote"]', "var(--co-text-12)", "12px, abaixo dos 14px de secundario"],
    ['.co-text[data-variant="caption"]', "var(--co-text-11)", "11px, abaixo dos 12px de legenda"],
    ['.co-text[data-variant="label"]', "var(--co-text-11)", "11px, abaixo dos 12px de legenda"],
    ['.co-text[data-variant="micro"]', "var(--co-text-10)", "10px, abaixo dos 12px de legenda"],
    [".co-tabbar__item", "var(--co-text-10)", "10px, abaixo dos 11px de aba"],
    [".co-field__error, .co-group__error", "var(--co-text-12)", "12px, abaixo dos 14px de secundario"],
    [".co-badge", "var(--co-text-11)", "11px, abaixo dos 12px de legenda"],
    [".co-nav-list__item", "var(--co-text-14)", "14px, abaixo dos 16px de corpo"],
  ])("a isca: %s com %s reprova", (seletor, valor, motivo) => {
    expect(faltasNaFolha(comLetra(seletor, valor))).toEqual([`${seletor}: ${motivo}`]);
  });

  it("a isca: uma regra nova com letra e sem papel reprova", () => {
    const nova: Regra = { profundidade: 0, seletores: [".co-nova"], declaracoes: [["font-size", "var(--co-text-16)"]] };
    const atalho: Regra = { profundidade: 0, seletores: [".co-outra"], declaracoes: [["font", "12px sans-serif"]] };
    expect(faltasNaFolha([...REGRAS, nova, atalho])).toEqual([
      ".co-nova: letra sem papel",
      ".co-outra: atalho font sem papel",
    ]);
  });

  it("a isca: a letra dentro de um @media também tem de ter papel", () => {
    const estreita: Regra = {
      profundidade: 1,
      seletores: ['.co-text[data-variant="body"]'],
      declaracoes: [["font-size", "var(--co-text-14)"]],
    };
    expect(faltasNaFolha([...REGRAS, estreita])).toEqual(['@ .co-text[data-variant="body"]: letra sem papel']);
  });
});

// ------------------------------------------- a escala do Relógio de Sol --

/**
 * Acima do piso, a escala da identidade (design/identidade.md, plano s7,
 * ADR-022): corpo, campo e botão de 17px, legenda e secundário de 14px, caixa
 * alta de 13px, aba de 11px, título de tela de 26px no toque e de 30px com
 * ponteiro fino. O piso diz o mínimo; isto diz o desenho, e uma letra que muda
 * sem a identidade mudar reprova aqui.
 */
const ESCALA: Readonly<Record<string, number>> = {
  '.co-text[data-variant="title-lg"]': 26,
  '.co-text[data-variant="numeral"]': 56,
  '.co-text[data-variant="headline"]': 17,
  '.co-text[data-variant="body"]': 17,
  '.co-text[data-variant="callout"]': 14,
  '.co-text[data-variant="subhead"]': 13,
  '.co-text[data-variant="footnote"]': 14,
  '.co-text[data-variant="caption"]': 14,
  '.co-text[data-variant="label"]': 13,
  '.co-text[data-variant="micro"]': 13,
  ".co-button": 17,
  '.co-button[data-size="lg"]': 17,
  ".co-input__control": 17,
  ".co-search__control": 17,
  ".co-tabbar__item": 11,
  ".co-chip": 13,
  ".co-segmented__option": 13,
  '@ .co-text[data-variant="title-lg"]': 30,
};

function foraDaEscala(regras: readonly Regra[]): string[] {
  return Object.entries(ESCALA).flatMap(([seletor, px]) => {
    const declarada = regras
      .filter((regra) => lugar(regra) === seletor)
      .flatMap((regra) => regra.declaracoes.filter(([p]) => p === "font-size").map(([, v]) => v));
    if (declarada.length !== 1) return [`${seletor}: ${declarada.length} letras declaradas`];
    const medida = avaliar(declarada[0] ?? "", TOKENS);
    return medida === px ? [] : [`${seletor}: ${medida}px, e a identidade pede ${px}px`];
  });
}

describe("a escala do Relógio de Sol", () => {
  it("cada letra da tabela é a da identidade", () => {
    expect(foraDaEscala(REGRAS)).toEqual([]);
  });

  it("o título de 30px mora só no @media do ponteiro fino", () => {
    expect(
      dentroDe("@media (pointer: fine)")
        .filter((regra) => regra.declaracoes.some(([p]) => p === "font-size"))
        .map((regra) => [regra.seletores.join(", "), regra.declaracoes.find(([p]) => p === "font-size")?.[1]]),
    ).toEqual([['.co-text[data-variant="title-lg"]', "var(--co-text-30)"]]);
  });

  it("a isca: o corpo de volta a 16px e a legenda a 12px reprovam pela tabela", () => {
    expect(foraDaEscala(comLetra('.co-text[data-variant="body"]', "var(--co-text-16)"))).toEqual([
      '.co-text[data-variant="body"]: 16px, e a identidade pede 17px',
    ]);
    expect(foraDaEscala(comLetra('.co-text[data-variant="caption"]', "var(--co-text-12)"))).toEqual([
      '.co-text[data-variant="caption"]: 12px, e a identidade pede 14px',
    ]);
    expect(foraDaEscala(REGRAS.filter((regra) => lugar(regra) !== '@ .co-text[data-variant="title-lg"]'))).toEqual([
      '@ .co-text[data-variant="title-lg"]: 0 letras declaradas',
    ]);
  });
});

// --------------------------------------------------------- nas variantes --

/** As variantes que o tipo `TextVariant` declara, lidas do fonte. */
function variantesDoTipo(): string[] {
  const tipo = /export type TextVariant =([^;]+);/.exec(textoDoText)?.[1] ?? "";
  return [...tipo.matchAll(/"([\w-]+)"/g)].map((achado) => achado[1] ?? "");
}

const letra = (elemento: Element) => Number.parseFloat(getComputedStyle(elemento).fontSize);

afterEach(() => {
  for (const isca of document.head.querySelectorAll("style[data-isca]")) isca.remove();
});

function isca(css: string) {
  const estilo = document.createElement("style");
  estilo.dataset["isca"] = "";
  estilo.textContent = css;
  document.head.append(estilo);
}

describe("o piso de letra nas variantes do Text", () => {
  it("toda variante do tipo tem papel, e todo papel é de uma variante do tipo", () => {
    const doTipo = variantesDoTipo();
    expect(doTipo.length).toBeGreaterThanOrEqual(10);
    expect([...doTipo].sort()).toEqual(Object.keys(VARIANTES).sort());
  });

  it.each(Object.entries(VARIANTES))("%s, renderizada, fica no piso de %s", (variante, papel) => {
    const { container } = render(
      <Text variant={variante as never}>Texto</Text>,
    );
    const elemento = container.firstElementChild as Element;
    // Zero seria a letra que não chegou: o teste mediria nada e passaria.
    expect(letra(elemento)).toBeGreaterThan(0);
    expect(letra(elemento)).toBeGreaterThanOrEqual(PISO[papel]);
  });

  it("a isca: o corpo de volta a 15px reprova no estilo computado", () => {
    isca('.co-text[data-variant="body"] { font-size: var(--co-text-15); }');
    const { container } = render(<Text variant="body">Texto</Text>);
    expect(letra(container.firstElementChild as Element)).toBe(15);
  });
});

// ------------------------------------------------------------ nas peças --

/** Uma tela com cada peça que escreve texto por conta própria. */
function Pecas() {
  return (
    <>
      <Notice title="Sem conexão">O registro entra na fila e sobe quando a rede voltar.</Notice>
      <EmptyState title="Nada por aqui">Quando houver algo, aparece aqui.</EmptyState>
      <ListRow description="Arroz · Feijão · Salada">Almoço</ListRow>
      <NavList
        label="Ajustes"
        opens="detail"
        value="conta"
        onChange={vi.fn()}
        items={[
          { value: "conta", label: "Conta", description: "Nome e acesso", trailing: "2", group: "Geral" },
          { value: "tema", label: "Tema", group: "Geral" },
        ]}
      />
      <Group label="Seção" labelTrailing="3 itens" note="A nota que explica o grupo." error="O que falta escolher.">
        <ListRow>Linha</ListRow>
      </Group>
      <Field label="Peso" hint="Em quilos." error="Escreva um número.">
        {(controle) => <input {...controle} />}
      </Field>
      <Reckoning lines={[{ label: "Meta", value: "1.917", expression: "370 + 21,6 × 65,91" }]} note="Arredondado." />
      <Stat label="Restante" value="995" unit="kcal" caption="de 1.917 kcal" />
      <Disclosure summary="De onde vem" defaultOpen>
        A conta usa a fórmula escolhida.
      </Disclosure>
      <Badge>Novo</Badge>
      <Rail
        label="Principal"
        value="hoje"
        onChange={vi.fn()}
        items={[
          { value: "hoje", label: "Hoje", icon: "book", group: "Dia" },
          { value: "voce", label: "Você", icon: "user", group: "Conta" },
        ]}
      />
      <TabBar
        label="Principal"
        position="static"
        value="hoje"
        onChange={vi.fn()}
        items={[
          { value: "hoje", label: "Hoje", icon: "book" },
          { value: "voce", label: "Você", icon: "user" },
        ]}
      />
    </>
  );
}

/** O texto de cada peça que o piso nomeia, e o papel dele. */
const TEXTOS: readonly (readonly [nome: string, seletor: string, papel: Papel])[] = [
  ["o título do aviso", ".co-notice__body > :first-child", "secundario"],
  ["o corpo do aviso", ".co-notice__body > :nth-child(2)", "secundario"],
  ["o texto do vazio", ".co-empty > .co-text:not(:first-of-type)", "secundario"],
  ["a linha de baixo da ListRow", ".co-list-row__description", "secundario"],
  ["a linha de baixo do NavList", ".co-nav-list__description", "secundario"],
  ["o rótulo do NavList", ".co-nav-list__label", "corpo"],
  ["o rótulo de grupo do NavList", ".co-nav-list__group-label", "legenda"],
  ["o rótulo de grupo do trilho", ".co-rail__group-label", "legenda"],
  ["o rótulo de seção do Group", ".co-group__label > :first-child", "legenda"],
  ["a nota do Group", ".co-group__note", "secundario"],
  ["o erro do Group e do Field", ".co-group__error, .co-field__error", "secundario"],
  ["a nota da conta", ".co-reckoning > .co-text:last-child", "secundario"],
  ["a nota do Disclosure", ".co-disclosure__body > .co-text", "secundario"],
  ["o selo", ".co-badge", "legenda"],
  ["o rótulo da barra de abas", ".co-tabbar__item", "aba"],
];

/** Cada texto nomeado fora do piso, e cada nó com texto abaixo de 12px fora da barra de abas. */
function faltasNaTela(raiz: Element): string[] {
  const nomeados = TEXTOS.flatMap(([nome, seletor, papel]) => {
    const achados = [...raiz.querySelectorAll(seletor)];
    if (achados.length === 0) return [`${nome}: não achei ${seletor}`];
    return achados
      .filter((elemento) => !(letra(elemento) >= PISO[papel]))
      .map((elemento) => `${nome}: ${letra(elemento)}px, abaixo dos ${PISO[papel]}px de ${papel}`);
  });
  const todos = [...raiz.querySelectorAll("*")]
    .filter((elemento) => [...elemento.childNodes].some((no) => no.nodeType === 3 && (no.textContent ?? "").trim()))
    .filter((elemento) => !elemento.closest(".co-tabbar__item"))
    .filter((elemento) => !(letra(elemento) >= PISO.legenda))
    .map((elemento) => `<${elemento.tagName.toLowerCase()} class="${elemento.className}">: ${letra(elemento)}px`);
  return [...nomeados, ...todos];
}

describe("o piso de letra nas peças", () => {
  it("cada texto que a peça escreve fica no piso do que ele é", () => {
    const { container } = render(<Pecas />);
    expect(faltasNaTela(container)).toEqual([]);
  });

  it.each(["light", "dark"] as const)("no tema %s, as peças com a letra nova passam no axe", async (tema) => {
    const { container } = render(
      <ThemeProvider theme={tema} attachTo="element" storageKey={null}>
        <Pecas />
      </ThemeProvider>,
    );
    const resultado = await axe.run(container, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      // O happy-dom não pinta: o contraste é provado em `tokens/contraste.test.ts`.
      rules: { "color-contrast": { enabled: false } },
    });
    expect(resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual(
      [],
    );
  });

  it("a isca: as letras da 1.13.0 reprovam, cada uma pelo seu texto", () => {
    isca(`
      .co-text[data-variant="footnote"] { font-size: var(--co-text-12); }
      .co-text[data-variant="label"] { font-size: var(--co-text-11); }
      .co-text[data-variant="micro"] { font-size: var(--co-text-10); }
      .co-tabbar__item { font-size: var(--co-text-10); }
    `);
    const { container } = render(<Pecas />);
    const faltas = faltasNaTela(container);
    expect(faltas).toEqual(
      expect.arrayContaining([
        "o corpo do aviso: 12px, abaixo dos 14px de secundario",
        "o texto do vazio: 12px, abaixo dos 14px de secundario",
        "a nota do Group: 12px, abaixo dos 14px de secundario",
        "a nota da conta: 12px, abaixo dos 14px de secundario",
        "a nota do Disclosure: 12px, abaixo dos 14px de secundario",
        "o rótulo de grupo do NavList: 10px, abaixo dos 12px de legenda",
        "o rótulo de grupo do trilho: 10px, abaixo dos 12px de legenda",
        "o rótulo de seção do Group: 11px, abaixo dos 12px de legenda",
        "o rótulo da barra de abas: 10px, abaixo dos 11px de aba",
      ]),
    );
    // E a rede de baixo pega o versalete miúdo mesmo sem o nome dele na lista.
    expect(faltas.some((falta) => falta.includes('class="co-text"') && falta.endsWith(": 11px"))).toBe(true);
  });

  it("a isca: a linha de baixo, a nota e o corpo do aviso de volta à variante da 1.13.0 reprovam", () => {
    const { container } = render(<Pecas />);
    // A regressão de verdade é a peça escrever a variante de antes.
    // Desde a 2.0 a legenda (`caption`) tem 14px (ADR-022), e a variante que
    // fica abaixo do secundário é a de 13px (`subhead`).
    for (const seletor of [".co-list-row__description", ".co-nav-list__description", ".co-group__note"]) {
      container.querySelector(seletor)?.setAttribute("data-variant", "subhead");
    }
    container.querySelector(".co-notice__body > :nth-child(2)")?.setAttribute("data-variant", "subhead");
    expect(faltasNaTela(container)).toEqual([
      "o corpo do aviso: 13px, abaixo dos 14px de secundario",
      "a linha de baixo da ListRow: 13px, abaixo dos 14px de secundario",
      "a linha de baixo do NavList: 13px, abaixo dos 14px de secundario",
      "a nota do Group: 13px, abaixo dos 14px de secundario",
    ]);
  });

  it("a isca: um seletor que não acha nada reprova, em vez de medir nada", () => {
    const { container } = render(<Badge>Novo</Badge>);
    expect(faltasNaTela(container)).toContain("o corpo do aviso: não achei .co-notice__body > :nth-child(2)");
  });
});

// ------------------------------------------------------------- nas histórias --

const HISTORIAS = import.meta.glob<string>("./**/*.stories.tsx", { query: "?raw", import: "default", eager: true });

/** Cada `fontSize` em px escrito à mão abaixo de 12, numa história. */
function miudasNasHistorias(fontes: Readonly<Record<string, string>>): string[] {
  return Object.entries(fontes).flatMap(([arquivo, fonte]) =>
    [...fonte.matchAll(/fontSize:\s*["'`](\d+(?:\.\d+)?)px/g)]
      .filter((achado) => Number(achado[1]) < PISO.legenda)
      .map((achado) => `${arquivo}: fontSize ${achado[1]}px`),
  );
}

describe("o piso de letra nas histórias do catálogo", () => {
  it("nenhuma história escreve à mão uma letra abaixo de 12px", () => {
    expect(Object.keys(HISTORIAS).length).toBeGreaterThan(20);
    expect(miudasNasHistorias(HISTORIAS)).toEqual([]);
  });

  it("a isca: a amostra de token com fontSize 10px reprova", () => {
    expect(miudasNasHistorias({ "x.stories.tsx": '<Text style={{ fontSize: "10px" }}>4</Text>' })).toEqual([
      "x.stories.tsx: fontSize 10px",
    ]);
  });
});
