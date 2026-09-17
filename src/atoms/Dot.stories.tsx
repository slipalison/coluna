import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./Stack";
import { Text } from "./Text";
import { Dot } from "./Dot";

/**
 * O quadradinho colorido que abre uma linha de macro ou uma legenda de gráfico.
 *
 * Quadrado, e não redondo: pela regra do raio deste sistema ele é **conteúdo**
 * dentro do cartão, e conteúdo não arredonda (ADR-004).
 *
 * Ele sai `aria-hidden` sempre, e isso não é descuido — é o contrato. O ponto
 * nunca é o único sinal: a linha que o usa mostra nome e número ao lado, e o
 * leitor de tela já recebe a informação inteira por ali (ADR-005).
 */
const meta = {
  title: "Átomos/Dot",
  component: Dot,
  args: { tone: "protein" },
  argTypes: {
    tone: { control: "inline-radio", options: ["neutral", "protein", "carb", "fat", "accent", "status"] },
  },
} satisfies Meta<typeof Dot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

/**
 * Os três macros. A cor é fixa por macro e sai de `--co-macro-*`, não do
 * consumidor: proteína precisa ser da mesma cor em todas as telas do
 * aplicativo, e isso não é escolha de quem monta a tela.
 */
export const Macros: Story = {
  render: () => (
    <Stack gap={10}>
      <Stack direction="row" gap={12} align="center">
        <Dot tone="protein" />
        <Text variant="body">Proteína</Text>
        <Text variant="callout" tone="secondary" numeric>
          135 g
        </Text>
      </Stack>
      <Stack direction="row" gap={12} align="center">
        <Dot tone="carb" />
        <Text variant="body">Carboidrato</Text>
        <Text variant="callout" tone="secondary" numeric>
          225 g
        </Text>
      </Stack>
      <Stack direction="row" gap={12} align="center">
        <Dot tone="fat" />
        <Text variant="body">Gordura</Text>
        <Text variant="callout" tone="secondary" numeric>
          53 g
        </Text>
      </Stack>
    </Stack>
  ),
};

/**
 * O que o componente recusa a fazer.
 *
 * À esquerda, a cor sozinha: três pontos e nenhum nome. Quem não distingue
 * ametista de jade de orquídea — 8% dos homens — não lê nada ali. À direita, o
 * mesmo dado com o texto que o ponto só resume.
 */
export const CorNuncaSozinha: Story = {
  name: "Cor nunca sozinha",
  render: () => (
    <Stack direction="row" gap={40}>
      <Stack gap={10}>
        <Text variant="label">Não</Text>
        <Stack direction="row" gap={12} align="center">
          <Dot tone="protein" />
          <Text variant="callout" tone="secondary" numeric>
            135
          </Text>
        </Stack>
        <Stack direction="row" gap={12} align="center">
          <Dot tone="carb" />
          <Text variant="callout" tone="secondary" numeric>
            225
          </Text>
        </Stack>
        <Stack direction="row" gap={12} align="center">
          <Dot tone="fat" />
          <Text variant="callout" tone="secondary" numeric>
            53
          </Text>
        </Stack>
      </Stack>
      <Stack gap={10}>
        <Text variant="label">Sim</Text>
        <Stack direction="row" gap={12} align="center">
          <Dot tone="protein" />
          <Text variant="callout">Proteína</Text>
          <Text variant="callout" tone="secondary" numeric>
            135 g
          </Text>
        </Stack>
        <Stack direction="row" gap={12} align="center">
          <Dot tone="carb" />
          <Text variant="callout">Carboidrato</Text>
          <Text variant="callout" tone="secondary" numeric>
            225 g
          </Text>
        </Stack>
        <Stack direction="row" gap={12} align="center">
          <Dot tone="fat" />
          <Text variant="callout">Gordura</Text>
          <Text variant="callout" tone="secondary" numeric>
            53 g
          </Text>
        </Stack>
      </Stack>
    </Stack>
  ),
};
