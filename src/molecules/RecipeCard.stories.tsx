import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "../atoms/Grid";
import { Stack } from "../atoms/Stack";
import { RecipeCard } from "./RecipeCard";

/**
 * O cartão de receita do livro: o prato mini, o título, as kcal da proporção
 * base, o tempo total e a origem.
 *
 * O cartão inteiro é o alvo (pelo menos 44 px no toque): o link mora no
 * título, e uma camada dele cobre o cartão. O leitor de tela ouve o título
 * como o nome do link, e o resto continua texto. O prato mini nunca vem sem a
 * legenda.
 */
const meta = {
  title: "Moléculas/RecipeCard",
  component: RecipeCard,
  args: {
    title: "Frango com arroz e brócolis",
    href: "#receita--frango",
    kcal: "520",
    time: "35 min",
    origin: "À mão",
    slices: [
      { group: "protein", fraction: 0.35, label: "Frango · 150 g" },
      { group: "carb", fraction: 0.35, label: "Arroz · 120 g" },
      { group: "veg", fraction: 0.25, label: "Brócolis · 80 g" },
      { group: "fat", fraction: 0.05, label: "Azeite · 5 g" },
    ],
  },
} satisfies Meta<typeof RecipeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

/** Sem link: o cartão abre por ação (`onSelect`), e o título vira um botão. */
export const ComoBotão: Story = {
  name: "Como botão",
  args: { href: undefined, onSelect: () => {} },
};

/**
 * O livro no celular: os cartões em coluna, todos iguais (Similaridade), com
 * um título comprido que quebra em vez de vazar.
 */
export const OLivro: Story = {
  name: "O livro, no celular",
  render: (args) => (
    <div style={{ maxWidth: "390px" }}>
      <Stack gap={12}>
        <RecipeCard {...args} />
        <RecipeCard
          title="Omelete de espinafre com queijo minas e tomate"
          href="#receita--omelete"
          kcal="320"
          time="10 min"
          origin="Com a IA"
          slices={[
            { group: "protein", fraction: 0.4, label: "Ovo · 100 g" },
            { group: "veg", fraction: 0.3, label: "Espinafre · 60 g" },
            { group: "dairy", fraction: 0.2, label: "Queijo · 30 g" },
          ]}
        />
        <RecipeCard
          title="Iogurte com banana e aveia"
          href="#receita--iogurte"
          kcal="1.020"
          time="5 min"
          origin="À mão"
          slices={[
            { group: "dairy", fraction: 0.4, label: "Iogurte · 170 g" },
            { group: "fruit", fraction: 0.35, label: "Banana · 100 g" },
            { group: "carb", fraction: 0.25, label: "Aveia · 30 g" },
          ]}
        />
      </Stack>
    </div>
  ),
};

/** No desktop, em grade de 2 colunas. */
export const EmGrade: Story = {
  name: "Em grade, no desktop",
  render: (args) => (
    <div style={{ maxWidth: "760px" }}>
      <Grid columns={2} gap={16}>
        <RecipeCard {...args} />
        <RecipeCard {...args} title="Arroz, feijão e bife" href="#receita--pf" kcal="640" time="45 min" />
      </Grid>
    </div>
  ),
};

/** A 320 px: o título quebra, a legenda quebra, e nada rola de lado. */
export const Em320px: Story = {
  name: "A 320 px",
  render: (args) => (
    <div style={{ width: "288px" }}>
      <RecipeCard {...args} />
    </div>
  ),
};
