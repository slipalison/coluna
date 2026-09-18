import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../atoms/Button";
import { Stack } from "../atoms/Stack";
import { Diff } from "./Diff";
import { Group } from "./Group";
import { SegmentedControl } from "./SegmentedControl";

/**
 * O que muda se a pessoa confirmar.
 *
 * A tela de meta, a de reavaliação e a de ajustes abrem todas do mesmo jeito no
 * desenho: valor de hoje riscado, valor novo em destaque, botão morto enquanto
 * os dois forem iguais.
 *
 * O risco é desenho — `<s>` não é anunciado por leitor de tela nenhum, e a seta
 * seria lida como "seta para a direita". Então o par visível sai `aria-hidden` e
 * no lugar dele vai uma frase inteira: *"meta diária: de 1.677 kcal para 1.540
 * kcal"*. Uma informação, dita uma vez, em cada canal.
 */
const meta = {
  title: "Moléculas/Diff",
  component: Diff,
  args: {
    label: "Meta diária",
    before: "1.677",
    after: "1.540",
    unit: "kcal",
  },
} satisfies Meta<typeof Diff>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {
  render: (args) => (
    <Group>
      <Diff {...args} />
    </Group>
  ),
};

/**
 * Nada mudou — e o bloco **continua na tela**. Um diff que some quando a pessoa
 * volta o valor ao original faz a tela pular por baixo do dedo no meio do
 * ajuste.
 */
export const SemMudança: Story = {
  name: "Sem mudança",
  args: { before: "1.677", after: "1.677" },
  render: (args) => (
    <Group>
      <Diff {...args} />
    </Group>
  ),
};

/**
 * A tela inteira do ajuste de meta: escolha o ritmo e veja o que muda.
 *
 * O botão só acorda quando há diferença — é o diff e o botão dizendo a mesma
 * coisa, um em texto e outro em estado.
 */
export const AjusteDeMeta: Story = {
  name: "Ajuste de meta",
  render: () => {
    const RITMOS = [
      { value: "manter", label: "Manter" },
      { value: "leve", label: "−0,25 kg/sem" },
      { value: "firme", label: "−0,5 kg/sem" },
    ] as const;

    const METAS: Record<(typeof RITMOS)[number]["value"], string> = {
      manter: "2.371",
      leve: "2.096",
      firme: "1.821",
    };

    const [ritmo, definir] = useState<(typeof RITMOS)[number]["value"]>("manter");
    const atual = METAS.manter;
    const novo = METAS[ritmo];

    return (
      <Stack gap={16} style={{ maxWidth: "420px" }}>
        <SegmentedControl label="Ritmo" options={RITMOS} value={ritmo} onChange={definir} />
        <Group>
          <Diff label="Meta diária" before={atual} after={novo} unit="kcal" />
          <Diff
            label="Proteína"
            before="140"
            after={ritmo === "manter" ? "140" : "155"}
            unit="g"
          />
        </Group>
        <Button disabled={novo === atual}>Guardar a meta</Button>
      </Stack>
    );
  },
};
