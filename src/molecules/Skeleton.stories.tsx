import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./Skeleton";

/**
 * O esqueleto de carregamento, com o prato.
 *
 * Desenha a forma do que vem, para a tela não pular. É um estado pronto: o
 * rótulo é anunciado uma vez (`role="status"`), e as peças saem
 * `aria-hidden`. O pulso é só de opacidade e acaba em 4,2 s; com
 * `prefers-reduced-motion`, nasce parado.
 */
const meta = {
  title: "Moléculas/Skeleton",
  component: Skeleton,
  args: { label: "Carregando receitas", shape: "recipe-card", count: 3 },
  argTypes: {
    shape: { control: "inline-radio", options: ["recipe-card", "plate", "line"] },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** O livro carregando: três cartões, cada um com o prato mini vazio. */
export const OLivroCarregando: Story = {
  name: "O livro carregando",
  render: (args) => (
    <div style={{ maxWidth: "390px" }}>
      <Skeleton {...args} />
    </div>
  ),
};

/** A receita aberta carregando: o prato grande, com as colunas vazias. */
export const OPrato: Story = {
  name: "O prato",
  args: { shape: "plate", count: 1, label: "Carregando a receita" },
};

/** Linhas de texto. */
export const Linhas: Story = {
  args: { shape: "line", count: 3, label: "Carregando o modo de preparo" },
};
