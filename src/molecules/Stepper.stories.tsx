import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { Stepper } from "./Stepper";

/**
 * Menos, número, mais.
 *
 * Os botões têm 46px e não 44 porque andam em par colado: com o alvo no limite
 * exato, o dedo que erra por dois pixels aperta o outro — e aqui o outro faz o
 * contrário do que a pessoa queria.
 *
 * O número é um `output` com `aria-live="polite"`: quem usa leitor de tela
 * aperta "mais" e ouve o valor novo, sem precisar sair do botão e voltar.
 */
const meta = {
  title: "Moléculas/Stepper",
  component: Stepper,
  args: { label: "porções", value: 4, onChange: () => {}, min: 1, max: 6 },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Porções: Story = {
  render: () => {
    const [valor, definir] = useState(1);
    return (
      <Stack gap={12}>
        <Stepper label="porções" value={valor} onChange={definir} min={1} max={6} />
        <Text variant="caption" tone="muted" numeric>
          {valor * 347} kcal · {valor * 20} g de proteína
        </Text>
      </Stack>
    );
  },
};

/**
 * O piso e o teto desabilitam o botão em vez de ignorar o toque. Um botão que
 * aceita o clique e não faz nada é indistinguível de um botão quebrado.
 */
export const NoPisoENoTeto: Story = {
  name: "No piso e no teto",
  render: () => (
    <Stack gap={16}>
      <Stepper label="porções" value={1} onChange={() => {}} min={1} max={6} />
      <Stepper label="porções" value={6} onChange={() => {}} min={1} max={6} />
    </Stack>
  ),
};

/**
 * `format` muda só o que aparece; `value` continua sendo o número cru, e é ele
 * que volta no `onChange`.
 */
export const ComUnidade: Story = {
  name: "Com unidade",
  render: () => {
    const [gramas, definir] = useState(100);
    return (
      <Stack gap={12}>
        <Stepper
          label="gramas"
          value={gramas}
          onChange={definir}
          min={10}
          step={10}
          format={(n) => `${n} g`}
        />
        <Text variant="caption" tone="muted" numeric>
          arroz, branco, cozido — {Math.round((gramas * 128) / 100)} kcal
        </Text>
      </Stack>
    );
  },
};
