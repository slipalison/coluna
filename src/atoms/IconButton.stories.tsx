import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { SearchField } from "./SearchField";
import { Stack } from "./Stack";

/**
 * O botão que é só um ícone.
 *
 * Ele é peça própria, e não um `Button` sem texto, por causa do **nome**: um
 * botão de desenho sem rótulo compila, aparece certo e sai mudo para o leitor
 * de tela. Aqui `label` é obrigatório no tipo, e vira o `aria-label` e a dica
 * do mouse ao mesmo tempo.
 *
 * Quadrado, e com o mesmo piso de 44px do `Button` (ADR-003). O `lg` tem os
 * 52px do `Button size="lg"`, para os dois ficarem da mesma altura lado a lado.
 */
const meta = {
  title: "Átomos/IconButton",
  component: IconButton,
  args: {
    icon: "barcode",
    label: "Ler código de barras",
    size: "md",
    variant: "surface",
    tone: "neutral",
    disabled: false,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    variant: { control: "inline-radio", options: ["surface", "ghost"] },
    tone: { control: "inline-radio", options: ["neutral", "accent"] },
    icon: { control: "select", options: ["barcode", "bookmark", "plus", "calendar", "download", "gear"] },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

/**
 * Ao lado da busca, na altura dela: a leitura do código de barras é a outra
 * porta para o mesmo registro, e por isso fica no acento — ela é uma oferta.
 */
export const AoLadoDaBusca: Story = {
  name: "Ao lado da busca",
  render: () => (
    <Stack direction="row" gap={10} style={{ maxWidth: "420px" }}>
      <SearchField label="Buscar alimento" placeholder="Buscar alimento" full />
      <IconButton icon="barcode" label="Ler código de barras" tone="accent" />
    </Stack>
  ),
};

/**
 * Ligado e desligado: "Salvar nos favoritos". Ligado muda de cor **e** de
 * fundo, e ganha `aria-pressed="true"` — o traço do ícone não tem como encher,
 * então a cor sozinha seria o único sinal (ADR-005).
 *
 * O `lg` fica da altura do "Registrar" ao lado, que é onde ele mora no desenho.
 */
export const Favorito: Story = {
  render: () => {
    const [salvo, definir] = useState(false);
    return (
      <Stack direction="row" gap={10} style={{ maxWidth: "386px" }}>
        <Button size="lg" icon="check" full>
          Registrar
        </Button>
        <IconButton
          icon="bookmark"
          label="Salvar nos favoritos"
          size="lg"
          pressed={salvo}
          onClick={() => definir((atual) => !atual)}
        />
      </Stack>
    );
  },
};

/**
 * Sem caixa: o ícone que mora num cabeçalho de coluna, onde o fundo já é o do
 * lugar — "Nova receita" no alto da lista.
 */
export const Fantasma: Story = {
  render: () => (
    <Stack direction="row" gap={8}>
      <IconButton icon="plus" label="Nova receita" variant="ghost" tone="accent" />
      <IconButton icon="calendar" label="Dias anteriores" variant="ghost" />
      <IconButton icon="download" label="Baixar os dados" variant="ghost" />
    </Stack>
  ),
};
