import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { MacroBar } from "./MacroBar";

/**
 * Nome, quanto de quanto, e a ripa.
 *
 * A barra **não** é grampeada em 100% por acidente: passar do alvo é
 * informação, não falha. O componente mostra o excedente pelo número ao lado,
 * e não muda de cor para vermelho — este sistema não repreende quem comeu mais
 * do que planejou.
 */
const meta = {
  title: "Moléculas/MacroBar",
  component: MacroBar,
  args: { name: "Proteína", value: 68, target: 135, unit: "g", size: "md" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 200, step: 1 } },
    target: { control: { type: "range", min: 0, max: 300, step: 1 } },
    size: { control: "inline-radio", options: ["md", "sm"] },
  },
} satisfies Meta<typeof MacroBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

/**
 * Os três macros do dia, como aparecem no diário. Os números fecham: 68×4 +
 * 95×4 + 30×9 = 922 kcal consumidos, contra a meta de 1.917.
 */
export const OsTrêsMacros: Story = {
  name: "Os três macros",
  render: () => (
    <Stack gap={14}>
      <MacroBar name="Proteína" value={68} target={135} />
      <MacroBar name="Carboidrato" value={95} target={225} />
      <MacroBar name="Gordura" value={30} target={53} />
    </Stack>
  ),
};

/**
 * Arraste `value` além do alvo no painel de controles. A ripa satura, o número
 * continua contando a verdade, e nada fica vermelho.
 */
export const AcimaDoAlvo: Story = {
  name: "Acima do alvo",
  render: () => (
    <Stack gap={14}>
      <MacroBar name="Proteína" value={150} target={135} />
      <Text variant="caption" tone="muted" style={{ maxWidth: "52ch" }}>
        150 de 135 g. O desenho não tem para onde crescer, então ele para; o texto não para, porque
        é ele que carrega o fato.
      </Text>
    </Stack>
  ),
};

/**
 * Alvo zero não divide por zero e não mostra `NaN` — o caso aparece de verdade
 * quando ainda não há meta vigente.
 */
export const SemAlvo: Story = {
  name: "Sem alvo",
  args: { name: "Carboidrato", value: 95, target: 0 },
};
