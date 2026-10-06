import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CSSProperties, ReactNode } from "react";
import { expect, it } from "vitest";
import { Button } from "./atoms/Button";
import { Screen } from "./atoms/Screen";
import { Stack } from "./atoms/Stack";
import { TabBar } from "./molecules/TabBar";
import "./styles.css";
import {
  aparelho,
  avaliar,
  BARRA_DE_ACAO,
  bloco,
  lugar,
  normalizar,
  paddingQueVale,
  partes,
  REGRAS,
  SEM_AREA,
  type Declaracao,
} from "./test/folha";

/**
 * A barra de ação da 1.8.0 (ADR-013): onde ela entra na árvore da `Screen`, a
 * folha que a põe em cima das abas, e a reserva e o recuo da rolagem que a
 * tela ganha por ela.
 *
 * A geometria é provada como a da área segura (`area-segura.test.tsx`): pelo
 * TEXTO da regra, avaliado em `./test/folha.ts`, porque o happy-dom não faz
 * conta; e pelo VALOR RESOLVIDO onde ele substitui o `var()`.
 *
 * A condição "com conteúdo" é avaliada À MÃO, na forma que a folha escreve,
 * contra a árvore que a `Screen` monta, porque o happy-dom erra as duas metades
 * dela: o `:has()` com seletor composto ele casa sempre (inclusive no `:root`
 * de uma página sem tela nenhuma), e o `:empty` dele só olha filho ELEMENTO —
 * `<button>Calcular</button>` sai vazio, e o navegador conta o texto. Onde a
 * cascata do happy-dom entra (a barra vazia escondida, a ordem do Tab), o botão
 * vai num hospedeiro, como o do portal do Basalto. O pixel é do navegador.
 */

const ABAS = [
  { value: "diario", label: "Diário", icon: "book" },
  { value: "gasto", label: "Gasto", icon: "chart" },
] as const;

const abas = <TabBar label="Seções" items={ABAS} value="diario" onChange={() => undefined} />;

/** Um ancestral que declara a área segura, como o consumidor faria por cima da folha. */
function Por({
  area,
  children,
}: Readonly<{ area: Readonly<Record<string, string>>; children: ReactNode }>) {
  return <div style={area as CSSProperties}>{children}</div>;
}

/** O hospedeiro em fileira que um portal usaria, com o que veio para ele. */
function hospedeiro(conteudo?: ReactNode) {
  return (
    <Stack direction="row" gap={8}>
      {conteudo}
    </Stack>
  );
}

/** Um componente que não desenha nada: a barra fica sem filho nenhum. */
function Nada() {
  return null;
}

function telaDe(container: HTMLElement): Element {
  const tela = container.querySelector(".co-screen");
  expect(tela, "a moldura").not.toBeNull();
  return tela as Element;
}

const valor = (declaracoes: Declaracao[], propriedade: string) =>
  Object.fromEntries(declaracoes)[propriedade] ?? "";

/** O termo do rodapé das barras de baixo (ADR-012), o mesmo texto em toda regra. */
const RODAPE = "max(var(--co-space-10), calc(var(--co-safe-bottom) - var(--co-space-14)))";
const RESERVA_DAS_ABAS = '.co-screen[data-tabbar="true"]';

/** A barra de abas montada: respiro de cima, destino, fio e rodapé (ADR-012). */
function alturaDasAbas(baixo: number): number {
  const regra = bloco(".co-tabbar");
  const { topo, baixo: rodape } = paddingQueVale(regra, aparelho(0, 0, baixo, 0));
  const destino = avaliar(valor(bloco(".co-tabbar__item"), "min-height"), SEM_AREA);
  const fio = avaliar(partes(valor(regra, "border-top"))[0] ?? "", SEM_AREA);
  return topo + destino + fio + rodape;
}

// ---------------------------------------------------------------- a árvore --

it("a barra de ação vem depois do conteúdo e as abas depois dela, no documento e no Tab", async () => {
  const usuario = userEvent.setup();
  const { container } = render(
    <Screen tabBar={abas} actionBar={hospedeiro(<Button>Calcular</Button>)}>
      <button type="button">Campo do conteúdo</button>
    </Screen>,
  );
  const tela = telaDe(container);
  expect(
    [...tela.children].map((filho) => filho.getAttribute("class")?.split(" ")[0] ?? filho.tagName),
  ).toEqual(["co-screen__statusbar", "BUTTON", "co-screen__actionbar", "co-tabbar"]);
  expect(tela).toHaveAttribute("data-tabbar", "true");
  expect(tela).toHaveAttribute("data-actionbar", "true");

  // A ordem do Tab é a da tela vista de cima para baixo (WCAG 2.4.3).
  const ordem: string[] = [];
  for (let passo = 0; passo < 4; passo++) {
    await usuario.tab();
    ordem.push(document.activeElement?.textContent ?? "");
  }
  expect(ordem).toEqual(["Campo do conteúdo", "Calcular", "Diário", "Gasto"]);
});

it("a barra de ação só existe com nó, e sai sem style mesmo com style na tela", () => {
  const semNo: [string, ReactNode][] = [
    ["undefined", undefined],
    ["null", null],
    ["false", false],
    ["true", true],
    ["texto vazio", ""],
  ];
  for (const [nome, no] of semNo) {
    const { container } = render(<Screen actionBar={no}>conteúdo</Screen>);
    const tela = telaDe(container);
    expect(tela.querySelector(BARRA_DE_ACAO.barra), nome).toBeNull();
    expect(tela.hasAttribute("data-actionbar"), nome).toBe(false);
    cleanup();
  }

  const { container } = render(
    <Screen
      tabBar
      className="x"
      style={{ color: "red" }}
      actionBar={hospedeiro(<Button>Calcular</Button>)}
    >
      conteúdo
    </Screen>,
  );
  const tela = telaDe(container);
  const barras = tela.querySelectorAll(BARRA_DE_ACAO.barra);
  expect(barras).toHaveLength(1);
  const barra = barras[0] as Element;
  // O `style` de fora fica na moldura; à barra não chega atributo nenhum além
  // da classe — nada inline, a CSP com `style-src 'self'` continua de pé.
  expect(tela.getAttribute("style")).toBe("color: red;");
  expect(barra.getAttributeNames()).toEqual(["class"]);
  expect(barra.getAttribute("class")).toBe("co-screen__actionbar");
  expect(barra.parentElement).toBe(tela);
  expect(screen.getByRole("button", { name: "Calcular" }).parentElement?.parentElement).toBe(barra);
});

it("tabBar true dá a árvore da 1.7.1: só a reserva, sem nó e sem barra de ação", () => {
  // A saída da 1.7.1, letra por letra: a faixa sob o relógio e o conteúdo.
  const DA_171 = {
    semAbas:
      '<div class="co-screen co-grain"><div class="co-screen__statusbar" aria-hidden="true"></div>conteúdo</div>',
    comAbas:
      '<div class="co-screen co-grain" data-tabbar="true"><div class="co-screen__statusbar" aria-hidden="true"></div>conteúdo</div>',
  };
  const casos: [string, ReactNode, string][] = [
    ["sem prop", <Screen key="a">conteúdo</Screen>, DA_171.semAbas],
    ["tabBar false", <Screen key="b" tabBar={false}>conteúdo</Screen>, DA_171.semAbas],
    ["tabBar null", <Screen key="c" tabBar={null}>conteúdo</Screen>, DA_171.semAbas],
    ["tabBar true", <Screen key="d" tabBar>conteúdo</Screen>, DA_171.comAbas],
    [
      "tabBar true e actionBar null",
      <Screen key="e" tabBar actionBar={null}>
        conteúdo
      </Screen>,
      DA_171.comAbas,
    ],
  ];
  const saidas = casos.map(([nome, elemento]) => {
    const { container } = render(elemento);
    const saida = [nome, container.innerHTML];
    cleanup();
    return saida;
  });
  expect(saidas).toEqual(casos.map(([nome, , esperada]) => [nome, esperada]));

  // Um nó também reserva, e entra como o último filho — depois do conteúdo.
  const { container } = render(<Screen tabBar={abas}>conteúdo</Screen>);
  const tela = telaDe(container);
  expect(tela).toHaveAttribute("data-tabbar", "true");
  expect(tela.lastElementChild).toHaveClass("co-tabbar");
  expect(tela.querySelectorAll(".co-tabbar")).toHaveLength(1);
});

// ---------------------------------------------------------------- a folha --

it("a barra de ação é fixa, na camada das abas e abaixo do painel, com o vidro delas e nada mais", () => {
  // As quinze, nesta ordem, num bloco só e no nível de cima da folha.
  expect(bloco(BARRA_DE_ACAO.barra)).toEqual([
    ["position", "fixed"],
    ["right", "0"],
    ["bottom", "0"],
    ["left", "0"],
    ["z-index", "20"],
    ["display", "flex"],
    ["align-items", "center"],
    ["gap", "var(--co-space-8)"],
    ["box-sizing", "border-box"],
    ["height", `calc(var(--co-actionbar-height) - var(--co-space-10) + ${RODAPE})`],
    [
      "padding",
      `var(--co-space-10) max(var(--co-space-16), var(--co-safe-right)) ${RODAPE} max(var(--co-space-16), var(--co-safe-left))`,
    ],
    ["background", "var(--co-overlay)"],
    ["backdrop-filter", "blur(22px)"],
    ["-webkit-backdrop-filter", "blur(22px)"],
    ["border-top", "var(--co-border-width) solid var(--co-overlay-line)"],
  ]);
  expect(bloco(BARRA_DE_ACAO.comAbas)).toEqual([
    ["bottom", `calc(73px - var(--co-space-10) + ${RODAPE})`],
    ["height", "var(--co-actionbar-height)"],
    ["padding-bottom", "var(--co-space-10)"],
  ]);

  // O vidro é o da barra de abas, propriedade por propriedade.
  const abasDeclaradas = Object.fromEntries(bloco(".co-tabbar"));
  for (const propriedade of ["background", "backdrop-filter", "-webkit-backdrop-filter", "border-top"]) {
    expect(valor(bloco(BARRA_DE_ACAO.barra), propriedade), propriedade).toBe(
      abasDeclaradas[propriedade],
    );
  }
  // A camada das abas, abaixo do véu do painel que sobe do rodapé.
  expect(abasDeclaradas["z-index"]).toBe("20");
  expect(Number(valor(bloco(".co-sheet-overlay"), "z-index"))).toBeGreaterThan(20);

  // Quem mais cita a classe: as regras da reserva, do recuo, da divisão e da
  // barra vazia — e nenhuma delas mexe em onde nem em quanto ela mede.
  const citam = REGRAS.filter((r) => r.seletores.some((s) => s.includes("co-screen__actionbar")))
    .map(lugar)
    .sort();
  expect(citam).toEqual(
    [
      BARRA_DE_ACAO.barra,
      BARRA_DE_ACAO.comAbas,
      BARRA_DE_ACAO.divide,
      BARRA_DE_ACAO.vazia,
      BARRA_DE_ACAO.reserva,
      BARRA_DE_ACAO.reservaComAbas,
      BARRA_DE_ACAO.recuo,
      BARRA_DE_ACAO.recuoComAmbas,
    ].sort(),
  );
  // A divisão tem dois seletores (o primeiro nível e o botão em qualquer
  // nível), e por isso não é um `bloco()` de seletor único.
  const divide = REGRAS.filter((r) => lugar(r) === BARRA_DE_ACAO.divide);
  expect(divide.map((r) => r.declaracoes)).toEqual([
    [
      ["flex", "1 1 0"],
      ["min-width", "0"],
    ],
  ]);
  expect(bloco(BARRA_DE_ACAO.vazia)).toEqual([["display", "none"]]);
});

it("um botão ou dois dão a mesma altura de barra: a fileira é um token, e os botões dividem a largura", () => {
  // O token, declarado só no `:root`: o fio, o respiro de cima, o alvo de 44px
  // e o respiro de baixo.
  const declaram = REGRAS.flatMap((r) =>
    r.declaracoes.filter(([p]) => p === "--co-actionbar-height").map(([p, v]) => [lugar(r), p, v]),
  );
  expect(declaram).toEqual([
    [
      ":root",
      "--co-actionbar-height",
      "calc(var(--co-border-width) + var(--co-space-10) + var(--co-target-min) + var(--co-space-10))",
    ],
  ]);
  expect(avaliar("var(--co-actionbar-height)", SEM_AREA)).toBe(65);

  // A altura é DECLARADA (`height`), e nada a deixa crescer com o que vem
  // dentro: nem altura mínima, nem quebra de linha, nem coluna.
  const crescem = REGRAS.filter((r) => r.seletores.some((s) => s.includes("co-screen__actionbar")))
    .flatMap((r) => r.declaracoes.map(([p]) => `${lugar(r)} ${p}`))
    .filter((linha) => /(min-height|max-height|flex-wrap|flex-direction|flex-flow)$/.test(linha));
  expect(crescem).toEqual([]);

  // Por dentro, a fileira é o botão de 44px — com e sem as abas, com e sem área
  // segura: a altura menos o respiro e o fio é o alvo mínimo do sistema.
  const fio = avaliar(partes(valor(bloco(BARRA_DE_ACAO.barra), "border-top"))[0] ?? "", SEM_AREA);
  const alvo = avaliar("var(--co-target-min)", SEM_AREA);
  for (const baixo of [0, 21, 34, 48]) {
    const area = aparelho(0, 0, baixo, 0);
    const sozinha = bloco(BARRA_DE_ACAO.barra);
    const comAbas = [...sozinha, ...bloco(BARRA_DE_ACAO.comAbas)];
    for (const [nome, regra] of [
      ["sem abas", sozinha],
      ["com abas", comAbas],
    ] as const) {
      const { topo, baixo: rodape } = paddingQueVale([...regra], area);
      const altura = avaliar(valor([...regra], "height"), area);
      expect(altura - topo - rodape - fio, `${nome}, ${baixo}px`).toBe(alvo);
    }
  }

  // Montada, a barra resolve a mesma altura com um botão ou com dois, dentro de
  // um hospedeiro em fileira como o de um portal.
  const alturas = [1, 2].map((quantos) => {
    const { container } = render(
      <Screen
        tabBar
        actionBar={
          <Stack direction="row" gap={8}>
            {Array.from({ length: quantos }, (_, i) => (
              <Button key={i}>Ação {i + 1}</Button>
            ))}
          </Stack>
        }
      >
        conteúdo
      </Screen>,
    );
    const barra = container.querySelector(BARRA_DE_ACAO.barra) as Element;
    const altura = normalizar(getComputedStyle(barra).getPropertyValue("height"));
    expect(container.querySelectorAll(`${BARRA_DE_ACAO.barra} .co-button`)).toHaveLength(quantos);
    cleanup();
    return altura;
  });
  expect(alturas[0]).toBe(alturas[1]);
  expect(avaliar(alturas[0] ?? "", SEM_AREA)).toBe(65);
});

it("com a barra de ação, a última linha fica 31px acima dela, com e sem área segura, com abas e sem abas", () => {
  const sozinha = bloco(BARRA_DE_ACAO.barra);
  const comAbas = [...sozinha, ...bloco(BARRA_DE_ACAO.comAbas)];
  const reserva = valor(bloco(BARRA_DE_ACAO.reserva), "--co-screen-bottom");
  const reservaComAbas = valor(bloco(BARRA_DE_ACAO.reservaComAbas), "--co-screen-bottom");
  // A reserva com as duas é a das abas da 1.7.1, mais uma fileira.
  expect(reservaComAbas).toBe(
    `${valor(bloco(RESERVA_DAS_ABAS), "--co-screen-bottom").slice(0, -1)} + var(--co-actionbar-height))`,
  );

  const medidas = [0, 21, 34, 48].map((baixo) => {
    const area = aparelho(0, 0, baixo, 0);
    const abasMedem = alturaDasAbas(baixo);
    const barraComAbas = avaliar(valor(comAbas, "height"), area);
    const barraSozinha = avaliar(valor(sozinha, "height"), area);
    return {
      baixo,
      // A barra encosta no topo das abas: o `bottom` dela é a altura delas.
      vao: avaliar(valor(comAbas, "bottom"), area) - abasMedem,
      sozinhaEncostaNaBorda: avaliar(valor(sozinha, "bottom"), area),
      folgaComAbas: avaliar(reservaComAbas, area) - (abasMedem + barraComAbas),
      folgaSemAbas: avaliar(reserva, area) - barraSozinha,
      reservaComAbas: avaliar(reservaComAbas, area),
      reservaSemAbas: avaliar(reserva, area),
    };
  });
  const esperadas = [
    [0, 169, 96],
    [21, 169, 96],
    [34, 179, 106],
    [48, 193, 120],
  ].map(([baixo, comAbas, semAbas]) => ({
    baixo,
    vao: 0,
    sozinhaEncostaNaBorda: 0,
    folgaComAbas: 31,
    folgaSemAbas: 31,
    reservaComAbas: comAbas,
    reservaSemAbas: semAbas,
  }));
  expect(medidas).toEqual(esperadas);

  // O valor resolvido na tela montada: a área de baixo que o consumidor (ou o
  // aparelho) declara num ancestral chega à reserva, que chega ao rodapé.
  for (const [baixo, comAsAbas, esperada] of [
    [0, true, 169],
    [34, true, 179],
    [0, false, 96],
    [34, false, 106],
  ] as const) {
    const { container } = render(
      <Por area={{ "--co-safe-bottom": `${baixo}px` }}>
        <Screen tabBar={comAsAbas} actionBar={<Button>Calcular</Button>}>
          conteúdo
        </Screen>
      </Por>,
    );
    const tela = telaDe(container);
    const resolvida = normalizar(getComputedStyle(tela).getPropertyValue("--co-screen-bottom"));
    expect(avaliar(resolvida, SEM_AREA), `${baixo}px, abas: ${comAsAbas}`).toBe(esperada);
    const rodape = partes(normalizar(getComputedStyle(tela).getPropertyValue("padding-block")))[1];
    expect(rodape).toBe(resolvida);
    cleanup();
  }
});

/**
 * `:not(:empty)` como o navegador o lê: o elemento tem um filho que não é
 * comentário — elemento OU texto. (O do happy-dom ignora o texto.)
 */
const temFilho = (elemento: Element) =>
  [...elemento.childNodes].some((no) => no.nodeType !== Node.COMMENT_NODE);

/** A barra tem um descendente que não está vazio — a condição das cinco regras. */
const comConteudo = (barra: Element) => [...barra.querySelectorAll("*")].some(temFilho);

const CONDICAO = ":not(:empty)";

/**
 * A condição "com conteúdo" de uma regra, avaliada à mão na árvore montada,
 * na forma que a folha escreve: `<base>:has(> .co-screen__actionbar <dentro>)`
 * na tela, `:root:has(<base> > .co-screen__actionbar <dentro>)` no documento,
 * `.co-screen__actionbar:not(:has(<dentro>))` na barra. Outra forma falha aqui,
 * em vez de ser avaliada errado.
 */
function casaNaTela(seletor: string, tela: Element): boolean {
  const forma = /^(.+?):has\(> \.co-screen__actionbar (.+)\)$/.exec(seletor);
  expect(forma, `forma da regra: ${seletor}`).not.toBeNull();
  const [, base = "", dentro = ""] = forma ?? [];
  expect(dentro, seletor).toBe(CONDICAO);
  return (
    tela.matches(base) &&
    [...tela.children].some((filho) => filho.matches(BARRA_DE_ACAO.barra) && comConteudo(filho))
  );
}

function casaNoDocumento(seletor: string, tela: Element): boolean {
  const forma = /^:root:has\((.+?) > \.co-screen__actionbar (.+)\)$/.exec(seletor);
  expect(forma, `forma da regra: ${seletor}`).not.toBeNull();
  const [, base = "", dentro = ""] = forma ?? [];
  return casaNaTela(`${base}:has(> .co-screen__actionbar ${dentro})`, tela);
}

function escondida(barra: Element): boolean {
  const forma = /^\.co-screen__actionbar:not\(:has\((.+)\)\)$/.exec(BARRA_DE_ACAO.vazia);
  expect(forma?.[1], "forma da barra vazia").toBe(CONDICAO);
  return !comConteudo(barra);
}

it("barra vazia não pinta nem reserva, nem com um embrulho vazio em volta", () => {
  // A mesma condição nas cinco regras que dependem dela: um descendente da
  // barra que não está vazio.
  const condicoes = [
    /^\.co-screen__actionbar:not\(:has\((.+)\)\)$/.exec(BARRA_DE_ACAO.vazia),
    ...[BARRA_DE_ACAO.reserva, BARRA_DE_ACAO.reservaComAbas].map((s) =>
      /^.+?:has\(> \.co-screen__actionbar (.+)\)$/.exec(s),
    ),
    ...[BARRA_DE_ACAO.recuo, BARRA_DE_ACAO.recuoComAmbas].map((s) =>
      /^:root:has\(.+? > \.co-screen__actionbar (.+)\)$/.exec(s),
    ),
  ].map((achado) => achado?.[1]);
  expect(condicoes).toEqual(Array.from({ length: 5 }, () => CONDICAO));

  // [nome, o que vai na barra, tem conteúdo, o happy-dom acerta a cascata]
  const casos: [string, ReactNode, boolean, boolean][] = [
    ["um componente que não desenha nada", <Nada key="a" />, false, true],
    ["um hospedeiro vazio de portal", hospedeiro(), false, true],
    [
      "dois embrulhos vazios lado a lado",
      <>
        <Stack direction="row" gap={8} />
        <span />
      </>,
      false,
      true,
    ],
    ["um botão no hospedeiro", hospedeiro(<Button>Nova refeição</Button>), true, true],
    [
      "dois botões no hospedeiro",
      hospedeiro([<Button key="1">Novo cálculo</Button>, <Button key="2">Ajustar dados</Button>]),
      true,
      true,
    ],
    // Só texto dentro do botão: o `:empty` do happy-dom o dá por vazio.
    ["um botão direto na barra", <Button key="e">Calcular</Button>, true, false],
  ];

  const medidos = casos.flatMap(([nome, no]) =>
    [false, true].map((comAsAbas) => {
      const { container } = render(
        <Screen tabBar={comAsAbas} actionBar={no}>
          conteúdo
        </Screen>,
      );
      const tela = telaDe(container);
      const barra = tela.querySelector(BARRA_DE_ACAO.barra) as Element;
      const medido = {
        nome,
        comAsAbas,
        pelaRegra: !escondida(barra),
        reserva: casaNaTela(comAsAbas ? BARRA_DE_ACAO.reservaComAbas : BARRA_DE_ACAO.reserva, tela),
        recuo: casaNoDocumento(comAsAbas ? BARRA_DE_ACAO.recuoComAmbas : BARRA_DE_ACAO.recuo, tela),
      };
      cleanup();
      return medido;
    }),
  );
  expect(medidos).toEqual(
    casos.flatMap(([nome, , cheia]) =>
      [false, true].map((comAsAbas) => ({
        nome,
        comAsAbas,
        pelaRegra: cheia,
        reserva: cheia,
        recuo: cheia,
      })),
    ),
  );

  // E a folha carregada, onde o happy-dom acerta: a barra vazia sai da tela (e
  // da árvore de acessibilidade); a com botão fica, e o botão se alcança.
  for (const [nome, no, cheia] of casos.filter(([, , , fiel]) => fiel)) {
    const { container } = render(
      <Screen tabBar actionBar={no}>
        conteúdo
      </Screen>,
    );
    const barra = container.querySelector(BARRA_DE_ACAO.barra) as Element;
    expect(getComputedStyle(barra).display !== "none", nome).toBe(cheia);
    expect(screen.queryAllByRole("button").length > 0, nome).toBe(cheia);
    cleanup();
  }
});

it("o recuo de baixo da rolagem é 0 sem barras e o mesmo termo da reserva com elas", () => {
  // Sem barra nenhuma, o zero do `:root`. (O valor resolvido no `:root` não se
  // lê aqui: o happy-dom casa o `:has()` composto das barras até numa página
  // sem tela; o Chromium o mede.)
  expect(valor(bloco(":root"), "scroll-padding-bottom")).toBe("0px");

  // Cada caso, o MESMO texto da reserva do mesmo caso, e a mesma condição: a
  // base do `:has()` do `:root` é o seletor da tela com a barra.
  const pares = [
    [BARRA_DE_ACAO.recuoComAbas, RESERVA_DAS_ABAS],
    [BARRA_DE_ACAO.recuo, BARRA_DE_ACAO.reserva],
    [BARRA_DE_ACAO.recuoComAmbas, BARRA_DE_ACAO.reservaComAbas],
  ] as const;
  for (const [recuo, reserva] of pares) {
    expect(valor(bloco(recuo), "scroll-padding-bottom"), recuo).toBe(
      valor(bloco(reserva), "--co-screen-bottom"),
    );
    // `X:has(> .co-screen__actionbar Y)` na tela é `:root:has(X > .co-screen__actionbar Y)`.
    const naTela = reserva.includes(":has(")
      ? reserva.replace(":has(> .co-screen__actionbar ", " > .co-screen__actionbar ").slice(0, -1)
      : reserva;
    expect(recuo, reserva).toBe(`:root:has(${naTela})`);
  }

  // Os números: 104/114 com as abas, 96/106 só com a barra, 169/179 com as duas.
  const recuos = pares.map(([recuo]) =>
    [0, 34].map((baixo) =>
      avaliar(valor(bloco(recuo), "scroll-padding-bottom"), aparelho(0, 0, baixo, 0)),
    ),
  );
  expect(recuos).toEqual([
    [104, 114],
    [96, 106],
    [169, 179],
  ]);
});
