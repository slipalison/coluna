import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";
import { Stack } from "./Stack";
import { Text } from "./Text";

const meta = {
  title: "Átomos/Badge",
  component: Badge,
  args: { children: "TACO", tone: "neutral", solid: false },
  argTypes: {
    tone: { control: "inline-radio", options: ["neutral", "accent", "status"] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

/**
 * Selo curto: a origem de um dado, o estado de um ingrediente, a confiança de
 * um número. Não é contador de notificação nem botão — se a pessoa pode
 * clicar, é um `Button`, e o selo não recebe evento.
 */
export const Tons: Story = {
  render: () => (
    <Stack gap={16}>
      <Stack direction="row" gap={10} align="center" wrap>
        <Badge>TACO</Badge>
        <Badge tone="accent">cru</Badge>
        <Badge tone="status">cozido</Badge>
        <Badge solid>62% medido</Badge>
      </Stack>
      <Text variant="caption" tone="muted" style={{ maxWidth: "52ch" }}>
        Preenchido com parcimônia: um por bloco. Dois selos sólidos lado a lado brigam, e o leitor
        não sabe qual dos dois é o importante.
      </Text>
    </Stack>
  ),
};

export const NoLugarDeUso: Story = {
  name: "No lugar de uso",
  render: () => (
    <Stack gap={12}>
      <Stack direction="row" gap={10} align="center">
        <Text variant="body">Mandioca, cozida</Text>
        <Badge tone="status">cozido</Badge>
        <Text variant="caption" tone="muted">
          medida pronta — sem fator
        </Text>
      </Stack>
      <Stack direction="row" gap={10} align="center">
        <Text variant="body">Filé de frango, cru</Text>
        <Badge>cru</Badge>
        <Text variant="caption" tone="muted">
          rendimento 0,72 + retenção
        </Text>
      </Stack>
    </Stack>
  ),
};
