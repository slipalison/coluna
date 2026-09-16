import type { Meta, StoryObj } from "@storybook/react-vite";
import { Divider } from "./Divider";
import { Grid } from "./Grid";
import { Stack } from "./Stack";
import { Surface } from "./Surface";
import { Text } from "./Text";

/**
 * As primitivas de layout: `Stack`, `Grid`, `Surface` e `Divider`.
 *
 * Elas não têm variante nem estado — o que elas carregam é uma regra: todo
 * grupo de irmãos se espaça por `gap`, e nunca por margem no filho. Espaço
 * feito de margem some quando alguém reordena, remove ou duplica um item.
 */
const meta = {
  title: "Fundamentos/Layout",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Bloco({ texto }: { texto: string }) {
  return (
    <Surface elevation="raised" bordered padding={12}>
      <Text variant="caption">{texto}</Text>
    </Surface>
  );
}

export const StackEmColuna: Story = {
  name: "Stack — coluna",
  render: () => (
    <Stack gap={12}>
      <Bloco texto="Café da manhã · 479 kcal" />
      <Bloco texto="Almoço · 671 kcal" />
      <Bloco texto="Lanche · 288 kcal" />
      <Bloco texto="Jantar · 479 kcal" />
    </Stack>
  ),
};

export const StackEmLinha: Story = {
  name: "Stack — linha",
  render: () => (
    <Stack direction="row" gap={12} wrap align="center">
      <Bloco texto="Padrão" />
      <Bloco texto="Baixa em carbo" />
      <Bloco texto="Cetogênica" />
      <Bloco texto="Alta em carbo" />
    </Stack>
  ),
};

/**
 * `minmax(0, 1fr)` e não `1fr`: o padrão de uma trilha de grade é `auto`, que
 * **não** encolhe abaixo do conteúdo. Com `1fr` puro, um nome de alimento
 * comprido empurra a coluna e estoura a grade para fora da tela — e o defeito
 * só aparece com o dado real, nunca com "Lorem ipsum".
 */
export const GridQueNãoEstoura: Story = {
  name: "Grid que não estoura",
  render: () => (
    <Grid columns={3} gap={12}>
      <Bloco texto="Arroz" />
      <Bloco texto="Salada de folhas com azeite e um nome exageradamente comprido" />
      <Bloco texto="Feijão" />
    </Grid>
  ),
};

export const GridComTrilhasExplícitas: Story = {
  name: "Grid — trilhas explícitas",
  render: () => (
    <Grid template="236px minmax(0, 1fr)" gap={16} align="start">
      <Bloco texto="lateral · 236px" />
      <Bloco texto="conteúdo · o que sobrar" />
    </Grid>
  ),
};

/**
 * Três degraus de superfície, e três bastam: o quarto vira decoração e ninguém
 * sabe mais o que está na frente do quê.
 */
export const Superfícies: Story = {
  render: () => (
    <Stack gap={12}>
      <Surface bordered padding={16}>
        <Text variant="caption">flat — o cartão comum</Text>
      </Surface>
      <Surface elevation="raised" bordered padding={16}>
        <Text variant="caption">raised — um controle dentro do cartão</Text>
      </Surface>
      <Surface elevation="sunken" bordered padding={16}>
        <Text variant="caption">sunken — um campo dentro dele</Text>
      </Surface>
      <Divider />
      <Surface grain bordered padding={16}>
        <Text variant="caption">com grão vulcânico — cabe na tela de fundo, não em cada cartão</Text>
      </Surface>
    </Stack>
  ),
};
