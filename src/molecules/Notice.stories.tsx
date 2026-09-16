import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { Notice } from "./Notice";

/**
 * Aviso.
 *
 * Este componente **não tem variante de erro**, não tem fundo vermelho e não
 * exige ser fechado — e isso é decisão de produto, não lacuna. Aqui aviso
 * INFORMA, nunca bloqueia: quando um número sai do que a literatura sustenta,
 * o app diz o que mudou e por quê, e depois registra a escolha da pessoa do
 * mesmo jeito.
 *
 * Erro de verdade — entrada sem significado — não é um aviso: é uma mensagem
 * junto do campo que a produziu, e isso pertence ao aplicativo.
 */
const meta = {
  title: "Moléculas/Notice",
  component: Notice,
  args: {
    title: "Ritmo ajustado",
    children:
      "O ritmo pedido (1,20 kg/semana) excede 1% do peso corporal. A conta usou 0,85 kg/semana. Você continua livre para registrar o que quiser.",
    tone: "accent",
    live: "polite",
  },
  argTypes: {
    tone: { control: "inline-radio", options: ["accent", "status"] },
    live: { control: "inline-radio", options: ["polite", "off"] },
  },
} satisfies Meta<typeof Notice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

export const Neutro: Story = {
  args: {
    tone: "status",
    live: "off",
    title: "Sem rede",
    children: "Este registro entra na fila e sobe sozinho quando você voltar.",
  },
};

/**
 * Três avisos reais do produto, lado a lado. Repare no que eles têm em comum:
 * cada um mostra a conta, diz o que foi aplicado, e devolve a decisão para a
 * pessoa. Nenhum impede nada.
 */
export const ComoOProdutoFala: Story = {
  name: "Como o produto fala",
  render: () => (
    <Stack gap={12}>
      <Notice title="Ritmo ajustado">
        O ritmo pedido (1,20 kg/semana) excede 1% do peso corporal. A conta usou 0,85 kg/semana.
        Você continua livre para registrar o que quiser.
      </Notice>
      <Notice title="Limitado pela sua taxa basal">
        Esse ritmo pediria menos de 1.794 kcal. O Basalto não sugere meta abaixo da taxa basal — é
        limite do que o app propõe, não do que você pode fazer.
      </Notice>
      <Notice title="Abaixo do limiar por refeição">
        27 g por refeição fica abaixo dos 34 g que disparam o estímulo. Nada aqui impede a escolha —
        o total do dia segue igual.
      </Notice>
      <Text variant="caption" tone="muted" style={{ maxWidth: "58ch" }}>
        Nenhum deles usa vermelho, nenhum tem botão obrigatório, e nenhum marca o dia como falha.
      </Text>
    </Stack>
  ),
};
