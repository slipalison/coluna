import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "./atoms/Badge";
import { Button } from "./atoms/Button";
import { Divider } from "./atoms/Divider";
import { Grid } from "./atoms/Grid";
import { Icon } from "./atoms/Icon";
import { Slat } from "./atoms/Slat";
import { Stack } from "./atoms/Stack";
import { Surface } from "./atoms/Surface";
import { Text } from "./atoms/Text";
import { VisuallyHidden } from "./atoms/VisuallyHidden";
import { ListRow } from "./molecules/ListRow";
import { MacroBar } from "./molecules/MacroBar";
import { Notice } from "./molecules/Notice";
import { SegmentedControl } from "./molecules/SegmentedControl";
import { Stat } from "./molecules/Stat";
import { Stepper } from "./molecules/Stepper";
import { ThemeProvider } from "./theme/ThemeProvider";

/**
 * Contrato: uma classe vinda de fora SOMA, nunca substitui.
 *
 * Quem consome precisa de um gancho para posicionar o componente no layout
 * dele — e se a classe externa apagasse a do sistema, o componente perderia a
 * própria aparência e o defeito apareceria só naquele uso. Por isso o teste é
 * de tabela: cada componente novo entra aqui junto.
 */
const CASOS: [nome: string, elemento: React.ReactElement, classeDoSistema: string][] = [
  ["Text", <Text className="x" key="t">a</Text>, "co-text"],
  ["Stack", <Stack className="x" key="s" />, "co-stack"],
  ["Grid", <Grid className="x" key="g" />, "co-grid"],
  ["Surface", <Surface className="x" key="u" />, "co-surface"],
  ["Badge", <Badge className="x" key="b">TACO</Badge>, "co-badge"],
  ["Button", <Button className="x" key="bt">ok</Button>, "co-button"],
  ["Divider", <Divider className="x" key="d" />, "co-divider"],
  ["Icon", <Icon className="x" key="i" name="plus" />, "co-icon"],
  ["Slat", <Slat className="x" key="sl" value={0.5} />, "co-slat"],
  ["VisuallyHidden", <VisuallyHidden className="x" key="v">a</VisuallyHidden>, "co-visually-hidden"],
  ["ListRow", <ListRow className="x" key="l">a</ListRow>, "co-list-row"],
  ["Notice", <Notice className="x" key="n" title="t">c</Notice>, "co-notice"],
  ["Stat", <Stat className="x" key="st" label="L" value="1" />, "co-stat"],
  [
    "Stepper",
    <Stepper className="x" key="sp" label="porções" value={2} onChange={vi.fn()} />,
    "co-stepper",
  ],
  [
    "SegmentedControl",
    <SegmentedControl
      className="x"
      key="sc"
      label="Aba"
      options={[{ value: "a", label: "A" }]}
      value="a"
      onChange={vi.fn()}
    />,
    "co-segmented",
  ],
  ["MacroBar", <MacroBar className="x" key="m" name="Proteína" value={1} target={2} />, "co-stack"],
];

describe("classe externa", () => {
  it.each(CASOS)("%s soma a classe recebida à do sistema", (_nome, elemento, classeDoSistema) => {
    const { container } = render(elemento);
    const no = container.querySelector(`.${classeDoSistema}`);
    expect(no).not.toBeNull();
    expect(no).toHaveClass("x");
  });

  it("ThemeProvider também soma", () => {
    const { container } = render(
      <ThemeProvider className="x" storageKey={null}>
        <span>a</span>
      </ThemeProvider>,
    );
    expect(container.querySelector(".co-root")).toHaveClass("x");
  });
});

describe("partes opcionais somem quando não são passadas", () => {
  it("Stat sem unidade e sem legenda mostra só rótulo e número", () => {
    const { container } = render(<Stat label="Gasto" value="2.467" />);
    expect(container.querySelectorAll(".co-text")).toHaveLength(2);
  });

  it("Slat sem rótulo e Stepper sem formatador usam o padrão", () => {
    const { container } = render(
      <>
        <Slat value={0.25} />
        <Stepper label="porções" value={3} onChange={vi.fn()} />
      </>,
    );
    expect(container.querySelector(".co-slat")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".co-stepper__value")).toHaveTextContent("3");
  });

  it("armazenamento indisponível não impede o tema de funcionar", () => {
    // Janela anônima, cookie bloqueado, quota estourada: nada disso pode
    // derrubar a aplicação — a escolha só deixa de sobreviver ao recarregar.
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
    try {
      const { container } = render(
        <ThemeProvider defaultTheme="dark">
          <span>a</span>
        </ThemeProvider>,
      );
      expect(container.querySelector(".co-root")).toBeInTheDocument();
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it("valor guardado inválido é ignorado em favor do padrão", () => {
    window.localStorage.setItem("coluna-theme", "roxo");
    render(
      <ThemeProvider defaultTheme="light">
        <span>a</span>
      </ThemeProvider>,
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });
});
