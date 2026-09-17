import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../atoms/Button";
import { EmptyState } from "./EmptyState";

/**
 * A região que ainda não tem dado.
 *
 * Não é um `Notice`, e a diferença decide onde cada um entra: o aviso mora
 * **dentro** de uma tela que já tem conteúdo e fala sobre ele; o vazio **é** a
 * tela naquele momento. Um aviso ocupando a área inteira vira alarme; um vazio
 * encaixotado num aviso vira desculpa.
 *
 * Três recusas, todas vindas do desenho do Basalto:
 *
 * - **O texto nunca cobra.** "Nada registrado hoje" é estado; "você ainda não
 *   registrou nada hoje" é dedo na cara pela mesma informação.
 * - **Nada vermelho.** Vazio não é erro — o gasto medido só nasce no 14º dia, e
 *   os treze primeiros são o produto funcionando como prometido.
 * - **Uma ação, no máximo.** Duas ações numa tela sem conteúdo é um menu
 *   disfarçado de convite.
 */
const meta = {
  title: "Moléculas/EmptyState",
  component: EmptyState,
  args: {
    icon: "utensils",
    title: "Nada registrado hoje",
    children: "O dia começa em branco e fecha com o que você anotar nele.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

/** Com a ação que tira a tela daqui. Uma só. */
export const ComAção: Story = {
  name: "Com ação",
  args: {
    action: <Button>Registrar a primeira refeição</Button>,
  },
};

/**
 * O vazio que é o produto funcionando: o gasto medido precisa de 14 dias de
 * registro para existir, e dizer isso é melhor que mostrar um número inventado.
 */
export const AindaNãoDáParaSaber: Story = {
  name: "Ainda não dá para saber",
  args: {
    icon: "chart",
    title: "O gasto medido começa no 14º dia",
    children:
      "Faltam 11 dias de registro. Até lá a conta usa a estimativa da fórmula — ela aparece no lugar deste número.",
    action: undefined,
  },
};

/** Sem rede. Estado, não falha: o que já foi registrado continua na tela. */
export const SemRede: Story = {
  name: "Sem rede",
  args: {
    icon: "offline",
    title: "Sem rede agora",
    children: "O registro fica guardado no aparelho e sobe sozinho quando a conexão voltar.",
    action: undefined,
  },
};
