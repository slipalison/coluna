import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Divider } from "./Divider";
import { Grid } from "./Grid";
import { Icon, iconNames } from "./Icon";
import { Slat } from "./Slat";
import { Stack } from "./Stack";
import { Surface } from "./Surface";
import { Text } from "./Text";
import { VisuallyHidden } from "./VisuallyHidden";

describe("Text", () => {
  it("leva variante e tom para o DOM, que é onde o CSS lê", () => {
    render(
      <Text as="h1" variant="display" tone="accent">
        Basalto
      </Text>,
    );
    const no = screen.getByRole("heading", { name: "Basalto" });
    expect(no).toHaveAttribute("data-variant", "display");
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
