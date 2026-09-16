import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Stack } from "./Stack";
import { Text } from "./Text";

const meta = {
  title: "Átomos/Button",
  component: Button,
  args: {
    children: "Registrar",
    variant: "primary",
    size: "md",
    full: false,
    disabled: false,
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost", "danger"] },
    // Dois tamanhos, e o menor tem 44px. A ausência de um `sm` é a decisão:
    // um alvo de 32px passa no desenho e some no polegar.
    size: { control: "inline-radio", options: ["md", "lg"] },
    icon: { control: "select", options: [undefined, "plus", "check", "refresh", "search"] },
    iconEnd: { control: "select", options: [undefined, "chevron-down", "chevron-right"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primário: Story = {};

export const Variantes: Story = {
  render: () => (
    <Stack gap={12} direction="row" wrap align="center">
      <Button variant="primary">Copiar para o diário</Button>
      <Button variant="secondary">Usar no cardápio</Button>
      <Button variant="ghost">Nova refeição</Button>
      <Button variant="danger">Apagar a conta</Button>
    </Stack>
  ),
};

export const ComÍcone: Story = {
  name: "Com ícone",
  render: () => (
    <Stack gap={12} direction="row" wrap align="center">
      <Button icon="plus" size="lg">
        Registrar
      </Button>
      <Button icon="check" variant="primary">
        Copiar para o diário
      </Button>
      <Button iconEnd="chevron-down" variant="secondary">
        Almoço
      </Button>
      <Button icon="refresh" variant="ghost">
        Regerar
      </Button>
    </Stack>
  ),
};

export const LarguraCheia: Story = {
  name: "Largura cheia",
  args: { full: true, size: "lg", icon: "plus" },
};

export const Desabilitado: Story = {
  render: () => (
    <Stack gap={12} direction="row" wrap align="center">
      <Button disabled>Registrar</Button>
      <Button variant="secondary" disabled>
        Usar no cardápio
      </Button>
    </Stack>
  ),
};

/**
 * O vermelho do sistema tem dono: apagar a conta apaga os dados de verdade.
 * Ele não decora erro de digitação nem repreende quem comeu mais do que
 * planejou — e não substitui a confirmação, só encarece errar o alvo.
 */
export const OVermelhoTemDono: Story = {
  name: "O vermelho tem dono",
  render: () => (
    <Stack gap={12}>
      <Button variant="danger">Apagar a conta</Button>
      <Text variant="caption" tone="muted" style={{ maxWidth: "48ch" }}>
        É o único uso de vermelho no sistema. Aviso informa e nunca bloqueia; erro de entrada é
        mensagem junto do campo, não cor.
      </Text>
    </Stack>
  ),
};
