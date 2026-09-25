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
    layout: { control: "inline-radio", options: ["stacked", "inline"] },
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

/**
 * Em linha, para a coluna larga do desktop: ponto, nome, barra, número — uma
 * linha só. Empilhada, a barra viraria um fio de 500px com o número perdido na
 * outra ponta; em linha, as três barras começam e terminam nos mesmos pontos,
 * e a comparação entre elas é o que se lê primeiro.
 *
 * As colunas se alinham porque o `Group` escreve UMA vez a largura do nome e a
 * do número, e as linhas herdam.
 */
export const EmLinha: Story = {
  name: "Em linha",
  render: () => (
    <div style={{ maxWidth: "560px" }}>
      <Group
        label="Contra o alvo do dia"
        inset="dot"
        style={{ ["--co-macro-figure-width" as string]: "128px" }}
      >
        <MacroBar name="Proteína" value={130} target={135} kind="protein" layout="inline" />
        <MacroBar name="Carboidrato" value={218} target={225} kind="carb" layout="inline" />
        <MacroBar name="Gordura" value={51} target={53} kind="fat" layout="inline" />
      </Group>
    </div>
  ),
};

/**
 * As macros da meta, com a conta embaixo de cada número. Aqui a barra mostra
 * a FATIA da energia do dia (`value` e `target` em kcal) e o número mostra os
 * gramas (`valueText`) — "135 g" com a barra em 28%. A `expression` é a mesma
 * da conta aberta: 135 × 4 = 540, e 540 + 900 + 477 = 1.917.
 */
export const MacrosDaMeta: Story = {
  name: "Macros da meta",
  render: () => (
    <div style={{ maxWidth: "560px" }}>
      <Group label="Macros da meta" labelTrailing="estratégia padrão" inset="dot">
        <MacroBar
          name="Proteína"
          value={540}
          target={1917}
          kind="protein"
          layout="inline"
          valueText="135 g"
          expression="135 × 4 = 540"
        />
        <MacroBar
          name="Carboidrato"
          value={900}
          target={1917}
          kind="carb"
          layout="inline"
          valueText="225 g"
          expression="225 × 4 = 900"
        />
        <MacroBar
          name="Gordura"
          value={477}
          target={1917}
          kind="fat"
          layout="inline"
          valueText="53 g"
          expression="53 × 9 = 477"
        />
      </Group>
    </div>
  ),
};
