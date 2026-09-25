import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { Group } from "./Group";
import { ListRow } from "./ListRow";
import { Ruler } from "./Ruler";

/**
 * Várias estimativas do mesmo número numa escala só, com a faixa entre a menor
 * e a maior pintada: a incerteza desenhada, e não descrita.
 *
 * A marca em destaque muda de **forma** — altura inteira, traço mais grosso —
 * antes de mudar de cor (ADR-005). Os rótulos são HTML, fora do desenho, e
 * chegam já formatados: o sistema não sabe que aquilo é kcal.
 */
const meta = {
  title: "Moléculas/Ruler",
  component: Ruler,
  args: {
    marks: [{ value: 1794, emphasis: true }, { value: 1773 }, { value: 1859 }],
    band: { from: 1773, to: 1859 },
    ticks: [
      { value: 1773, text: "1.773" },
      { value: 1859, text: "1.859" },
    ],
  },
} satisfies Meta<typeof Ruler>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Três fórmulas da taxa basal para a mesma pessoa, a usada marcada. */
export const TrêsFórmulas: Story = {
  name: "Três fórmulas",
  render: (args) => (
    <div style={{ maxWidth: "456px" }}>
      <Ruler {...args} />
    </div>
  ),
};

/** Sem o percentual de gordura, a Katch-McArdle sai da régua — duas marcas, e a faixa entre elas. */
export const DuasFórmulas: Story = {
  name: "Duas fórmulas",
  args: {
    marks: [{ value: 1773, emphasis: true }, { value: 1859 }],
    band: { from: 1773, to: 1859 },
  },
  render: (args) => (
    <div style={{ maxWidth: "456px" }}>
      <Ruler {...args} />
    </div>
  ),
};

/**
 * Grudada na lista que diz cada número em texto, ela sai decorativa: repetir os
 * números para o leitor de tela só dobraria a leitura. É o uso da calculadora
 * no desktop — a régua embaixo das três fórmulas, no mesmo cartão.
 */
export const JuntoDaLista: Story = {
  name: "Junto da lista",
  render: (args) => (
    <div style={{ maxWidth: "500px" }}>
      <Group label="Fórmula da taxa basal" note="A régua é a sua incerteza hoje.">
        <ListRow trailing="1.794">Katch-McArdle</ListRow>
        <ListRow trailing="1.773">Mifflin-St Jeor</ListRow>
        <ListRow trailing="1.859">Harris-Benedict</ListRow>
        <div style={{ padding: "12px 20px" }}>
          <Ruler {...args} />
        </div>
      </Group>
    </div>
  ),
};

/** Com `label`, ela vira uma imagem com nome — e o nome diz o que a régua mostra. */
export const ComNome: Story = {
  name: "Com nome",
  render: (args) => (
    <Stack gap={8} style={{ maxWidth: "456px" }}>
      <Text variant="label" tone="subtle">
        Onde as três fórmulas caem
      </Text>
      <Ruler {...args} label="Três fórmulas, de 1.773 a 1.859 kcal; a usada dá 1.794" />
    </Stack>
  ),
};
