import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "../atoms/Grid";
import { Stack } from "../atoms/Stack";
import { Surface } from "../atoms/Surface";
import { Text } from "../atoms/Text";
import { Stat } from "./Stat";

/**
 * Rótulo, número e explicação — nesta ordem, e sempre com a explicação.
 *
 * A `caption` é opcional na assinatura e obrigatória na prática: um número
 * grande sem procedência é exatamente o que este produto existe para não
 * fazer. Quando não há o que dizer, o número provavelmente não merece ser
 * grande.
 */
const meta = {
  title: "Moléculas/Stat",
  component: Stat,
  args: {
    label: "Restante hoje",
    value: "995",
    unit: "kcal",
    caption: "de 1.917 kcal · a meta de hoje",
    size: "lg",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["hero", "lg", "md"] },
  },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

export const Tamanhos: Story = {
  render: () => (
    <Stack gap={32}>
      <Stat label="Restante hoje" value="995" unit="kcal" caption="hero — um por tela" size="hero" />
      <Stat label="Gasto adaptativo" value="2.371" unit="kcal" caption="lg — o número de um cartão" />
      <Stat label="Média dos 6 dias fechados" value="1.896" unit="kcal" caption="md — dentro de uma grade" size="md" />
    </Stack>
  ),
};

/**
 * A `caption` é onde mora a honestidade do número: de onde ele veio, qual o
 * alvo, e o que ainda falta para ele ficar confiável. Compare os dois cartões
 * — o mesmo componente, e só um deles merece confiança.
 */
export const AProcedênciaÉOPonto: Story = {
  name: "A procedência é o ponto",
  render: () => (
    <Grid columns={2} gap={16}>
      <Surface bordered padding={20}>
        <Stat
          label="Gasto de hoje"
          value="2.467"
          unit="kcal"
          caption="pela fórmula · 3 dias de registro, são necessários 14"
        />
      </Surface>
      <Surface bordered padding={20}>
        <Stat
          label="Gasto de hoje"
          value="2.371"
          unit="kcal"
          caption="62% medido em você · 21 dias de peso e registro"
        />
      </Surface>
      <Text variant="caption" tone="muted" style={{ gridColumn: "1 / -1", maxWidth: "58ch" }}>
        O da esquerda é uma estimativa, e a legenda diz isso em vez de deixar o número fingir
        certeza. É a mesma razão pela qual 0% de confiança aparece escrito: não saber ainda é um
        estado legítimo.
      </Text>
    </Grid>
  ),
};
