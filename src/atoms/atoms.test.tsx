import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { Divider } from "./Divider";
import { Grid } from "./Grid";
import { Icon, iconNames } from "./Icon";
import { Input } from "./Input";
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
