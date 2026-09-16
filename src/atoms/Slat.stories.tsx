import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slat } from "./Slat";
import { Stack } from "./Stack";
import { Text } from "./Text";

const meta = {
  title: "Átomos/Slat",
  component: Slat,
  args: { value: 0.62, size: "md", marker: false, label: "Confiança" },
  argTypes: {
    value: { control: { type: "range", min: -0.5, max: 1.5, step: 0.01 } },
    size: { control: "inline-radio", options: ["md", "sm"] },
  },
} satisfies Meta<typeof Slat>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A barra do sistema, desenhada como colunata basáltica vista de cima. O
 * desenho sai de `repeating-linear-gradient`, e não de um nó por ripa: 24
 * ripas × 3 barras seriam 72 elementos para pintar o que duas regras de CSS
 * pintam.
 *
 * Arraste o valor além de 1 e abaixo de 0 — ela grampeia em vez de recusar.
 */
export const Padrão: Story = {};

export const Tamanhos: Story = {
  render: () => (
    <Stack gap={16}>
      <Stack gap={6}>
        <Text variant="label">md — 10px</Text>
        <Slat value={0.62} label="Proteína" />
      </Stack>
      <Stack gap={6}>
        <Text variant="label">sm — 8px</Text>
        <Slat value={0.62} size="sm" label="Carboidrato" />
      </Stack>
    </Stack>
  ),
};

/**
 * O marcador mostra um PONTO na régua, e não progresso. É a forma de dizer que
 * o gasto de hoje é 62% do que foi medido em você e 38% da fórmula — onde
 * "62%" não é quanto já andou, é onde está entre dois extremos.
 */
export const Marcador: Story = {
  render: () => (
    <Stack gap={8}>
      <Slat value={0.62} marker label="Mistura entre fórmula e medição" />
      <Stack direction="row" justify="space-between">
        <Text variant="caption" tone="muted">
          100% fórmula
        </Text>
        <Text variant="caption" tone="muted">
          100% medido
        </Text>
      </Stack>
    </Stack>
  ),
};

/**
 * Sem `label` a barra sai `aria-hidden`, e isso é deliberado: quase toda barra
 * deste sistema aparece grudada no número que ela ilustra, e anunciar "52 por
 * cento" logo depois de "68 de 135 g" faz o leitor de tela repetir a mesma
 * informação com outras palavras.
 */
export const SemRótuloÉDecorativa: Story = {
  name: "Sem rótulo é decorativa",
  render: () => (
    <Stack gap={16}>
      <Stack gap={6}>
        <Stack direction="row" justify="space-between" align="baseline">
          <Text variant="caption" tone="secondary">
            Proteína
          </Text>
          <Text variant="caption" tone="muted" numeric>
            68 / 135 g
          </Text>
        </Stack>
        <Slat value={0.5} />
      </Stack>
      <Text variant="caption" tone="muted" style={{ maxWidth: "52ch" }}>
        O número ao lado já diz tudo. A barra só ilustra, e por isso fica fora da árvore de
        acessibilidade.
      </Text>
    </Stack>
  ),
};
