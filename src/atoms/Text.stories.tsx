import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./Stack";
import { Text } from "./Text";

const VARIANTES = [
  "title-lg",
  "numeral",
  "headline",
  "body",
  "callout",
  "subhead",
  "footnote",
  "caption",
  "label",
  "micro",
] as const;

const meta = {
  title: "Átomos/Text",
  component: Text,
  args: { children: "Sua taxa basal, em rocha sólida", variant: "body", tone: "default", numeric: false },
  argTypes: {
    variant: { control: "select", options: VARIANTES },
    tone: {
      control: "select",
      options: ["default", "body", "secondary", "muted", "subtle", "accent", "status"],
    },
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
      <Text as="h1" variant="title-lg">
        Quanto você gasta em repouso
      </Text>
      <Text variant="numeral">1.917</Text>
      <Text as="h2" variant="headline">
        Café da manhã
      </Text>
      <Text variant="body">Arroz, branco, cozido</Text>
      <Text variant="callout" tone="body">
        4 colheres de sopa · 100 g
      </Text>
      <Text variant="subhead" tone="secondary">
        quarta, 16 de setembro
      </Text>
      <Text variant="footnote" tone="secondary">
        Nota: a linha que explica o bloco inteiro, e não uma linha dele.
      </Text>
      <Text variant="caption" tone="subtle" numeric>
        370 + 21,6 × 65,91 = 1.793,7
      </Text>
      <Text variant="label">Macros da meta</Text>
      <Text variant="micro">Cereal</Text>
    </Stack>
  ),
};

/**
 * Cinco degraus de texto, em contraste decrescente. O piso é `subtle`: ele
 * ainda passa em 4,5:1 sobre a superfície, que é o fundo mais claro do tema
 * escuro e portanto o caso difícil.
 *
 * Abaixo dele existe `--co-icon-muted`, e ele não está nesta lista de
 * propósito — é para DESENHO (seta, moldura), nunca para texto.
 */
export const Tons: Story = {
  render: () => (
    <Stack gap={10}>
      <Text>Padrão — o texto que se lê primeiro</Text>
      <Text tone="body">Corpo — o nome do alimento dentro da linha</Text>
      <Text tone="secondary">Secundário — explicação, legenda longa</Text>
      <Text tone="muted">Apagado — metadado, unidade, contagem</Text>
      <Text tone="subtle">Discreto — a conta miúda, o piso de contraste</Text>
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
