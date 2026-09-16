import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "./Grid";
import { Icon, iconNames } from "./Icon";
import { Stack } from "./Stack";
import { Surface } from "./Surface";
import { Text } from "./Text";

const meta = {
  title: "Átomos/Icon",
  component: Icon,
  args: { name: "search", size: 24 },
  argTypes: {
    name: { control: "select", options: iconNames },
    size: { control: { type: "range", min: 12, max: 48, step: 2 } },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Um: Story = {};

/**
 * O conjunto é fechado. Todos de traço, na mesma grade de 24 e com a mesma
 * espessura de 1,5 — um pictograma cheio no meio de contornos salta como erro
 * de impressão. Emoji não entra: não escala, não recolore, e muda de desenho
 * por sistema operacional.
 */
export const Todos: Story = {
  render: () => (
    <Grid columns={5} gap={8}>
      {iconNames.map((nome) => (
        <Surface key={nome} bordered padding={12}>
          <Stack align="center" gap={8}>
            <Icon name={nome} size={22} />
            <Text variant="caption" tone="muted" style={{ fontSize: "10px", textAlign: "center" }}>
              {nome}
            </Text>
          </Stack>
        </Surface>
      ))}
    </Grid>
  ),
};

/**
 * Por padrão o ícone sai `aria-hidden`, que é o certo para o caso comum: ele
 * acompanha um rótulo, e repeti-lo faz o leitor de tela falar duas vezes.
 * `title` só quando o ícone for a ÚNICA coisa dentro do controle.
 */
export const QuandoOÍconeFala: Story = {
  name: "Quando o ícone fala",
  render: () => (
    <Stack gap={16}>
      <Stack direction="row" gap={10} align="center">
        <Icon name="search" />
        <Text variant="caption" tone="muted">
          decorativo — o rótulo ao lado já diz o que é
        </Text>
      </Stack>
      <Stack direction="row" gap={10} align="center">
        <Icon name="search" title="Buscar alimento" />
        <Text variant="caption" tone="muted">
          com título — vira `role="img"` e é anunciado
        </Text>
      </Stack>
    </Stack>
  ),
};
