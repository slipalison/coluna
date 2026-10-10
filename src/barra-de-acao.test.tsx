import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { expect, it } from "vitest";
import { Button } from "./atoms/Button";
import { Chip } from "./atoms/Chip";
import { Input } from "./atoms/Input";
import { Screen } from "./atoms/Screen";
import { Stack } from "./atoms/Stack";
import { Disclosure } from "./molecules/Disclosure";
import { Field } from "./molecules/Field";
import { Group } from "./molecules/Group";
import { ListRow } from "./molecules/ListRow";
import { Sheet } from "./molecules/Sheet";
import { TabBar } from "./molecules/TabBar";
import "./styles.css";
import { ThemeProvider } from "./theme/ThemeProvider";
import {
  aparelho,
  avaliar,
  BARRA_DE_ACAO,
  bloco,
  dentroDe,
  lugar,
  normalizar,
  paddingQueVale,
  partes,
  REGRAS,
  SEM_AREA,
  TRAVA_DE_TOQUE,
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
 *
 * Desde a 1.8.1, a ação que acabou de chegar à barra se arma antes do toque
 * (adendo do ADR-013): a regra, a janela e a exceção do movimento reduzido são
 * provadas pelo texto e pela cascata do happy-dom, que resolve o atalho
 * `animation` e o `@media` de movimento. O clique ignorado durante a janela é
 * do navegador, e não daqui: o happy-dom não faz teste de acerto do ponteiro.
 *
 * Desde a 1.8.2, a mesma trava arma o que entra com a folha `overlay`, e as
 * abas e a barra se rearmam quando ela fecha (adendo do ADR-013). O happy-dom
 * acerta o `:root:has(.co-sheet-overlay)` da regra que rearma — o argumento é
 * um seletor simples, e não composto —, então a cascata prova que a animação
 * sai com a folha aberta e volta com ela fechada. O recomeço da animação, e o
 * toque que cai no contêiner, são do navegador.
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
  // barra vazia; desde a 1.8.1, a trava dos controles dela e a exceção do
  // movimento reduzido; e, desde a 1.8.2, a regra que a rearma quando a folha
  // fecha — e nenhuma delas mexe em onde nem em quanto ela mede.
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
      BARRA_DE_ACAO.arma,
      TRAVA_DE_TOQUE.rearma,
      `@ ${TRAVA_DE_TOQUE.excecao}`,
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

// ------------------------------------------- a ação que chega se arma (1.8.1) --

const TRAVA = "co-acao-armando";
const ATALHO = `${TRAVA} 400ms step-end`;
/** A trava da folha (1.8.2): a mesma janela, no relógio da camada. */
const TRAVA_DA_FOLHA = "co-folha-armando";
const ATALHO_DA_FOLHA = `${TRAVA_DA_FOLHA} 400ms step-end`;
const MENOS_MOVIMENTO = "@media (prefers-reduced-motion: reduce)";

/** As regras que usam uma das duas travas, na ordem da folha. */
const usamATrava = () =>
  REGRAS.filter((r) =>
    r.declaracoes.some(([, v]) => v.includes(TRAVA) || v.includes(TRAVA_DA_FOLHA)),
  );

/** A regra de um lugar: uma só, no nível de cima, com essa lista de seletores. */
function regraEm(seletores: string): Declaracao[] {
  const achadas = REGRAS.filter((r) => lugar(r) === seletores);
  expect(achadas, `regras em ${seletores}`).toHaveLength(1);
  return achadas[0]?.declaracoes ?? [];
}

/**
 * O que a cascata dá a cada controle da página: na barra, um botão do sistema,
 * um link e um `role="button"`, num hospedeiro como o do portal; fora dela, o
 * botão do conteúdo, os destinos das abas e um botão fora da tela. O tema em
 * volta é o que põe o `.co-root`, onde mora o zero do movimento reduzido.
 */
function cascataDosControles(propriedade: string): [string, string][] {
  const { container } = render(
    <ThemeProvider>
      <Screen
        tabBar={abas}
        actionBar={hospedeiro(
          <>
            <Button>Guardar esta meta</Button>
            <a href="#conta">Ver a conta</a>
            <span role="button" tabIndex={0}>
              Desfazer
            </span>
          </>,
        )}
      >
        <Button>Calcular</Button>
      </Screen>
      <Button>Fora da tela</Button>
    </ThemeProvider>,
  );
  const controles = [...container.querySelectorAll('button, a, [role="button"]')].map(
    (controle): [string, string] => [
      controle.textContent ?? "",
      normalizar(getComputedStyle(controle).getPropertyValue(propriedade)),
    ],
  );
  cleanup();
  return controles;
}

/** Onde mora o `prefers-reduced-motion` que a cascata do happy-dom lê. */
const dispositivo = () =>
  (window as unknown as { happyDOM: { settings: { device: { prefersReducedMotion: string } } } })
    .happyDOM.settings.device;

/** Roda `medir` com o aparelho pedindo menos movimento, e devolve o de antes. */
function comMenosMovimento<T>(medir: () => T): T {
  const antes = dispositivo().prefersReducedMotion;
  dispositivo().prefersReducedMotion = "reduce";
  try {
    return medir();
  } finally {
    dispositivo().prefersReducedMotion = antes;
  }
}

/**
 * A especificidade de um seletor desta folha: ids; classes, atributos e
 * pseudo-classes; tipos e pseudo-elementos. Sem pseudo-classe funcional
 * (`:is()`, `:not()`, `:where()`, `:has()`), que esta conta não sabe pesar e
 * por isso recusa.
 */
function especificidade(seletor: string): [number, number, number] {
  expect(seletor, "seletor sem pseudo-classe funcional").not.toMatch(/:(is|not|where|has)\(/);
  const ids = seletor.match(/#[\w-]+/g)?.length ?? 0;
  const classes = seletor.match(/\.[\w-]+|\[[^\]]*\]|(?<!:):[\w-]+/g)?.length ?? 0;
  const tipos =
    (seletor.match(/(?:^|[\s>+~])[a-z][\w-]*/gi)?.length ?? 0) +
    (seletor.match(/::[\w-]+/g)?.length ?? 0);
  return [ids, classes, tipos];
}

const maisEspecifico = (a: number[], b: number[]) => {
  const diferente = a.findIndex((parte, k) => parte !== b[k]);
  return diferente !== -1 && (a[diferente] ?? 0) > (b[diferente] ?? 0);
};

it("a ação que chega à barra se arma por uma regra que só os controles da barra recebem", () => {
  // Três regras armam, no nível de cima da folha e nesta ordem: a dos
  // controles da barra (a da 1.8.1) e, desde a 1.8.2, a da camada da folha
  // `overlay` e a dos destinos das abas. A da barra tem os três seletores
  // debaixo dela, e só declara a animação.
  expect(usamATrava().map(lugar)).toEqual([
    TRAVA_DE_TOQUE.barra,
    TRAVA_DE_TOQUE.folha,
    TRAVA_DE_TOQUE.abas,
  ]);
  expect(usamATrava()[0]?.seletores).toEqual([
    `${BARRA_DE_ACAO.barra} button`,
    `${BARRA_DE_ACAO.barra} a`,
    `${BARRA_DE_ACAO.barra} [role="button"]`,
  ]);
  expect(regraEm(BARRA_DE_ACAO.arma).map(([p]) => p)).toEqual(["animation"]);

  // Na cascata: o botão, o link e o `role="button"` da barra recebem a trava; o
  // botão do conteúdo e o botão fora da tela, não. Os destinos das abas a
  // recebem desde a 1.8.2, pela regra deles (o teste das abas, embaixo).
  expect(cascataDosControles("animation")).toEqual([
    ["Calcular", ""],
    ["Guardar esta meta", ATALHO],
    ["Ver a conta", ATALHO],
    ["Desfazer", ATALHO],
    ["Diário", ATALHO],
    ["Gasto", ATALHO],
    ["Fora da tela", ""],
  ]);
});

it("a janela da trava tem 400ms e só desliga o ponteiro, nas três regras que a usam", () => {
  // De `none` a `auto`, e nada mais: nem opacidade, nem cor, nem posição — o
  // controle aparece inteiro e no lugar, só não aceita o dedo.
  expect(dentroDe(`@keyframes ${TRAVA}`).map((r) => [lugar(r), r.declaracoes])).toEqual([
    ["@ from", [["pointer-events", "none"]]],
    ["@ to", [["pointer-events", "auto"]]],
  ]);
  // A da folha anima a propriedade que o véu e o painel leem no ponteiro, de
  // `none` a `auto`. O `to` é obrigatório: só com o `from`, o WebKit não anima
  // uma propriedade personalizada (medido no adendo 1.8.2).
  expect(
    dentroDe(`@keyframes ${TRAVA_DA_FOLHA}`).map((r) => [lugar(r), r.declaracoes]),
  ).toEqual([
    ["@ from", [[TRAVA_DE_TOQUE.propriedade, "none"]]],
    ["@ to", [[TRAVA_DE_TOQUE.propriedade, "auto"]]],
  ]);

  // Cada regra só declara o atalho, e ele tem três partes, e só três: o nome,
  // a duração e `step-end`, que segura o `from` até o fim da janela (com a
  // curva padrão, um valor discreto vira na metade, aos 200ms). Sem atraso,
  // sem repetição e sem `fill-mode`: no fim, o ponteiro volta a ser o da
  // cascata.
  const atalhos = usamATrava().map((r) => [
    lugar(r),
    r.declaracoes.map(([p, v]) => [p, partes(v)]),
  ]);
  expect(atalhos).toEqual([
    [TRAVA_DE_TOQUE.barra, [["animation", [TRAVA, "400ms", "step-end"]]]],
    [TRAVA_DE_TOQUE.folha, [["animation", [TRAVA_DA_FOLHA, "400ms", "step-end"]]]],
    [TRAVA_DE_TOQUE.abas, [["animation", [TRAVA, "400ms", "step-end"]]]],
  ]);
});

// ---------------------------- a folha se arma, e as barras ao fechar (1.8.2) --

/**
 * O que a cascata mostra numa folha aberta, na ordem do documento: a camada
 * (só na `overlay`), o véu (idem), o painel, o botão de fechar e, no corpo, um
 * botão, um rótulo com o campo dele, um `select`, um `textarea`, o `summary`
 * de um `Disclosure`, um link, um `role="button"` e dois `Chip`; no rodapé, o
 * botão que confirma.
 */
const NA_FOLHA = [
  "camada",
  "véu",
  "painel",
  "Fechar",
  "Aumentar",
  "Nome",
  "campo do nome",
  "Porção",
  "Nota",
  "Por quê",
  "Ver a tabela",
  "Desfazer",
  "Almoço",
  "Quebra de jejum",
  "Registrar",
];

/** O nome do elemento na lista acima: o papel dele na folha, ou o rótulo. */
function nomeNaFolha(elemento: Element): string {
  if (elemento.classList.contains("co-sheet-overlay")) return "camada";
  if (elemento.classList.contains("co-sheet-overlay__veil")) return "véu";
  if (elemento.classList.contains("co-sheet")) return "painel";
  if (elemento.tagName === "INPUT") return "campo do nome";
  return elemento.getAttribute("aria-label") ?? elemento.textContent?.trim() ?? "";
}

/** Uma folha aberta no conteúdo da tela — como a de "Nova refeição" no Basalto. */
function FolhaAberta({
  modo,
  depois,
}: Readonly<{ modo: "overlay" | "inline"; depois?: ReactNode }>) {
  return (
    <ThemeProvider>
      <Screen tabBar={abas} actionBar={hospedeiro(<Button>Nova refeição</Button>)}>
        <Sheet
          open
          onClose={() => undefined}
          title="Nova refeição"
          mode={modo}
          footer={<Button>Registrar</Button>}
        >
          <Button>Aumentar</Button>
          <Field label="Nome">{(controle) => <Input {...controle} />}</Field>
          <select aria-label="Porção">
            <option>1</option>
          </select>
          <textarea aria-label="Nota" />
          <Disclosure summary="Por quê">porque sim</Disclosure>
          <a href="#tabela">Ver a tabela</a>
          <span role="button" tabIndex={0}>
            Desfazer
          </span>
          <Stack direction="row" gap={8} wrap>
            <Chip label="Almoço" onClick={() => undefined} />
            <Chip label="Quebra de jejum" onClick={() => undefined} />
          </Stack>
          {depois}
        </Sheet>
      </Screen>
    </ThemeProvider>
  );
}

/** O valor de `propriedade` em cada elemento de `NA_FOLHA` que a árvore montada tem. */
function naFolha(raiz: Element, propriedade: string): [string, string][] {
  const folha = raiz.querySelector(".co-sheet-overlay") ?? raiz.querySelector(".co-sheet");
  expect(folha, "a folha").not.toBeNull();
  const elementos = [
    folha as Element,
    ...(folha as Element).querySelectorAll(
      '.co-sheet-overlay__veil, .co-sheet, button, a, input, select, textarea, label, summary, [role="button"]',
    ),
  ];
  return [...new Set(elementos)].map((elemento): [string, string] => [
    nomeNaFolha(elemento),
    normalizar(getComputedStyle(elemento).getPropertyValue(propriedade)),
  ]);
}

/** A cascata de uma folha aberta, em `overlay` ou `inline`. */
function cascataDaFolha(modo: "overlay" | "inline", propriedade: string): [string, string][] {
  const { container } = render(<FolhaAberta modo={modo} />);
  const valores = naFolha(container, propriedade);
  cleanup();
  return valores;
}

it("a folha overlay se arma pelo relógio da camada, com o véu e o painel, e a inline não arma nada", () => {
  // A camada é quem anima, e o que ela anima é a propriedade; o véu e o painel
  // a leem no ponteiro, com `auto` quando ela não está declarada — fora da
  // janela, ela não existe: só a animação a declara.
  expect(regraEm(TRAVA_DE_TOQUE.folha)).toEqual([["animation", ATALHO_DA_FOLHA]]);
  const leem = REGRAS.filter((r) =>
    r.declaracoes.some(([, v]) => v.includes(TRAVA_DE_TOQUE.propriedade)),
  );
  expect(leem.map((r) => [lugar(r), r.declaracoes])).toEqual([
    [TRAVA_DE_TOQUE.lida, [["pointer-events", `var(${TRAVA_DE_TOQUE.propriedade}, auto)`]]],
  ]);
  expect(leem[0]?.seletores).toEqual([".co-sheet-overlay__veil", ".co-sheet-overlay > .co-sheet"]);
  const declaram = REGRAS.filter((r) =>
    r.declaracoes.some(([p]) => p === TRAVA_DE_TOQUE.propriedade),
  ).map(lugar);
  expect(declaram, "quem declara a propriedade").toEqual(["@ from", "@ to"]);

  // O conteúdo do painel herda o ponteiro dele: nenhuma regra desta folha
  // declara `pointer-events` em outro lugar, a não ser o `none` de pintura
  // (a faixa, o fio do grupo, o grão, e a unidade, a lupa e o fim da busca, que
  // deixam o toque cair no campo embaixo deles) e as duas travas. Um `auto`
  // declarado num controle o soltaria da trava da folha.
  const ponteiro = REGRAS.filter((r) => r.declaracoes.some(([p]) => p === "pointer-events")).map(
    (r) => `${lugar(r)}: ${Object.fromEntries(r.declaracoes)["pointer-events"]}`,
  );
  expect(ponteiro).toEqual([
    ".co-screen__statusbar: none",
    "@ from: none",
    "@ to: auto",
    `${TRAVA_DE_TOQUE.lida}: var(${TRAVA_DE_TOQUE.propriedade}, auto)`,
    ".co-group > * + *::before: none",
    ".co-input__unit: none",
    ".co-search__icon: none",
    ".co-search__end: none",
    ".co-grain::after: none",
  ]);

  // Na cascata da `overlay`: a camada leva a animação, e só ela; o painel
  // continua só subindo, e nada dentro dele anima.
  expect(cascataDaFolha("overlay", "animation")).toEqual(
    NA_FOLHA.map((nome) => [
      nome,
      nome === "camada"
        ? ATALHO_DA_FOLHA
        : nome === "painel"
          ? expect.stringMatching(/^co-sheet-subir \d/)
          : "",
    ]),
  );

  // E o ponteiro: com a propriedade em `none` na camada — o que a animação faz
  // na janela —, o véu e o painel ficam sem ponteiro, e a camada não: é nela
  // que o toque cai. Sem a propriedade, os dois voltam a `auto`.
  const { container } = render(<FolhaAberta modo="overlay" />);
  const camada = container.querySelector(".co-sheet-overlay") as HTMLElement;
  const ponteiros = () =>
    naFolha(container, "pointer-events").filter(([nome]) =>
      ["camada", "véu", "painel"].includes(nome),
    );
  const fora = ponteiros();
  camada.style.setProperty(TRAVA_DE_TOQUE.propriedade, "none");
  const naJanela = ponteiros();
  cleanup();
  expect([fora, naJanela]).toEqual([
    [
      ["camada", ""],
      ["véu", "auto"],
      ["painel", "auto"],
    ],
    [
      ["camada", ""],
      ["véu", "none"],
      ["painel", "none"],
    ],
  ]);

  // A `inline` abre no fluxo, embaixo de quem a chamou: não tem camada nem
  // véu, nada nela anima, e o painel não lê a propriedade nem com ela em
  // `none` em volta.
  expect(cascataDaFolha("inline", "animation")).toEqual(
    NA_FOLHA.filter((nome) => !["camada", "véu"].includes(nome)).map((nome) => [
      nome,
      nome === "painel" ? "none" : "",
    ]),
  );
  const inline = render(
    <div style={{ [TRAVA_DE_TOQUE.propriedade]: "none" } as CSSProperties}>
      <FolhaAberta modo="inline" />
    </div>,
  );
  const painelInline = inline.container.querySelector(".co-sheet") as Element;
  expect(getComputedStyle(painelInline).getPropertyValue("pointer-events")).toBe("");
  cleanup();
});

it("o que entra na folha já aberta não ganha janela própria: só a camada anima", () => {
  // Um resultado de busca que chega enquanto a pessoa digita é um elemento
  // novo dentro do painel. Ele não tem animação nenhuma — nem ele, nem nada
  // ao lado dele —: o ponteiro dele é o que o painel lhe passa, e o painel
  // segue o relógio da camada. Entrou depois dos 400ms da folha, é tocável na
  // hora; entrou antes, fica travado só até os 400ms dela (medido no adendo).
  const { container, rerender } = render(<FolhaAberta modo="overlay" />);
  const antes = naFolha(container, "animation");
  rerender(
    <FolhaAberta
      modo="overlay"
      depois={
        <Group role="group" label="Resultados">
          <ListRow onClick={() => undefined}>Arroz branco</ListRow>
          <ListRow onClick={() => undefined}>Arroz integral</ListRow>
        </Group>
      }
    />,
  );
  const depois = naFolha(container, "animation");
  cleanup();

  const soACamada = (nomes: string[]) =>
    nomes.map((nome) => [
      nome,
      nome === "camada"
        ? ATALHO_DA_FOLHA
        : nome === "painel"
          ? expect.stringMatching(/^co-sheet-subir \d/)
          : "",
    ]);
  expect(antes).toEqual(soACamada(NA_FOLHA));
  expect(depois).toEqual(
    soACamada([...NA_FOLHA.slice(0, -1), "Arroz branco", "Arroz integral", "Registrar"]),
  );

  // E nenhuma regra que arma alcança algo dentro da camada: a da folha é a
  // camada, e as outras duas são da barra e das abas.
  const alcancamDentro = usamATrava()
    .flatMap((r) => r.seletores)
    .filter((seletor) => /\.co-sheet(-overlay)?[\s>+~]|\.co-sheet\b(?!-)/.test(seletor));
  expect(alcancamDentro).toEqual([]);
});

/** As abas e os controles da barra de ação, com uma folha aberta (ou fechada) no conteúdo. */
function TelaComFolha({ folha }: Readonly<{ folha: "fechada" | "overlay" | "inline" }>) {
  return (
    <ThemeProvider>
      <Screen
        tabBar={abas}
        actionBar={hospedeiro(
          <>
            <Button>Nova refeição</Button>
            <a href="#dia">Ver o dia</a>
            <span role="button" tabIndex={0}>
              Desfazer
            </span>
          </>,
        )}
      >
        <Button>Registrar alimento</Button>
        <Sheet
          open={folha !== "fechada"}
          onClose={() => undefined}
          title="Registrar alimento"
          mode={folha === "inline" ? "inline" : "overlay"}
          footer={<Button>Registrar</Button>}
        >
          conteúdo da folha
        </Sheet>
      </Screen>
    </ThemeProvider>
  );
}

const DAS_BARRAS = ["Nova refeição", "Ver o dia", "Desfazer", "Diário", "Gasto"];

it("as abas e a barra de ação se rearmam quando a folha overlay fecha, e só por ela", () => {
  // Os destinos das abas se armam ao entrar, com a mesma animação da barra.
  expect(regraEm(TRAVA_DE_TOQUE.abas)).toEqual([["animation", ATALHO]]);

  // A regra que rearma tira a animação de cada seletor que arma as abas e a
  // barra — e só deles: nada da folha, nada do conteúdo —, com a condição de
  // haver uma folha `overlay` no documento. É o seletor que arma, inteiro, com
  // a condição na frente: pesa mais que ele, e vence onde quer que ele esteja.
  const rearma = REGRAS.filter((r) => lugar(r) === TRAVA_DE_TOQUE.rearma);
  expect(rearma.map((r) => r.declaracoes)).toEqual([[["animation", "none"]]]);
  expect(rearma[0]?.seletores).toEqual(
    [TRAVA_DE_TOQUE.abas, ...BARRA_DE_ACAO.arma.split(", ")].map(
      (seletor) => `:root:has(.co-sheet-overlay) ${seletor}`,
    ),
  );
  const tiramAAnimacao = REGRAS.filter((r) =>
    r.declaracoes.some(([p, v]) => /^animation(-name)?$/.test(p) && /^none\b/.test(v)),
  ).map(lugar);
  expect(tiramAAnimacao, "regras que tiram a animação").toEqual([
    TRAVA_DE_TOQUE.rearma,
    '.co-sheet[data-mode="inline"]',
  ]);

  // Na cascata, a mesma tela numa sequência: sem folha, as barras armam (é a
  // montagem); com a `overlay` aberta, ficam sem animação; fechada, a animação
  // volta — e o navegador a recomeça, porque o nome passou de `none` à trava.
  // A `inline` aberta não mexe nelas.
  const { container, rerender } = render(<TelaComFolha folha="fechada" />);
  const dasBarras = () =>
    [
      ...container.querySelectorAll(
        '.co-screen__actionbar :is(button, a, [role="button"]), .co-tabbar__item',
      ),
    ].map((controle): [string, string] => [
      controle.textContent ?? "",
      normalizar(getComputedStyle(controle).getPropertyValue("animation")),
    ]);
  const sequencia = (["fechada", "overlay", "fechada", "inline", "fechada"] as const).map((folha) => {
    rerender(<TelaComFolha folha={folha} />);
    return [folha, dasBarras()];
  });
  cleanup();
  const todas = (valor: string) => DAS_BARRAS.map((nome) => [nome, valor]);
  expect(sequencia).toEqual([
    ["fechada", todas(ATALHO)],
    ["overlay", todas("none")],
    ["fechada", todas(ATALHO)],
    ["inline", todas(ATALHO)],
    ["fechada", todas(ATALHO)],
  ]);

  // E a folha num portal no `body`, fora da tela: a condição é do documento, e
  // não da tela, então ela vale igual.
  function Portal({ aberta }: Readonly<{ aberta: boolean }>) {
    return (
      <Screen tabBar={abas} actionBar={hospedeiro(<Button>Nova refeição</Button>)}>
        conteúdo
        {createPortal(
          <Sheet open={aberta} onClose={() => undefined} title="Fora da tela">
            a
          </Sheet>,
          document.body,
        )}
      </Screen>
    );
  }
  const fora = render(<Portal aberta />);
  expect(fora.container.querySelector(".co-sheet-overlay"), "dentro da tela").toBeNull();
  expect(document.body.querySelector(":scope > .co-sheet-overlay"), "no body").not.toBeNull();
  const comFolhaFora = [...fora.container.querySelectorAll(".co-screen button")].map((b) =>
    normalizar(getComputedStyle(b).getPropertyValue("animation")),
  );
  fora.rerender(<Portal aberta={false} />);
  const semFolhaFora = [...fora.container.querySelectorAll(".co-screen button")].map((b) =>
    normalizar(getComputedStyle(b).getPropertyValue("animation")),
  );
  cleanup();
  expect([comFolhaFora, semFolhaFora]).toEqual([
    ["none", "none", "none"],
    [ATALHO, ATALHO, ATALHO],
  ]);
});

it("o movimento reduzido não zera a trava da barra, das abas nem da folha", () => {
  // O zero de sempre, para tudo dentro do tema, e depois dele a exceção: os
  // mesmos seletores das três regras que armam, só com a duração, a MESMA da
  // trava.
  const duracao = partes(Object.fromEntries(regraEm(BARRA_DE_ACAO.arma))["animation"] ?? "")[1];
  const zero = [".co-root *", ".co-root *::before", ".co-root *::after"];
  expect(dentroDe(MENOS_MOVIMENTO).map((r) => [r.seletores.join(", "), r.declaracoes])).toEqual([
    [
      zero.join(", "),
      [
        ["transition-duration", "0.01ms !important"],
        ["animation-duration", "0.01ms !important"],
      ],
    ],
    [TRAVA_DE_TOQUE.excecao, [["animation-duration", `${duracao} !important`]]],
  ]);
  // A exceção é a união das três regras, seletor por seletor.
  expect(TRAVA_DE_TOQUE.excecao.split(", ").sort()).toEqual(
    usamATrava()
      .flatMap((r) => r.seletores)
      .sort(),
  );

  // As duas são `!important`, e vence a mais específica: cada seletor da
  // exceção pesa mais que o do zero que alcança o elemento (`.co-root *`; os
  // outros dois são pseudo-elementos).
  const doZero = especificidade(".co-root *");
  expect(doZero).toEqual([0, 1, 0]);
  const perdem = TRAVA_DE_TOQUE.excecao
    .split(", ")
    .filter((seletor) => !maisEspecifico(especificidade(seletor), doZero));
  expect(perdem, "seletores da exceção que não vencem o zero").toEqual([]);

  // Na cascata, com o aparelho pedindo menos movimento: o resto da página fica
  // sem duração (o zero vale, então o `@media` foi lido), e os controles da
  // barra, os destinos das abas e a camada da folha `overlay` ficam com a
  // janela inteira. O painel, que sobe, o que está dentro dele (que não anima)
  // e a folha `inline` ficam no zero.
  const [barra, folha, inline] = comMenosMovimento(() => [
    cascataDosControles("animation-duration"),
    cascataDaFolha("overlay", "animation-duration"),
    cascataDaFolha("inline", "animation-duration"),
  ]);
  expect(barra).toEqual([
    ["Calcular", "0.01ms"],
    ["Guardar esta meta", "400ms"],
    ["Ver a conta", "400ms"],
    ["Desfazer", "400ms"],
    ["Diário", "400ms"],
    ["Gasto", "400ms"],
    ["Fora da tela", "0.01ms"],
  ]);
  expect(folha).toEqual(NA_FOLHA.map((nome) => [nome, nome === "camada" ? "400ms" : "0.01ms"]));
  expect(inline).toEqual(
    NA_FOLHA.filter((nome) => !["camada", "véu"].includes(nome)).map((nome) => [nome, "0.01ms"]),
  );
});
