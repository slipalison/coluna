import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../atoms/Text";
import { Group } from "./Group";
import { MacroBar } from "./MacroBar";

/**
 * Ponto, nome e número — os três, sempre. A barra é opcional; o texto não é.
 *
 * É aqui que a regra "cor nunca sozinha" vira código (ADR-005). O ponto
 * colorido é um atalho para quem lê a tela de relance, e nunca carrega a
 * informação sozinho — o nome do macro e a quantidade estão do lado, em texto.
 *
 * A barra **não** é grampeada em 100% por acidente: passar do alvo é
 * informação, não falha. O desenho satura, o número ao lado continua contando
 * a verdade, e nada fica vermelho — este sistema não repreende quem comeu mais
 * do que planejou.
 */
const meta = {
  title: "Moléculas/MacroBar",
  component: MacroBar,
  args: { name: "Proteína", value: 68, target: 135, unit: "g", kind: "protein", bar: true },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 200, step: 1 } },
    target: { control: { type: "range", min: 0, max: 300, step: 1 } },
    kind: { control: "inline-radio", options: ["protein", "carb", "fat"] },
  },
} satisfies Meta<typeof MacroBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

/**
 * Os três macros do dia, como aparecem no diário. Os números fecham: 68×4 +
 * 95×4 + 30×9 = 922 kcal consumidos, contra a meta de 1.917.
 *
 * O fio entre as linhas recua até depois do ponto (`inset="dot"`).
 */
export const OsTrêsMacros: Story = {
  name: "Os três macros",
  render: () => (
    <Group label="Macros" inset="dot">
      <MacroBar name="Proteína" value={68} target={135} kind="protein" />
      <MacroBar name="Carboidrato" value={95} target={225} kind="carb" />
      <MacroBar name="Gordura" value={30} target={53} kind="fat" />
    </Group>
  ),
};

/**
 * Sem barra: a lista de macros da meta, onde não há progresso a mostrar porque
 * ainda não se comeu nada. Ponto, nome e número continuam.
 */
export const SemBarra: Story = {
  name: "Sem barra",
  render: () => (
    <Group label="Macros da meta" inset="dot">
      <MacroBar name="Proteína" value={135} target={135} kind="protein" bar={false} />
      <MacroBar name="Carboidrato" value={225} target={225} kind="carb" bar={false} />
      <MacroBar name="Gordura" value={53} target={53} kind="fat" bar={false} />
    </Group>
  ),
};

/**
 * Arraste `value` além do alvo no painel de controles. A barra satura, o
 * número continua contando a verdade, e nada fica vermelho.
 */
export const AcimaDoAlvo: Story = {
  name: "Acima do alvo",
  render: () => (
    <Group
      inset="dot"
      note="150 de 135 g. O desenho não tem para onde crescer, então ele para; o texto não para, porque é ele que carrega o fato."
    >
      <MacroBar name="Proteína" value={150} target={135} kind="protein" />
    </Group>
  ),
};

/**
 * Alvo zero não divide por zero e não mostra `NaN` — o caso aparece de verdade
 * quando ainda não há meta vigente.
 */
export const SemAlvo: Story = {
  name: "Sem alvo",
  render: () => (
    <Group inset="dot">
      <MacroBar name="Carboidrato" value={95} target={0} kind="carb" />
      <Text
        variant="caption"
        tone="subtle"
        style={{ padding: "0 20px 14px" }}
      >
        Sem meta vigente a barra fica vazia — e não some, porque a linha ainda
        precisa dizer quanto entrou.
      </Text>
    </Group>
  ),
};
