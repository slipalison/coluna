import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { Disclosure } from "./Disclosure";

/**
 * A explicação que fica guardada até alguém pedir.
 *
 * Ela existe por causa de um defeito medido no desenho: quase todo cartão
 * terminava se explicando em letra miúda. Cada frase, isolada, era boa; juntas
 * viravam um professor que não para de falar. A regra que saiu dali:
 *
 * > **Uma explicação por tela, não por cartão.** A que justifica uma decisão de
 * > produto com a qual a pessoa pode discordar fica visível. O resto vem para
 * > cá. E se a frase explica algo que a tela já mostra, ela não precisa existir
 * > nem aberta nem fechada.
 *
 * É `<details>`/`<summary>` do navegador, e não um acordeão escrito à mão: o
 * elemento nativo já vem com estado, teclado, anúncio no leitor de tela, busca
 * da página encontrando o texto fechado e impressão abrindo tudo.
 */
const meta = {
  title: "Moléculas/Disclosure",
  component: Disclosure,
  args: {
    children:
      "O gasto medido nasce da sua própria conta: a média de energia registrada menos a variação de peso convertida em caloria (7.700 kcal por quilo, dividido por sete). Por isso ele só aparece no 14º dia — antes disso a variação ainda é água.",
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {
  render: (args) => (
    <div style={{ maxWidth: "360px" }}>
      <Disclosure {...args} />
    </div>
  ),
};

/** Já aberta, para a tela que ensina uma vez e depois se cala. */
export const Aberta: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <div style={{ maxWidth: "360px" }}>
      <Disclosure {...args} />
    </div>
  ),
};

/** O convite pode ser outro quando "por quê?" não é a pergunta. */
export const OutroConvite: Story = {
  name: "Outro convite",
  args: {
    summary: "como esta conta é feita",
    defaultOpen: false,
  },
  render: (args) => (
    <div style={{ maxWidth: "360px" }}>
      <Disclosure {...args} />
    </div>
  ),
};

/**
 * O antes e o depois, lado a lado.
 *
 * À esquerda, o cartão como era: o número, e embaixo três linhas de letra miúda
 * que ninguém pediu. À direita, o mesmo cartão com a regra aplicada — o número,
 * a frase que justifica a decisão, e o resto atrás do convite.
 */
export const OQueMudou: Story = {
  name: "O que mudou",
  render: () => (
    <Stack direction="row" gap={16} wrap align="flex-start">
      <Stack
        gap={8}
        style={{
          width: "300px",
          padding: "20px",
          background: "var(--co-surface)",
          borderRadius: "var(--co-radius-container)",
        }}
      >
        <Text variant="label" tone="subtle">
          Antes
        </Text>
        <Text variant="numeral">2.371</Text>
        <Text variant="footnote" tone="muted">
          Seu gasto medido sai da média de energia dos últimos 14 dias menos a variação de peso
          convertida em caloria. A conversão usa 7.700 kcal por quilo. O valor substitui a estimativa
          da fórmula a partir do 14º dia. Antes disso a variação de peso ainda é água e não sustenta
          conclusão.
        </Text>
      </Stack>

      <Stack
        gap={8}
        style={{
          width: "300px",
          padding: "20px",
          background: "var(--co-surface)",
          borderRadius: "var(--co-radius-container)",
        }}
      >
        <Text variant="label" tone="subtle">
          Depois
        </Text>
        <Text variant="numeral">2.371</Text>
        <Text variant="footnote" tone="muted">
          Medido na sua conta, não estimado por fórmula.
        </Text>
        <Disclosure>
          A média de energia dos últimos 14 dias menos a variação de peso convertida em caloria —
          7.700 kcal por quilo. Antes do 14º dia a variação ainda é água.
        </Disclosure>
      </Stack>
    </Stack>
  ),
};
