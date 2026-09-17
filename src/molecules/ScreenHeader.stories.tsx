import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScreenHeader } from "./ScreenHeader";

/**
 * O título grande de uma tela: serifa de 36px, data embaixo, uma ação à direita.
 *
 * O título é grande porque ele diz **onde** a pessoa está, e num aplicativo que
 * abre sempre na mesma tela isso some rápido se o nome do lugar tiver o mesmo
 * tamanho do resto.
 *
 * Ele não é `position: sticky`: encolher um título de 36 para 17 durante a
 * rolagem é bonito na demonstração e custa um reflow por quadro num aparelho
 * lento.
 */
const meta = {
  title: "Moléculas/ScreenHeader",
  component: ScreenHeader,
  args: { title: "Hoje", subtitle: "quarta, 16 de setembro" },
} satisfies Meta<typeof ScreenHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

/**
 * A ação carrega `aria-label` obrigatório porque ela é só um ícone — e um botão
 * de ícone sem nome é um botão mudo. Uma ação, e uma só: duas já são uma barra
 * de ferramentas, e isso é outro componente.
 */
export const ComAção: Story = {
  name: "Com ação",
  args: {
    action: { icon: "calendar", label: "Dias anteriores", onClick: () => undefined },
  },
};

/** Sem data: a tela que não é de um dia. */
export const SóOTítulo: Story = {
  name: "Só o título",
  args: { title: "Gasto", subtitle: undefined },
};

/**
 * Título de duas linhas. `line-height` de 1,05 na serifa mantém as linhas
 * juntas o bastante para lerem como um bloco.
 */
export const DuasLinhas: Story = {
  name: "Duas linhas",
  args: {
    title: "Quanto você gasta em repouso",
    subtitle: "Sem cadastro. Toda conta fica visível — inclusive as que o app não escolheu.",
  },
};
