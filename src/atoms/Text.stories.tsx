import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./Stack";
import { Text } from "./Text";

const meta = {
  title: "Átomos/Text",
  component: Text,
  args: { children: "Sua taxa basal, em rocha sólida", variant: "body", tone: "default", numeric: false },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["display", "title", "body", "caption", "label", "numeral"],
    },
    tone: { control: "inline-radio", options: ["default", "secondary", "muted", "accent", "status"] },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Corpo: Story = {};

/**
 * A rampa inteira, e ela é fechada de propósito. Não existe "tamanho 17 em
 * negrito": se um desenho pede isso, ou vira uma variante aqui, ou é um
 * desenho fora do sistema. Essa recusa é o que impede o vale-tudo de voltar
 * pela porta dos fundos.
 */
export const Rampa: Story = {
  render: () => (
    <Stack gap={16}>
      <Text as="h1" variant="display">
        Sua taxa basal, em rocha sólida
      </Text>
      <Text variant="numeral" numeric>
        1.917
      </Text>
      <Text as="h2" variant="title">
        Restante hoje
      </Text>
      <Text variant="body">
        Corpo do texto, que é onde mora quase tudo o que a pessoa lê na tela.
      </Text>
      <Text variant="caption" tone="secondary">
        Legenda: a linha que explica de onde o número veio.
      </Text>
      <Text variant="label">Rótulo de seção</Text>
    </Stack>
  ),
};

export const Tons: Story = {
  render: () => (
    <Stack gap={10}>
      <Text>Padrão — o texto que se lê primeiro</Text>
      <Text tone="secondary">Secundário — explicação, legenda longa</Text>
      <Text tone="muted">Apagado — metadado, unidade, contagem</Text>
      <Text tone="accent">Acento — a ação, o valor em foco</Text>
      <Text tone="status">Estado — neutro, informativo, nunca alarme</Text>
    </Stack>
  ),
};

/**
 * `tabular-nums` não é preciosismo. Sem ele uma coluna de kcal dança a cada
 * dígito que muda, e uma tabela de números vira ruído — compare as duas.
 */
export const AlgarismoDeLarguraFixa: Story = {
  name: "Algarismo de largura fixa",
  render: () => (
    <Stack direction="row" gap={40}>
      <Stack gap={4}>
        <Text variant="label">Sem</Text>
        <Text>1.917</Text>
        <Text>995</Text>
        <Text>2.467</Text>
        <Text>111</Text>
      </Stack>
      <Stack gap={4}>
        <Text variant="label">Com</Text>
        <Text numeric>1.917</Text>
        <Text numeric>995</Text>
        <Text numeric>2.467</Text>
        <Text numeric>111</Text>
      </Stack>
    </Stack>
  ),
};
