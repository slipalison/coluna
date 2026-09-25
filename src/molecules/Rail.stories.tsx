import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { VisuallyHidden } from "../atoms/VisuallyHidden";
import { Rail, type RailItem } from "./Rail";

/**
 * A navegação lateral do desktop.
 *
 * É a contraparte da `TabBar`, e as duas existem porque a diferença entre
 * telefone e desktop não é de tamanho, é de **quantidade**: embaixo cabem quatro
 * destinos e o resto vai para "Mais"; na lateral cabem os sete, e "Mais" deixa
 * de ser uma gaveta com o que não coube.
 *
 * Os grupos são por **frequência**, não por assunto. Agrupar por assunto
 * ("Comida", "Corpo", "Conta") fica bonito na documentação e obriga a pensar
 * toda vez; agrupar pelo que se usa todo dia põe as quatro coisas de sempre
 * onde a mão já vai.
 */
const meta = {
  title: "Moléculas/Rail",
  component: Rail,
  args: {
    label: "Seções do Basalto",
    items: [],
    value: "diario",
    onChange: () => undefined,
  },
} satisfies Meta<typeof Rail>;

export default meta;
type Story = StoryObj<typeof meta>;

const DESTINOS = [
  { value: "diario", label: "Diário", icon: "book", group: "Todo dia" },
  { value: "registrar", label: "Registrar", icon: "plus", group: "Todo dia" },
  { value: "historico", label: "Histórico", icon: "calendar", group: "Todo dia" },
  { value: "medidas", label: "Peso e gasto", icon: "scale", group: "Todo dia" },
  { value: "plano", label: "Plano", icon: "chart", group: "De vez em quando" },
  { value: "receitas", label: "Receitas", icon: "utensils", group: "De vez em quando" },
  { value: "ajustes", label: "Ajustes", icon: "gear", group: "De vez em quando" },
] as const satisfies readonly RailItem<string>[];

type Destino = (typeof DESTINOS)[number]["value"];

/**
 * A marca no topo do trilho. É o nome do lugar, e não um destino: fica fora da
 * lista de botões, e recolhida continua dizendo "Basalto" ao leitor de tela.
 */
function Marca({ collapsed }: Readonly<{ collapsed: boolean }>) {
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          width: "26px",
          height: "26px",
          flexShrink: 0,
          borderRadius: "var(--co-radius-inset)",
          background: "var(--co-accent)",
        }}
      />
      {collapsed ? (
        <VisuallyHidden>Basalto</VisuallyHidden>
      ) : (
        <Text
          as="span"
          style={{ fontFamily: "var(--co-font-display)", fontSize: "var(--co-text-24)", lineHeight: 1 }}
        >
          Basalto
        </Text>
      )}
    </>
  );
}

function Moldura({
  collapsed = false,
  marca = false,
}: Readonly<{ collapsed?: boolean; marca?: boolean }>) {
  const [destino, definir] = useState<Destino>("diario");
  const atual = DESTINOS.find((d) => d.value === destino);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        maxWidth: "900px",
        height: "420px",
        overflow: "hidden",
        borderRadius: "var(--co-radius-container)",
        background: "var(--co-canvas)",
      }}
    >
      <Rail
        label="Seções do Basalto"
        items={DESTINOS}
        value={destino}
        collapsed={collapsed}
        onChange={definir}
        header={marca ? <Marca collapsed={collapsed} /> : undefined}
        footer={
          <Text variant="micro" tone="subtle">
            Coluna
          </Text>
        }
      />
      <Stack gap={8} style={{ padding: "24px" }}>
        <Text variant="title-lg">{atual?.label}</Text>
        <Text variant="footnote" tone="muted">
          O trilho é a navegação; esta coluna é o que se faz. O que se CONSULTA fica na coluna da
          direita, quando houver.
        </Text>
      </Stack>
    </div>
  );
}

export const Padrão: Story = {
  render: () => <Moldura />,
};

/**
 * Com a marca no topo (`header`), como nas nove pranchas de desktop. Ela fica
 * fora da navegação — é o nome do lugar —, e o rodapé continua embaixo.
 */
export const ComMarca: Story = {
  name: "Com marca",
  render: () => <Moldura marca />,
};

/**
 * Recolhido em 72px, para a janela estreita que ainda não é telefone.
 *
 * O rótulo sai da tela mas continua no leitor de tela e no `title` do mouse — e
 * o nome do grupo também: tirar a hierarquia junto com a largura deixaria sete
 * botões soltos para quem navega ouvindo.
 */
export const Recolhido: Story = {
  render: () => <Moldura collapsed marca />,
};
