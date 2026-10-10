import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  REGRAS,
  avaliar,
  bloco,
  classe,
  lugar,
  paddingQueVale,
  partes,
  soEstesMexemNoPadding,
  ultimoComposto,
  type Regra,
  type Valores,
} from "../test/folha";
import tokensCss from "../tokens/tokens.css?raw";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { Divider } from "./Divider";
import { Grid } from "./Grid";
import { Icon, iconNames } from "./Icon";
import { IconButton } from "./IconButton";
import { Input } from "./Input";
import { SearchField } from "./SearchField";
import { Series } from "./Series";
import { Slat } from "./Slat";
import { Stack } from "./Stack";
import { Surface } from "./Surface";
import { Text } from "./Text";
import { VisuallyHidden } from "./VisuallyHidden";

describe("Text", () => {
  it("leva variante e tom para o DOM, que é onde o CSS lê", () => {
    render(
      <Text as="h1" variant="title-lg" tone="accent">
        Basalto
      </Text>,
    );
    const no = screen.getByRole("heading", { name: "Basalto" });
    expect(no).toHaveAttribute("data-variant", "title-lg");
    expect(no).toHaveAttribute("data-tone", "accent");
  });

  it("só marca numérico quando pedem", () => {
    const { rerender } = render(<Text>1.917</Text>);
    expect(screen.getByText("1.917")).not.toHaveAttribute("data-numeric");
    rerender(<Text numeric>1.917</Text>);
    expect(screen.getByText("1.917")).toHaveAttribute("data-numeric", "true");
  });
});

describe("Button", () => {
  it("nasce type=button", () => {
    // O padrão do HTML é `submit`: um botão de "trocar refeição" dentro de um
    // formulário enviaria o formulário inteiro.
    render(<Button>Registrar</Button>);
    expect(screen.getByRole("button", { name: "Registrar" })).toHaveAttribute("type", "button");
  });

  it("carrega variante e tamanho", () => {
    render(
      <Button variant="danger" size="lg" full icon="plus">
        Apagar
      </Button>,
    );
    const botao = screen.getByRole("button", { name: "Apagar" });
    expect(botao).toHaveAttribute("data-variant", "danger");
    expect(botao).toHaveAttribute("data-size", "lg");
    expect(botao).toHaveAttribute("data-full", "true");
  });

  it("o ícone do botão não fala com o leitor de tela", () => {
    render(<Button icon="plus" iconEnd="chevron-down">Registrar</Button>);
    // O rótulo já diz "Registrar"; um ícone anunciado repetiria a mesma coisa.
    expect(screen.getByRole("button", { name: "Registrar" })).toBeInTheDocument();
  });
});

describe("Icon", () => {
  it("é decorativo por padrão e anunciado quando tem título", () => {
    const { rerender, container } = render(<Icon name="search" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    rerender(<Icon name="search" title="Buscar alimento" />);
    expect(screen.getByRole("img", { name: "Buscar alimento" })).toBeInTheDocument();
  });

  it("todo nome exportado tem desenho", () => {
    for (const nome of iconNames) {
      const { container, unmount } = render(<Icon name={nome} />);
      expect(container.querySelector("path")).toHaveAttribute("d");
      unmount();
    }
  });
});

describe("Slat", () => {
  it("grampeia o valor em vez de recusar", () => {
    const { container, rerender } = render(<Slat value={1.8} label="Proteína" />);
    expect(container.querySelector(".co-slat")).toHaveStyle({ "--co-slat-value": "100%" });

    rerender(<Slat value={-3} label="Proteína" />);
    expect(container.querySelector(".co-slat")).toHaveStyle({ "--co-slat-value": "0%" });
  });

  it("valor não numérico vira zero, e não NaN na tela", () => {
    const { container } = render(<Slat value={Number.NaN} />);
    expect(container.querySelector(".co-slat")).toHaveStyle({ "--co-slat-value": "0%" });
  });

  it("sem rótulo sai decorativa; com rótulo vira progressbar", () => {
    const { container, rerender } = render(<Slat value={0.5} />);
    expect(container.querySelector(".co-slat")).toHaveAttribute("aria-hidden", "true");

    rerender(<Slat value={0.5} label="Confiança" />);
    const barra = screen.getByRole("progressbar", { name: "Confiança" });
    expect(barra).toHaveAttribute("aria-valuenow", "50");
  });

  it("marcador desenha ponto em vez de preenchimento", () => {
    const { container } = render(<Slat value={0.62} marker />);
    expect(container.querySelector(".co-slat__marker")).toBeInTheDocument();
    expect(container.querySelector(".co-slat__fill")).toBeNull();
  });
});

describe("primitivas de layout", () => {
  it("Stack espaça por gap, e o gap é um token", () => {
    const { container } = render(
      <Stack direction="row" gap={16} align="center" justify="space-between" wrap grow>
        <span>a</span>
      </Stack>,
    );
    expect(container.firstElementChild?.getAttribute("style")).toContain("gap: var(--co-space-16)");
    expect(container.firstElementChild).toHaveStyle({ display: "flex" });
  });

  it("o ref do Stack chega ao elemento, de objeto e de função, e solta ao desmontar", () => {
    // É o hospedeiro de um portal guardado em `useState` pela `ref`, sem efeito
    // (ADR-013): no React 19 o `ref` chega pelo resto das props, e o tipo o
    // deixa passar sem `forwardRef`.
    const objeto = createRef<HTMLElement>();
    const recebidos: (HTMLElement | null)[] = [];
    const { container, unmount } = render(
      <>
        <Stack as="section" ref={objeto}>
          a
        </Stack>
        <Stack direction="row" ref={(no) => void recebidos.push(no)}>
          b
        </Stack>
      </>,
    );
    expect(objeto.current).toBe(container.querySelector("section"));
    expect(recebidos).toEqual([container.children[1]]);

    unmount();
    expect(objeto.current).toBeNull();
    expect(recebidos.at(-1)).toBeNull();
  });

  it("Stack scroll põe a fileira numa linha só, que rola de lado, e os filhos não encolhem", () => {
    const { container, rerender } = render(
      <Stack direction="row" gap={8} scroll wrap>
        <span>1 colher de sopa</span>
        <span>1 xícara</span>
      </Stack>,
    );
    const fileira = container.firstElementChild as HTMLElement;
    // No `style` (CSSOM), como o resto do `Stack`; e o `scroll` vence o `wrap`.
    expect(fileira).toHaveAttribute("data-scroll", "true");
    expect(fileira.style.flexWrap).toBe("nowrap");
    expect(fileira.style.overflowX).toBe("auto");
    expect(fileira.style.flexDirection).toBe("row");

    // O que o `style` não alcança mora na folha: os filhos não encolhem, e o
    // respiro do anel de foco volta como margem — os filhos ficam no lugar.
    expect(bloco('.co-stack[data-scroll="true"] > *')).toEqual([["flex-shrink", "0"]]);
    // (A folha não está carregada aqui: o token entra na conta pelo nome.)
    const caixa = bloco('.co-stack[data-scroll="true"]');
    const token = { "--co-space-4": "4px" };
    const respiro = paddingQueVale(caixa, token);
    expect(respiro).toEqual({ topo: 4, direita: 4, baixo: 4, esquerda: 4 });
    expect(avaliar(Object.fromEntries(caixa)["margin"] ?? "", token)).toBe(-respiro.topo);

    // Sem `scroll`, nada disso: o `wrap` volta a valer e nada rola.
    rerender(
      <Stack direction="row" gap={8} wrap>
        <span>1 colher de sopa</span>
      </Stack>,
    );
    expect(fileira).not.toHaveAttribute("data-scroll");
    expect(fileira.style.flexWrap).toBe("wrap");
    expect(fileira.style.overflowX).toBe("");
  });

  it("Grid usa minmax(0, 1fr) para não estourar com texto comprido", () => {
    const { container } = render(<Grid columns={3} />);
    expect(container.firstElementChild).toHaveStyle({
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    });
  });

  it("Grid aceita trilhas explícitas", () => {
    const { container } = render(<Grid template="236px 1fr" />);
    expect(container.firstElementChild).toHaveStyle({ gridTemplateColumns: "236px 1fr" });
  });

  it("Surface leva elevação, borda e grão", () => {
    const { container } = render(<Surface elevation="raised" bordered grain padding={20} />);
    const no = container.firstElementChild;
    expect(no).toHaveAttribute("data-elevation", "raised");
    expect(no).toHaveAttribute("data-bordered", "true");
    expect(no).toHaveClass("co-grain");
    expect(no?.getAttribute("style")).toContain("padding: var(--co-space-20)");
  });

  it("Divider é um hr", () => {
    const { container } = render(<Divider />);
    expect(container.querySelector("hr")).toHaveClass("co-divider");
  });
});

describe("Badge e VisuallyHidden", () => {
  it("Badge leva tom e preenchimento", () => {
    render(<Badge tone="status" solid>TACO</Badge>);
    const selo = screen.getByText("TACO");
    expect(selo).toHaveAttribute("data-tone", "status");
    expect(selo).toHaveAttribute("data-solid", "true");
  });

  it("VisuallyHidden continua na árvore de acessibilidade", () => {
    render(<VisuallyHidden>quarta-feira</VisuallyHidden>);
    // Se usasse display:none o texto sumiria daqui também, que é o oposto do
    // que o componente existe para fazer.
    expect(screen.getByText("quarta-feira")).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("a unidade é lida junto com o campo", () => {
    // Sem isto, quem usa leitor de tela ouve "peso" e digita 83 sem saber se o
    // campo quer quilo ou libra: o `kg` impresso na tela não existe para essa
    // pessoa.
    render(<Input aria-label="Peso" unit="kg" />);
    const campo = screen.getByRole("textbox", { name: "Peso" });
    const descreve = campo.getAttribute("aria-describedby");
    expect(descreve).toBeTruthy();
    expect(document.getElementById(descreve ?? "")).toHaveTextContent("kg");
  });

  it("um aria-describedby vindo de fora é somado, nunca sobrescrito", () => {
    // É por aqui que a mensagem de erro do `Field` chega ao campo. Sobrescrever
    // faria o erro sumir sem aviso nenhum na tela.
    render(<Input aria-label="Peso" unit="kg" aria-describedby="erro-do-campo" />);
    const descreve =
      screen.getByRole("textbox", { name: "Peso" }).getAttribute("aria-describedby") ?? "";
    expect(descreve.split(" ")).toHaveLength(2);
    expect(descreve.startsWith("erro-do-campo")).toBe(true);
  });

  it("sem unidade não inventa descrição", () => {
    render(<Input aria-label="Nome da refeição" />);
    expect(screen.getByRole("textbox", { name: "Nome da refeição" })).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("recusado não é só a moldura vermelha", () => {
    render(<Input aria-label="Peso" invalid />);
    expect(screen.getByRole("textbox", { name: "Peso" })).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Chip", () => {
  it("escolhível é um botão que diz se está ligado", async () => {
    const usuario = userEvent.setup();
    const aoClicar = vi.fn();
    render(<Chip label="Sem lactose" selected onClick={aoClicar} />);
    const chip = screen.getByRole("button", { name: "Sem lactose", pressed: true });
    await usuario.click(chip);
    expect(aoClicar).toHaveBeenCalledTimes(1);
  });

  it("removível tem um botão com nome próprio", async () => {
    // "Remover Sem lactose", e não "fechar": numa lista de seis chips, seis
    // botões chamados "fechar" são seis botões indistinguíveis no leitor de tela.
    const usuario = userEvent.setup();
    const aoRemover = vi.fn();
    render(<Chip label="Sem lactose" onRemove={aoRemover} />);
    await usuario.click(screen.getByRole("button", { name: "Remover Sem lactose" }));
    expect(aoRemover).toHaveBeenCalledTimes(1);
  });

  it("sem ação nenhuma não vira botão", () => {
    render(<Chip label="Lido do código" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Lido do código")).toBeInTheDocument();
  });
});

describe("Series", () => {
  const PESO = [84.6, 84.1, 83.8, 83.4, 83.1].map((y, x) => ({ x, y }));

  it("com rótulo é imagem; sem rótulo some do leitor de tela", () => {
    const { rerender } = render(<Series points={PESO} label="Peso do mês" />);
    expect(screen.getByRole("img", { name: "Peso do mês" })).toBeInTheDocument();

    rerender(<Series points={PESO} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("sem ponto nenhum não desenha caixa vazia", () => {
    const { container } = render(<Series points={[]} />);
    expect(container.firstElementChild).toBeNull();
  });

  it("série chapada não divide por zero", () => {
    // Cinco pesagens iguais: a reta fica no meio da caixa, e nenhuma coordenada
    // sai como NaN — que é o jeito silencioso de um gráfico sumir.
    const chapada = [83, 83, 83, 83, 83].map((y, x) => ({ x, y }));
    const { container } = render(<Series points={chapada} label="Chapada" />);
    const traco = container.querySelector(".co-series__line");
    expect(traco?.getAttribute("d")).not.toContain("NaN");
    expect(container.querySelector(".co-series__mark")?.getAttribute("cy")).not.toBe("NaN");
  });

  it("a faixa cabe dentro do desenho", () => {
    // A escala sai de TODOS os dados — série e faixa. Sem isso a faixa fica
    // meio de fora, e a única pista é um retângulo cortado na borda.
    const { container } = render(
      <Series points={PESO} band={{ from: 82, to: 86 }} label="Com faixa" height={150} />,
    );
    const faixa = container.querySelector(".co-series__band");
    const y = Number(faixa?.getAttribute("y"));
    const altura = Number(faixa?.getAttribute("height"));
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y + altura).toBeLessThanOrEqual(150);
  });

  it("a tendência é outra linha, tracejada por CSS", () => {
    const tendencia = PESO.map((p) => ({ x: p.x, y: p.y - 0.2 }));
    const { container } = render(<Series points={PESO} trend={tendencia} label="Peso" />);
    expect(container.querySelector(".co-series__trend")).toBeInTheDocument();
  });
});

describe("IconButton", () => {
  it("o nome vira o nome do botão e a dica do mouse", () => {
    // O motivo de a peça existir: um botão que é só desenho, sem nome, sai
    // anunciado como "botão" e nada mais.
    render(<IconButton icon="barcode" label="Ler código de barras" />);
    const botao = screen.getByRole("button", { name: "Ler código de barras" });
    expect(botao).toHaveAttribute("title", "Ler código de barras");
    expect(botao).toHaveAttribute("type", "button");
    expect(botao.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("liga e desliga com aria-pressed", async () => {
    const usuario = userEvent.setup();
    const aoTrocar = vi.fn();
    const { rerender } = render(
      <IconButton icon="bookmark" label="Salvar nos favoritos" pressed={false} onClick={aoTrocar} />,
    );
    const botao = screen.getByRole("button", { name: "Salvar nos favoritos" });
    expect(botao).toHaveAttribute("aria-pressed", "false");
    await usuario.click(botao);
    expect(aoTrocar).toHaveBeenCalledOnce();

    rerender(<IconButton icon="bookmark" label="Salvar nos favoritos" pressed onClick={aoTrocar} />);
    expect(botao).toHaveAttribute("aria-pressed", "true");
  });

  it("sem pressed não finge ser interruptor", () => {
    render(<IconButton icon="plus" label="Nova receita" />);
    expect(screen.getByRole("button", { name: "Nova receita" })).not.toHaveAttribute("aria-pressed");
  });

  it("carrega tamanho, variante e tom só quando fogem do padrão", () => {
    const { rerender } = render(<IconButton icon="plus" label="Nova receita" />);
    const botao = screen.getByRole("button", { name: "Nova receita" });
    expect(botao).not.toHaveAttribute("data-size");
    expect(botao).not.toHaveAttribute("data-variant");
    expect(botao).not.toHaveAttribute("data-tone");

    rerender(<IconButton icon="plus" label="Nova receita" size="lg" variant="ghost" tone="accent" />);
    expect(botao).toHaveAttribute("data-size", "lg");
    expect(botao).toHaveAttribute("data-variant", "ghost");
    expect(botao).toHaveAttribute("data-tone", "accent");
  });
});

// ---------------------------------------- desligado com cara de desligado --

const ARIA_DESLIGADO = '[aria-disabled="true"]';
const opacidadeDe = (regra: Regra) => regra.declaracoes.find(([p]) => p === "opacity")?.[1];

/** Cada `X:disabled` que apaga o controle, como `[X, opacidade]`. */
const desligadosQueApagam = (regras: readonly Regra[]) =>
  regras
    .filter((r) => r.profundidade === 0)
    .flatMap((r) => {
      const opacidade = opacidadeDe(r);
      return opacidade === undefined
        ? []
        : r.seletores
            .filter((s) => s.endsWith(":disabled"))
            .map((s) => [s.slice(0, -":disabled".length), opacidade] as const);
    });

/**
 * O que faria um controle com `aria-disabled` parecer ligado: o `X:disabled`
 * que apaga sem o `X[aria-disabled="true"]` com a mesma opacidade, e a regra
 * de hover que poupa o `:disabled` e não poupa o `aria-disabled` — ele não é
 * `:disabled`, e clarearia no mouse.
 */
function faltasDoDesligado(regras: readonly Regra[]): string[] {
  const semPar = desligadosQueApagam(regras)
    .filter(
      ([base, opacidade]) =>
        !regras.some(
          (r) =>
            r.profundidade === 0 &&
            r.seletores.includes(`${base}${ARIA_DESLIGADO}`) &&
            opacidadeDe(r) === opacidade,
        ),
    )
    .map(([base, opacidade]) => `${base}${ARIA_DESLIGADO} sem opacity: ${opacidade}`);
  const hoverQueAcende = regras.flatMap((r) =>
    r.seletores
      .filter((s) => s.includes(":hover") && s.includes(":not(:disabled)"))
      .filter((s) => !s.includes(`:not(${ARIA_DESLIGADO})`))
      .map((s) => `${s} acende no aria-disabled`),
  );
  return [...semPar, ...hoverQueAcende];
}

describe("desligado com cara de desligado", () => {
  it("aria-disabled mantem o foco e nao ganha hover", async () => {
    // `aria-disabled` é o desligado que deixa o motivo ao alcance do teclado:
    // o controle fica no Tab. O `disabled` sai dele.
    const usuario = userEvent.setup();
    render(
      <>
        <Button aria-disabled="true">Guardar meta</Button>
        <Button disabled>Registrar</Button>
        <IconButton icon="plus" label="Nova receita" aria-disabled="true" />
      </>,
    );
    await usuario.tab();
    expect(screen.getByRole("button", { name: "Guardar meta" })).toHaveFocus();
    await usuario.tab();
    expect(screen.getByRole("button", { name: "Nova receita" })).toHaveFocus();

    // Pela folha: os três que apagam no `:disabled` apagam igual no
    // `aria-disabled`, e nenhuma regra de hover acende um deles. A lista dos
    // três é o que impede a prova de passar sem ter medido nada.
    expect(desligadosQueApagam(REGRAS)).toEqual([
      [".co-button", "0.45"],
      [".co-icon-button", "0.45"],
      [".co-stepper__button", "0.45"],
    ]);
    const hovers = REGRAS.flatMap((r) => r.seletores).filter((s) => s.includes(":not(:disabled)"));
    expect(hovers.length).toBeGreaterThan(0);
    expect(faltasDoDesligado(REGRAS), "o que deixa o aria-disabled com cara de ligado").toEqual([]);
  });

  it("a isca: o icon-button sem o par e um hover sem a exclusão reprovam", () => {
    const hover = '.co-icon-button:hover:not(:disabled):not([aria-disabled="true"])';
    const isca = REGRAS.map((r) => ({
      ...r,
      seletores: r.seletores
        .filter((s) => s !== `.co-icon-button${ARIA_DESLIGADO}`)
        .map((s) => (s === hover ? ".co-icon-button:hover:not(:disabled)" : s)),
    }));
    expect(faltasDoDesligado(isca)).toEqual([
      `.co-icon-button${ARIA_DESLIGADO} sem opacity: 0.45`,
      ".co-icon-button:hover:not(:disabled) acende no aria-disabled",
    ]);
  });
});

describe("a ListRow herda a letra", () => {
  it("o tamanho vem de quem a contém, e não dos 13,33px do botão do navegador", () => {
    const letra = bloco(".co-list-row").filter(([p]) => p.startsWith("font"));
    expect(letra).toEqual([
      ["font-family", "inherit"],
      ["font-size", "inherit"],
    ]);
  });
});

describe("SearchField", () => {
  it("é um campo de busca com nome, dentro de um marco de busca", () => {
    render(<SearchField label="Buscar alimento" placeholder="Buscar alimento" />);
    const campo = screen.getByRole("searchbox", { name: "Buscar alimento" });
    expect(campo).toHaveAttribute("type", "search");
    expect(screen.getByRole("search")).toContainElement(campo);
  });

  it("a contagem de resultados é anunciada quando muda", () => {
    const { rerender } = render(<SearchField label="Buscar alimento" count="6 resultados" />);
    const contagem = screen.getByText("6 resultados");
    expect(contagem).toHaveAttribute("aria-live", "polite");
    rerender(<SearchField label="Buscar alimento" count="2 resultados" />);
    expect(contagem).toHaveTextContent("2 resultados");
  });

  it("a tecla de atalho traz o foco de qualquer ponto da página", async () => {
    const usuario = userEvent.setup();
    render(
      <>
        <button type="button">Registrar</button>
        <SearchField label="Buscar alimento" shortcut="/" />
      </>,
    );
    const campo = screen.getByRole("searchbox", { name: "Buscar alimento" });
    expect(campo).toHaveAttribute("aria-keyshortcuts", "/");

    screen.getByRole("button", { name: "Registrar" }).focus();
    await usuario.keyboard("/");
    expect(document.activeElement).toBe(campo);
    // A barra não vai parar dentro do campo: ela foi o atalho, não uma letra.
    expect(campo).toHaveValue("");
  });

  it("não rouba a tecla de quem está escrevendo em outro campo", async () => {
    // "1/2 xícara" numa observação tem de virar barra, e não um salto para a
    // busca no meio da palavra.
    const usuario = userEvent.setup();
    render(
      <>
        <input aria-label="Observação" />
        <SearchField label="Buscar alimento" shortcut="/" />
      </>,
    );
    const nota = screen.getByRole("textbox", { name: "Observação" });
    await usuario.click(nota);
    await usuario.keyboard("1/2");
    expect(document.activeElement).toBe(nota);
    expect(nota).toHaveValue("1/2");
  });

  it("não disputa atalho com o navegador", async () => {
    const usuario = userEvent.setup();
    render(
      <>
        <button type="button">Registrar</button>
        <SearchField label="Buscar alimento" shortcut="/" />
      </>,
    );
    const botao = screen.getByRole("button", { name: "Registrar" });
    botao.focus();
    await usuario.keyboard("{Control>}/{/Control}");
    expect(document.activeElement).toBe(botao);
  });

  it("solta a tecla quando sai da tela", async () => {
    const usuario = userEvent.setup();
    const { unmount } = render(<SearchField label="Buscar alimento" shortcut="/" />);
    unmount();
    render(<button type="button">Registrar</button>);
    const botao = screen.getByRole("button", { name: "Registrar" });
    botao.focus();
    await usuario.keyboard("/");
    expect(document.activeElement).toBe(botao);
  });

  it("sem atalho não desenha tecla nem ouve o teclado", () => {
    const { container } = render(<SearchField label="Buscar receita" size="lg" full />);
    expect(container.querySelector("kbd")).toBeNull();
    expect(container.querySelector(".co-search")).toHaveAttribute("data-size", "lg");
    expect(container.querySelector(".co-search")).toHaveAttribute("data-full", "true");
  });
});

/**
 * Os tokens pelo nome, lidos do CSS gerado, para a conta da folha — a folha não
 * está carregada neste arquivo. Vale a primeira declaração de cada nome, a do
 * `:root`: espaço, borda e alvo são iguais nos dois temas.
 */
const TOKENS: Valores = Object.fromEntries(
  [...tokensCss.matchAll(/(--co-[\w-]+)\s*:\s*([^;]+);/g)]
    .reverse()
    .map((achado) => [achado[1] ?? "", (achado[2] ?? "").trim()]),
);

/**
 * A regra pode pintar a moldura da busca: o último composto tem a classe dela,
 * ou não tem classe da coluna e casa um `div` (`*`, `div`, `[role="search"]`).
 */
function alcancaMoldura(seletor: string): boolean {
  const ultimo = ultimoComposto(seletor);
  if (classe("co-search").test(ultimo)) return true;
  if (/\.co-[\w-]/.test(ultimo)) return false;
  const tipo = /^[a-z][\w-]*/i.exec(ultimo)?.[0];
  return tipo === undefined || tipo === "div";
}

const BORDA = /^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-(width|style|color))?$/;
const APAGA = /^(0|0px|none|hidden|transparent)$/;

/** Quanto o anel de `seletor` passa da caixa do controle: largura + afastamento (0 se é interno). */
function extensaoDoAnel(seletor: string): number {
  const declaracoes = Object.fromEntries(bloco(seletor));
  const larguras = partes(declaracoes["outline"] ?? "").flatMap((parte) => {
    try {
      return [avaliar(parte, TOKENS)];
    } catch {
      return [];
    }
  });
  expect(larguras, `largura do anel em ${seletor}`).toHaveLength(1);
  const afastamento = avaliar(declaracoes["outline-offset"] ?? "", TOKENS);
  return Math.max(0, (larguras[0] ?? 0) + afastamento);
}

describe("SearchField dentro da folha", () => {
  it("a moldura do campo de busca continua visivel dentro da folha", () => {
    // Dentro de uma folha da mesma superfície, o degrau de fundo não separa
    // nada (1,14:1): o que diz "aqui se escreve" é o contorno, e ele tem de
    // existir PARADO — não só com o foco dentro, que é quando a pessoa já
    // achou o campo.
    const contorno = bloco(".co-search").filter(([p]) => BORDA.test(p));
    expect(contorno).toEqual([["border", "var(--co-border-width) solid var(--co-control-border)"]]);
    expect(avaliar("var(--co-border-width)", TOKENS)).toBeGreaterThan(0);
    expect(TOKENS["--co-control-border"], "o token de limite existe no CSS gerado").toMatch(/\S/);

    // Nenhuma regra que alcança a moldura — a da folha inclusive
    // (`.co-sheet .co-search`, `.co-sheet__body > *`) — a zera, apaga ou deixa
    // transparente.
    const apagam = REGRAS.filter((r) => r.seletores.some(alcancaMoldura)).flatMap((r) =>
      r.declaracoes
        .filter(([p, v]) => BORDA.test(p) && partes(v).some((parte) => APAGA.test(parte)))
        .map(([p, v]) => `${lugar(r)} { ${p}: ${v} }`),
    );
    expect(apagam, "regras que apagam o contorno da busca").toEqual([]);

    // E nenhuma regra da folha troca a cor ou a largura do contorno por baixo
    // (um `--co-control-border: transparent` dentro de `.co-sheet`).
    const redeclaram = REGRAS.flatMap((r) =>
      r.declaracoes
        .filter(([p]) => p === "--co-control-border" || p === "--co-border-width")
        .map(([p]) => `${lugar(r)} ${p}`),
    );
    expect(redeclaram, "tokens de contorno redeclarados na folha").toEqual([]);
  });

  it("a lupa leva o foco ao campo", async () => {
    // A lupa não tem ouvinte: ela fica por cima do controle, na célula dele, e
    // não recebe o toque — o dedo nela cai no controle, pelo navegador. O que se
    // prova é que ela mora ali e deixa o toque passar, e que o controle a
    // contém no respiro do começo, nos dois tamanhos.
    expect(oControleOcupaAMoldura(MOLDURA_DA_BUSCA)).toEqual([]);
    expect(declaradas("co-search__icon", LUGAR_DE_CIMA)).toEqual([
      ".co-search__icon { grid-area: 1 / 1 }",
      ".co-search__icon { pointer-events: none }",
    ]);

    const usuario = userEvent.setup();
    const { container } = render(
      <>
        <button type="button">Registrar</button>
        <SearchField label="Buscar alimento" />
        <SearchField label="Buscar receita" size="lg" />
      </>,
    );
    const borda = avaliar("var(--co-border-width)", TOKENS);
    for (const [tamanho, variante] of [
      ["md", []],
      ["lg", ['.co-search[data-size="lg"]']],
    ] as const) {
      const lupa = container.querySelector(
        tamanho === "md" ? '.co-search:not([data-size]) .co-search__icon' : '.co-search[data-size="lg"] .co-search__icon',
      );
      expect(lupa, `a lupa do ${tamanho}`).not.toBeNull();
      expect(lupa?.closest(".co-search")?.firstElementChild, `a lupa do ${tamanho} na moldura`).toBe(lupa);
      const largura = Number(lupa?.getAttribute("width"));
      const margem = avaliar(
        [".co-search__icon", ...variante.map((v) => `${v} .co-search__icon`)]
          .map((seletor) => Object.fromEntries(bloco(seletor))["margin-left"])
          .filter((valor) => valor !== undefined)
          .at(-1) ?? "",
        TOKENS,
      );
      const respiro = paddingQueVale(
        [".co-search__control", ...variante.map((v) => `${v} .co-search__control`)].flatMap((seletor) =>
          bloco(seletor),
        ),
        TOKENS,
      ).esquerda;
      // O controle começa por baixo da borda; a lupa, dentro dela.
      expect(respiro - borda, `respiro do começo do ${tamanho}`).toBeGreaterThan(margem + largura);
    }

    const campo = screen.getByRole("searchbox", { name: "Buscar alimento" });
    screen.getByRole("button", { name: "Registrar" }).focus();
    await usuario.click(campo);
    expect(document.activeElement).toBe(campo);

    // Com o foco já no campo, o toque não o tira de lá no aperto para devolver
    // no clique: o anel não pisca e o teclado do telefone não desce.
    const saiu = vi.fn();
    campo.addEventListener("blur", saiu);
    await usuario.click(campo);
    expect(saiu).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(campo);

    // O toque no próprio campo segue com o navegador: o cursor e a seleção.
    expect(fireEvent.mouseDown(campo)).toBe(true);
  });

  it("o corpo que rola nao corta o anel de foco da busca", () => {
    // O corpo da folha rola, e o que rola recorta na borda de dentro do
    // respiro: o anel que passa da moldura tem de caber no respiro, dos quatro
    // lados — o campo encostado no topo do corpo é o caso de toda folha que
    // abre numa busca.
    soEstesMexemNoPadding(classe("co-sheet__body"), [".co-sheet__body"]);
    const respiro = paddingQueVale(bloco(".co-sheet__body"), TOKENS);
    for (const seletor of [".co-search:focus-within", ".co-input:focus-within"]) {
      const anel = extensaoDoAnel(seletor);
      for (const [lado, px] of Object.entries(respiro)) {
        expect(px, `${seletor}: ${anel}px de anel no lado ${lado}`).toBeGreaterThanOrEqual(anel);
      }
    }
  });

  it("o x de limpar e da coluna, com nome acessivel", async () => {
    const usuario = userEvent.setup();
    const recebidos: string[] = [];
    function Busca() {
      const [termo, definir] = useState("");
      return (
        <SearchField
          label="Buscar alimento"
          value={termo}
          onChange={(evento) => {
            recebidos.push(evento.target.value);
            definir(evento.target.value);
          }}
        />
      );
    }
    const { container } = render(<Busca />);
    const campo = screen.getByRole("searchbox", { name: "Buscar alimento" });

    // Sem texto, nada para limpar: nenhum botão.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector(".co-search__clear")).toBeNull();

    await usuario.type(campo, "arroz");
    const limpar = screen.getByRole("button", { name: "Limpar a busca" });
    expect(limpar.tagName).toBe("BUTTON");
    expect(limpar).toHaveClass("co-search__clear");
    expect(limpar).toHaveAttribute("type", "button");

    // O toque esvazia pelo `onChange` de quem usa e devolve o foco ao campo.
    await usuario.click(limpar);
    expect(recebidos.at(-1)).toBe("");
    expect(campo).toHaveValue("");
    expect(document.activeElement).toBe(campo);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    // Pelo teclado também: Tab até o ×, Enter, e o foco volta ao campo — e não
    // ao começo da página, com o botão que sumiu.
    await usuario.type(campo, "feijão");
    await usuario.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Limpar a busca" }));
    await usuario.keyboard("{Enter}");
    expect(campo).toHaveValue("");
    expect(document.activeElement).toBe(campo);

    // O × do navegador não aparece ao lado do da coluna.
    expect(bloco(".co-search__control::-webkit-search-cancel-button")).toContainEqual([
      "display",
      "none",
    ]);
  });

  it("o x de limpar aceita outro nome e serve o campo sem controle", async () => {
    const usuario = userEvent.setup();
    render(
      <SearchField label="Buscar receita" defaultValue="bolo" clearLabel="Limpar a receita" />,
    );
    const campo = screen.getByRole("searchbox", { name: "Buscar receita" });
    await usuario.click(screen.getByRole("button", { name: "Limpar a receita" }));
    expect(campo).toHaveValue("");
    expect(document.activeElement).toBe(campo);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("o nome da busca aparece escrito e e o rotulo do campo", () => {
    render(<SearchField label="Buscar alimento" placeholder="arroz, feijão, banana" />);
    const campo = screen.getByRole("searchbox", { name: "Buscar alimento" });
    // O nome vem do rótulo escrito, e não de um atributo que só quem ouve lê.
    expect(campo).not.toHaveAttribute("aria-label");
    expect(campo).not.toHaveAttribute("aria-labelledby");

    const nome = screen.getByText("Buscar alimento");
    const rotulo = nome.closest("label");
    expect(rotulo).not.toBeNull();
    expect(rotulo).toHaveAttribute("for", campo.id);
    expect(nome.closest(".co-visually-hidden")).toBeNull();
    expect(screen.getByLabelText("Buscar alimento")).toBe(campo);
    expect(screen.getByRole("search")).toContainElement(rotulo);
  });

  it("o nome da busca sai na letra de corpo, sem caixa-alta, e nao com a cara do rotulo de secao", () => {
    render(<SearchField label="Buscar alimento" />);
    const nome = screen.getByText("Buscar alimento");
    const variante = nome.getAttribute("data-variant") ?? "";

    // Medido na folha, e não pelo nome da variante: 12px é o piso de rótulo
    // (`ux.md` §1), e a caixa-alta espaçada é a face do título de seção que
    // fica logo embaixo da busca ("ALIMENTOS ACHADOS").
    const face = Object.fromEntries(bloco(`.co-text[data-variant="${variante}"]`));
    expect(avaliar(face["font-size"] ?? "", TOKENS)).toBeGreaterThanOrEqual(12);
    expect(face["text-transform"] ?? "none").toBe("none");
    expect(face["letter-spacing"]).toBeUndefined();
    // O `text-transform` herda: nem o `<label>` nem o marco em volta põem a
    // caixa-alta de volta, nem mudam a letra que a variante deu.
    const LETRA = /^(font(-size|-weight|-variant.*)?|text-transform|letter-spacing)$/;
    expect([
      ...declaradas("co-search-field", LETRA),
      ...declaradas("co-search-field__label", LETRA),
    ]).toEqual([]);

    // A face é a do rótulo do `Field` em linha — mesma função, mesma cara.
    expect(variante).toBe("body");
    expect(nome).toHaveAttribute("data-tone", "default");
  });

  it("um id vindo de fora é o do campo, e o rótulo aponta para ele", () => {
    render(<SearchField label="Buscar alimento" id="busca-do-diario" />);
    const campo = screen.getByRole("searchbox", { name: "Buscar alimento" });
    expect(campo).toHaveAttribute("id", "busca-do-diario");
  });
});

/** As propriedades que dão tamanho à moldura, nos dois eixos. */
const TAMANHO = /^(min-|max-)?(height|width|block-size|inline-size)$/;
/** O que não é uma medida em pixel: relativo ao contêiner, ou sem limite. */
const SEM_MEDIDA = /^(auto|none|\d+(\.\d+)?%)$/;

/**
 * Uma moldura de campo, o controle que a ocupa e o que fica por cima dele.
 *
 * O toque em qualquer ponto da moldura é o toque no controle porque é ele que
 * está ali, e não por um tratador de clique (ADR-016). O happy-dom não faz
 * layout nem acha o elemento sob um ponto, então o que se prova aqui é a
 * geometria pela folha, na ordem da cascata: a moldura sem respiro próprio e
 * em grade; o controle esticado na sua área e por baixo da borda; e cada peça
 * de cima numa célula dessa área, transparente ao toque. O ponto a ponto, num
 * navegador de verdade, foi medido no Chromium e no WebKit.
 */
interface Moldura {
  moldura: string;
  controle: string;
  /** A área do controle na grade da moldura: a moldura inteira. */
  area: string;
  porCima: readonly string[];
}

const MOLDURA_DO_CAMPO: Moldura = {
  moldura: "co-input",
  controle: "co-input__control",
  area: "1 / 1",
  porCima: ["co-input__unit"],
};
const MOLDURA_DA_BUSCA: Moldura = {
  moldura: "co-search",
  controle: "co-search__control",
  area: "1 / 1 / 2 / 3",
  porCima: ["co-search__icon", "co-search__end"],
};

/** O que decide onde o controle fica e se ele recebe o toque. */
const LUGAR_DO_CONTROLE =
  /^(display|grid(-area|-column|-row)(-start|-end)?|(place|align|justify)-self|width|height|max-(width|height)|margin.*|position|inset.*|top|right|bottom|left|transform|translate|pointer-events)$/;
/** O que decide em que célula a peça de cima mora e se ela recebe o toque. */
const LUGAR_DE_CIMA =
  /^(grid(-area|-column|-row)(-start|-end)?|position|inset.*|top|right|bottom|left|transform|translate|pointer-events)$/;

/**
 * As regras que pintam a caixa do elemento da classe: é dela o último composto
 * do seletor, sem pseudo-elemento (`::placeholder` é outra caixa).
 */
const pintam = (nome: string) =>
  REGRAS.filter((r) =>
    r.seletores.some((s) => classe(nome).test(ultimoComposto(s)) && !ultimoComposto(s).includes("::")),
  );

/** Cada declaração das `propriedades` nas regras que pintam a classe. */
const declaradas = (nome: string, propriedades: RegExp) =>
  pintam(nome).flatMap((r) =>
    r.declaracoes.filter(([p]) => propriedades.test(p)).map(([p, v]) => `${lugar(r)} { ${p}: ${v} }`),
  );

const oValorDe = (seletor: string, propriedade: string) =>
  Object.fromEntries(bloco(seletor))[propriedade] ?? "";

/** O que separa o controle da moldura inteira: vazio quando ele a ocupa. */
function oControleOcupaAMoldura({ moldura, controle, area, porCima }: Moldura): string[] {
  const faltas: string[] = [];
  const m = `.${moldura}`;
  const c = `.${controle}`;

  // A moldura não tem respiro próprio: o respiro é do controle.
  const respiro = declaradas(moldura, /^padding/);
  if (respiro.join() !== `${m} { padding: 0 }`) faltas.push(`respiro da moldura: ${respiro.join("; ")}`);
  for (const display of declaradas(moldura, /^display$/)) {
    if (!/: (inline-)?grid \}$/.test(display)) faltas.push(`moldura fora da grade: ${display}`);
  }

  // O controle ocupa a área inteira e passa por baixo da borda dela: a
  // margem negativa é a borda da moldura, e nenhuma outra regra o tira dali.
  const lugarDoControle = declaradas(controle, LUGAR_DO_CONTROLE);
  const esperado = [
    `${c} { grid-area: ${area} }`,
    `${c} { place-self: stretch }`,
    `${c} { width: auto }`,
    `${c} { margin: calc(-1 * var(--co-border-width)) }`,
  ];
  if (lugarDoControle.join() !== esperado.join()) faltas.push(`lugar do controle: ${lugarDoControle.join("; ")}`);
  if (partes(oValorDe(m, "border"))[0] !== "var(--co-border-width)") faltas.push("borda da moldura");

  // O que fica por cima mora numa célula da área do controle e deixa o toque
  // passar para ele.
  for (const peca of porCima) {
    const lugarDaPeca = declaradas(peca, LUGAR_DE_CIMA);
    const daPeca = [`.${peca} { grid-area: 1 / 1 }`, `.${peca} { pointer-events: none }`];
    if (lugarDaPeca.join() !== daPeca.join()) faltas.push(`${peca}: ${lugarDaPeca.join("; ")}`);
  }
  return faltas;
}

/**
 * Os ouvintes que o React pôs no elemento: as props `on*` que ele guarda no nó.
 * O React não escreve `onclick` no HTML (ele ouve na raiz), então é ali que um
 * tratador de toque na moldura apareceria. Sem a chave, falha alto: uma versão
 * do React que guarde as props em outro lugar não pode passar calada.
 */
function ouvintes(elemento: Element): string[] {
  const chave = Object.keys(elemento).find((nome) => nome.startsWith("__reactProps$"));
  expect(chave, `as props do React em ${elemento.getAttribute("class")}`).toBeDefined();
  const props = (elemento as unknown as Record<string, Record<string, unknown> | undefined>)[chave ?? ""];
  return Object.keys(props ?? {}).filter((nome) => /^on[A-Z]/.test(nome));
}

/** O que mora na moldura e não é o controle, nem peça de cima, nem um botão. */
function oQueSobra(elemento: Element, { controle, porCima }: Moldura): string[] {
  return Array.from(elemento.children)
    .filter(
      (filho) =>
        !filho.classList.contains(controle) &&
        !porCima.some((peca) => filho.classList.contains(peca)) &&
        filho.tagName !== "BUTTON",
    )
    .map((filho) => `${filho.tagName.toLowerCase()}.${filho.getAttribute("class") ?? ""}`);
}

describe("a moldura do campo", () => {
  it("tocar em qualquer ponto da moldura foca o campo, e a area mede ao menos 44x44 px", async () => {
    const usuario = userEvent.setup();
    const { container } = render(
      <>
        <button type="button">Registrar</button>
        <Input aria-label="Peso" unit="kg" defaultValue="83,1" />
        <SearchField label="Buscar alimento" count="6 resultados" shortcut="/" defaultValue="arroz" />
      </>,
    );
    const fora = screen.getByRole("button", { name: "Registrar" });
    const peso = screen.getByRole("textbox", { name: "Peso" });
    const busca = screen.getByRole("searchbox", { name: "Buscar alimento" });

    // O controle é a moldura: sem respiro próprio, ele esticado na área inteira
    // e por baixo da borda, e a unidade, a lupa, a contagem e a tecla por cima
    // dele, sem receber o toque. O respiro dos lados é do controle.
    for (const [moldura, controle] of [
      [MOLDURA_DO_CAMPO, peso],
      [MOLDURA_DA_BUSCA, busca],
    ] as const) {
      expect(oControleOcupaAMoldura(moldura), `.${moldura.moldura}`).toEqual([]);
      const elemento = controle.closest(`.${moldura.moldura}`);
      expect(elemento, `.${moldura.moldura}`).not.toBeNull();
      expect(oQueSobra(elemento as Element, moldura), `o que sobra em .${moldura.moldura}`).toEqual([]);
      for (const peca of moldura.porCima) {
        expect(elemento?.querySelector(`:scope > .${peca}`), `.${peca} renderizada`).not.toBeNull();
      }

      // O respiro dos lados é do controle, e o do fim é o que a peça de cima
      // ocupa: sem a medida, o da moldura; com ela, a medida inteira.
      const c = `.${moldura.controle}`;
      const borda = avaliar("var(--co-border-width)", TOKENS);
      const semFim = paddingQueVale(bloco(c), TOKENS);
      expect(semFim.esquerda - borda, `${c} respiro do começo`).toBeGreaterThanOrEqual(14);
      expect(semFim.direita - borda, `${c} respiro do fim`).toBeGreaterThanOrEqual(14);
      const comFim = paddingQueVale(bloco(c), { ...TOKENS, "--co-field-end": "36px" });
      expect(comFim.direita - borda, `${c} com a medida do fim`).toBe(36);
    }

    // O × é o único que mora na moldura sem ser o controle nem peça de cima, e
    // é um botão de verdade, por cima do controle, na célula do fim.
    const limpar = screen.getByRole("button", { name: "Limpar a busca" });
    expect(limpar.parentElement).toBe(busca.closest(".co-search"));
    expect(declaradas("co-search__clear", LUGAR_DE_CIMA)).toEqual([".co-search__clear { grid-area: 1 / 2 }"]);

    // O toque cai no controle, e ele faz o que um campo faz: foca, e com o foco
    // já nele não o tira de lá no aperto para devolver no clique — o anel não
    // pisca e o teclado do telefone não desce.
    for (const controle of [peso, busca]) {
      fora.focus();
      await usuario.click(controle);
      expect(document.activeElement, `toque em ${controle.getAttribute("type") ?? "text"}`).toBe(controle);
      const saiu = vi.fn();
      controle.addEventListener("blur", saiu);
      await usuario.click(controle);
      controle.removeEventListener("blur", saiu);
      expect(saiu, "toque com o foco já no campo").not.toHaveBeenCalled();
      expect(document.activeElement).toBe(controle);

      // Nada intercepta o aperto: o cursor e a seleção são do navegador.
      expect(fireEvent.mouseDown(controle), "o aperto no controle segue").toBe(true);
      expect(fireEvent.click(controle), "o clique no controle segue").toBe(true);
    }

    // E o toque é do navegador, e não de um tratador: nem a moldura nem as
    // peças de cima têm ouvinte — só o controle e o ×, que são controles.
    for (const elemento of container.querySelectorAll(".co-input, .co-search")) {
      for (const parte of [elemento, ...Array.from(elemento.children)]) {
        if (parte.tagName === "INPUT" || parte.tagName === "BUTTON") continue;
        expect(ouvintes(parte), `ouvintes em ${parte.getAttribute("class")}`).toEqual([]);
      }
    }
    fora.focus();
    await usuario.pointer([
      { keys: "[MouseLeft>]", target: peso, offset: 0 },
      { offset: 2 },
      { keys: "[/MouseLeft]" },
    ]);
    expect(document.activeElement).toBe(peso);
    expect([
      (peso as HTMLInputElement).selectionStart,
      (peso as HTMLInputElement).selectionEnd,
    ]).toEqual([0, 2]);

    // A área: a moldura tem o alvo mínimo nos dois eixos, pela folha — a
    // altura sozinha não segura o campo apertado numa coluna estreita.
    for (const seletor of [".co-input", ".co-search"]) {
      const declaracoes = Object.fromEntries(bloco(seletor));
      for (const eixo of ["min-height", "min-width"]) {
        expect(declaracoes[eixo], `${seletor} { ${eixo} }`).toBeDefined();
        expect(
          avaliar(declaracoes[eixo] ?? "", TOKENS),
          `${seletor} { ${eixo} }`,
        ).toBeGreaterThanOrEqual(44);
      }
    }

    // E nenhuma regra que pinta a moldura — num tamanho, num estado, dentro
    // de outra peça — a encolhe abaixo do alvo.
    const encolhem = REGRAS.filter((r) =>
      r.seletores.some((s) => classe("co-input", "co-search").test(ultimoComposto(s))),
    ).flatMap((r) =>
      r.declaracoes
        .filter(([p, v]) => TAMANHO.test(p) && !SEM_MEDIDA.test(v))
        .filter(([, v]) => !(avaliar(v, TOKENS) >= 44))
        .map(([p, v]) => `${lugar(r)} { ${p}: ${v} }`),
    );
    expect(encolhem, "regras que encolhem a moldura abaixo de 44px").toEqual([]);
  });

  it("o controle reserva no fim a largura da unidade e da contagem, e a devolve quando elas saem", () => {
    // O texto não corre por baixo do que fica por cima do fim: a largura dele
    // vira o respiro do fim do controle (`--co-field-end` na moldura), medida
    // ao montar e de novo a cada mudança de tamanho. O happy-dom não mede, então
    // a largura e o observador são os deste teste.
    const larguras = new Map<string, number>([
      ["co-input__unit", 36],
      ["co-search__end", 122],
    ]);
    const medida = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const largura = [...larguras].find(([nome]) => this.classList.contains(nome))?.[1] ?? 0;
        return { width: largura, height: 0, top: 0, left: 0, right: largura, bottom: 0, x: 0, y: 0, toJSON: () => ({}) };
      });
    const observados: { aviso: () => void; alvos: Element[]; desligado: boolean }[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        private readonly registro: { aviso: () => void; alvos: Element[]; desligado: boolean };
        constructor(aviso: () => void) {
          this.registro = { aviso, alvos: [], desligado: false };
          observados.push(this.registro);
        }
        observe(alvo: Element) {
          this.registro.alvos.push(alvo);
        }
        unobserve() {}
        disconnect() {
          this.registro.desligado = true;
        }
      },
    );

    try {
      const { container, rerender } = render(
        <>
          <Input aria-label="Peso" unit="kg" />
          <Input aria-label="Nome" />
          <SearchField label="Buscar alimento" count="6 resultados" />
        </>,
      );
      const [peso, nome] = Array.from(container.querySelectorAll<HTMLElement>(".co-input"));
      const busca = container.querySelector<HTMLElement>(".co-search");
      const fim = (moldura: HTMLElement | null | undefined) =>
        moldura?.style.getPropertyValue("--co-field-end");

      expect(fim(peso), "a unidade medida ao montar").toBe("36px");
      expect(fim(busca), "a contagem medida ao montar").toBe("122px");
      expect(fim(nome), "sem unidade, sem medida").toBe("");
      expect(observados.flatMap((o) => o.alvos.map((alvo) => alvo.className))).toEqual([
        "co-input__unit",
        "co-search__end",
      ]);

      // A contagem cresce ("12 resultados"), e o respiro cresce junto.
      larguras.set("co-search__end", 130);
      observados[1]?.aviso();
      expect(fim(busca)).toBe("130px");

      // Sem largura (fora da tela, ou só a tecla, que sai com o foco), a medida
      // sai, e o controle volta ao respiro da moldura.
      larguras.set("co-input__unit", 0);
      observados[0]?.aviso();
      expect(fim(peso)).toBe("");

      // A peça de cima sai, e leva a medida e o observador com ela.
      rerender(
        <>
          <Input aria-label="Peso" />
          <Input aria-label="Nome" />
          <SearchField label="Buscar alimento" />
        </>,
      );
      expect(fim(peso)).toBe("");
      expect(fim(busca)).toBe("");
      expect(container.querySelector(".co-search__end")).toBeNull();
      expect(observados.map((o) => o.desligado)).toEqual([true, true]);
    } finally {
      medida.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
