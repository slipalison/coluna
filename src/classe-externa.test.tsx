import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "./atoms/Badge";
import { Button } from "./atoms/Button";
import { Chip } from "./atoms/Chip";
import { Divider } from "./atoms/Divider";
import { Grid } from "./atoms/Grid";
import { Icon } from "./atoms/Icon";
import { IconButton } from "./atoms/IconButton";
import { Input } from "./atoms/Input";
import { SearchField } from "./atoms/SearchField";
import { Series } from "./atoms/Series";
import { Slat } from "./atoms/Slat";
import { Stack } from "./atoms/Stack";
import { Surface } from "./atoms/Surface";
import { Text } from "./atoms/Text";
import { VisuallyHidden } from "./atoms/VisuallyHidden";
import { Diff } from "./molecules/Diff";
import { Disclosure } from "./molecules/Disclosure";
import { EmptyState } from "./molecules/EmptyState";
import { Field } from "./molecules/Field";
import { Legend } from "./molecules/Legend";
import { ListRow } from "./molecules/ListRow";
import { MacroBar } from "./molecules/MacroBar";
import { NavList } from "./molecules/NavList";
import { Notice } from "./molecules/Notice";
import { PageHeader } from "./molecules/PageHeader";
import { Pager } from "./molecules/Pager";
import { Rail } from "./molecules/Rail";
import { SegmentedControl } from "./molecules/SegmentedControl";
import { Sheet } from "./molecules/Sheet";
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
  ["MacroBar", <MacroBar className="x" key="m" name="Proteína" value={1} target={2} />, "co-macro"],
  ["Input", <Input className="x" key="in" aria-label="Peso" />, "co-input"],
  ["Chip", <Chip className="x" key="ch" label="Sem lactose" />, "co-chip"],
  [
    "Series",
    <Series className="x" key="se" points={[{ x: 0, y: 1 }, { x: 1, y: 2 }]} label="Peso" />,
    "co-series",
  ],
  [
    "Field",
    <Field className="x" key="fi" label="Peso">
      {(controle) => <Input {...controle} />}
    </Field>,
    "co-field",
  ],
  ["Disclosure", <Disclosure className="x" key="di">porque sim</Disclosure>, "co-disclosure"],
  ["EmptyState", <EmptyState className="x" key="em" title="Nada aqui" />, "co-empty"],
  ["Diff", <Diff className="x" key="df" label="Meta" before="1" after="2" />, "co-diff"],
  [
    "Sheet",
    <Sheet className="x" key="sh" open title="Trocar" onClose={vi.fn()}>
      a
    </Sheet>,
    "co-sheet",
  ],
  [
    "Rail",
    <Rail
      className="x"
      key="ra"
      label="Seções"
      items={[{ value: "a", label: "A", icon: "book" }]}
      value="a"
      onChange={vi.fn()}
    />,
    "co-rail",
  ],
  ["IconButton", <IconButton className="x" key="ib" icon="plus" label="Nova" />, "co-icon-button"],
  ["SearchField", <SearchField className="x" key="sf" label="Buscar" />, "co-search"],
  [
    "Pager",
    <Pager
      className="x"
      key="pg"
      label="Dia"
      previousLabel="Dia anterior"
      nextLabel="Próximo dia"
      onPrevious={vi.fn()}
      onNext={vi.fn()}
    />,
    "co-pager",
  ],
  ["Legend", <Legend className="x" key="lg" items={[{ label: "parcial" }]} />, "co-legend"],
  [
    "NavList",
    <NavList
      className="x"
      key="nl"
      label="Ajustes"
      items={[{ value: "a", label: "A" }]}
      value="a"
      onChange={vi.fn()}
    />,
    "co-nav-list",
  ],
  ["PageHeader", <PageHeader className="x" key="ph" title="Hoje" />, "co-page-header"],
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
