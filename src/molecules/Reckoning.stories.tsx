import type { Meta, StoryObj } from "@storybook/react-vite";
import { Surface } from "../atoms/Surface";
import { Reckoning } from "./Reckoning";

/**
 * A conta aberta.
 *
 * Este componente carrega a premissa do produto inteiro — a pessoa informa, o
 * app calcula — e a carrega como **desenho**, não como frase na tela de ajuda.
 * Cada parcela numa linha, a expressão que a produziu embaixo do rótulo, e o
 * resultado separado por um fio, do jeito que uma conta no papel termina.
 *
 * Um número grande sozinho é um veredito, e veredito é o que este produto
 * existe para não dar. A mesma conta aberta é um argumento que dá para
 * conferir na calculadora do celular.
 */
const meta = {
  title: "Moléculas/Reckoning",
  component: Reckoning,
  args: {
    lines: [
      { label: "Meta do dia", value: "1.917" },
      { label: "Alimentos registrados", value: "− 922" },
      { label: "Restante", value: "995", total: true },
    ],
  },
} satisfies Meta<typeof Reckoning>;

export default meta;
type Story = StoryObj<typeof meta>;

/** O que o diário mostra embaixo do número grande. 1.917 − 922 = 995. */
export const NoDiário: Story = {
  name: "No diário",
  render: () => (
    <Surface padding={20}>
      <Reckoning
        lines={[
          { label: "Meta do dia", value: "1.917" },
          { label: "Alimentos registrados", value: "− 922" },
          { label: "Restante", value: "995", total: true },
        ]}
        note="A conta fica aberta de propósito: o número grande é o resultado dela, e não um veredito sobre o seu dia."
      />
    </Surface>
  ),
};

/**
 * Do repouso até a meta, em três degraus. Cada linha mostra a operação que
 * produziu o próximo número, então dá para acompanhar de cima a baixo sem
 * precisar acreditar em nenhum deles.
 */
export const DoRepousoAtéAMeta: Story = {
  name: "Do repouso até a meta",
  render: () => (
    <Surface padding={20}>
      <Reckoning
        lines={[
          { label: "Taxa basal", expression: "370 + 21,6 × 65,91", value: "1.794" },
          { label: "Gasto total", expression: "1.794 × 1,375 (pouco ativo)", value: "2.467" },
          { label: "Meta do dia", expression: "2.467 − 550 (0,5 kg por semana)", value: "1.917", total: true },
        ]}
      />
    </Surface>
  ),
};

/**
 * O caso que obriga a expressão a mostrar a casa decimal.
 *
 * `1.433 + 937 = 2.371` não fecha para quem confere; `1.433,4 + 937,5 =
 * 2.370,9 → 2.371` fecha. Num app cujo diferencial é admitir o que não sabe,
 * mentir no arredondamento seria o pior lugar para começar.
 */
export const OArredondamentoAparece: Story = {
  name: "O arredondamento aparece",
  render: () => (
    <Surface padding={20}>
      <Reckoning
        lines={[
          { label: "Fórmula", expression: "2.312 × 62%", value: "1.433,4" },
          { label: "Medido", expression: "2.467 × 38%", value: "937,5" },
          { label: "Gasto de hoje", expression: "2.370,9 arredondado", value: "2.371", total: true },
        ]}
        note="A soma é 2.370,9, e é ela que aparece antes do arredondamento — esconder a casa decimal daria uma conta que não fecha na calculadora de quem confere."
      />
    </Surface>
  ),
};
