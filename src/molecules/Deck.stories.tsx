import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../atoms/Button";
import { Stack } from "../atoms/Stack";
import { Surface } from "../atoms/Surface";
import { Text } from "../atoms/Text";
import { Deck } from "./Deck";
import { Tabs } from "./Tabs";

const CARDAPIO = [
  {
    refeicao: "Café da manhã",
    prato: "Tapioca com ovo",
    ingredientes: "Goma de tapioca, dois ovos, sal e um fio de azeite.",
    preparo: "Espalhe a goma na frigideira quente, vire, e recheie com os ovos mexidos.",
    macros: "312 kcal · 14 g de proteína · 38 g de carboidrato · 11 g de gordura",
  },
  {
    refeicao: "Almoço",
    prato: "Arroz, feijão e frango grelhado",
    ingredientes: "Arroz branco, feijão carioca, peito de frango, alho e sal.",
    preparo: "Grelhe o frango temperado com alho e sal; sirva com o arroz e o feijão.",
    macros: "620 kcal · 48 g de proteína · 72 g de carboidrato · 12 g de gordura",
  },
  {
    refeicao: "Lanche",
    prato: "Iogurte com banana",
    ingredientes: "Iogurte natural, uma banana e canela.",
    preparo: "Corte a banana em rodelas sobre o iogurte e polvilhe a canela.",
    macros: "210 kcal · 9 g de proteína · 34 g de carboidrato · 4 g de gordura",
  },
  {
    refeicao: "Jantar",
    prato: "Omelete de legumes",
    ingredientes: "Três ovos, tomate, cebola, espinafre, sal e pimenta.",
    preparo: "Refogue os legumes, junte os ovos batidos e deixe firmar em fogo baixo.",
    macros: "290 kcal · 21 g de proteína · 8 g de carboidrato · 19 g de gordura",
  },
];

function Card({ item }: { item: (typeof CARDAPIO)[number] }) {
  return (
    <Surface padding={16} style={{ height: "340px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <Stack gap={4}>
        <Text variant="label" tone="muted" as="p">
          {item.refeicao}
        </Text>
        <Text variant="headline" as="h3">
          {item.prato}
        </Text>
      </Stack>
      <Tabs
        label={`Receita: ${item.prato}`}
        items={[
          { value: "ingredientes", label: "Ingredientes", content: <Text tone="body">{item.ingredientes}</Text> },
          { value: "preparo", label: "Preparo", content: <Text tone="body">{item.preparo}</Text> },
          { value: "macros", label: "Macros", content: <Text tone="body">{item.macros}</Text> },
        ]}
      />
    </Surface>
  );
}

function Cardapio() {
  const [indice, definir] = useState(0);
  return (
    <Stack gap={12} style={{ maxWidth: "420px" }}>
      <Deck
        label="Cardápio do dia"
        index={indice}
        onIndexChange={definir}
        cardLabel={(i, total) => `${CARDAPIO[i]?.refeicao ?? ""}, ${i + 1} de ${total}`}
      >
        {CARDAPIO.map((item) => (
          <Card key={item.refeicao} item={item} />
        ))}
      </Deck>
      <Text variant="caption" tone="muted">
        na tela: {CARDAPIO[indice]?.refeicao}
      </Text>
    </Stack>
  );
}

/**
 * Cards um de cada vez — o cardápio em cards (slipalison/basalto#120).
 *
 * **Experimente os três caminhos.** Arraste o card para os lados (ele gira de
 * leve e troca depois de 64px; abaixo disso, volta); toque nas setas, que
 * existem porque o gesto sempre tem alternativa; ou foque o card e use as
 * setas do teclado, Home e End. Em toda troca o foco vai para o card novo, e o
 * leitor de tela diz o nome dele: "Almoço, 2 de 4, card".
 *
 * O indicador embaixo marca a vaga cheia com um traço largo e as vazias com um
 * anel — forma, e não só cor. Com `prefers-reduced-motion`, o card não anda
 * com o dedo e nada anima.
 */
const meta = {
  title: "Moléculas/Deck",
  component: Deck,
  args: { label: "Cardápio do dia", children: null },
} satisfies Meta<typeof Deck>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Claro: Story = {
  name: "Cardápio em cards — claro",
  globals: { tema: "light" },
  render: () => <Cardapio />,
};

export const Escuro: Story = {
  name: "Cardápio em cards — escuro",
  globals: { tema: "dark" },
  render: () => <Cardapio />,
};

/**
 * Até 320px, a largura do menor telefone: o card, as abas e as setas cabem sem
 * a página rolar de lado, e o painel de cada aba rola por dentro do card. Para
 * conferir de verdade, abra a história com a janela em 320px (ou 160px, que é
 * 320px com o zoom do navegador em 200%).
 */
export const Em320: Story = {
  name: "Até 320px",
  render: () => (
    <div style={{ maxWidth: "320px" }}>
      <Cardapio />
    </div>
  ),
};

/**
 * Sem `cardLabel`, cada card se chama pela posição ("2 de 3"). Na ponta, a
 * seta apaga e continua com o foco, como a do `Pager`.
 */
export const SoPosicao: Story = {
  name: "Só a posição",
  render: () => (
    <div style={{ maxWidth: "360px" }}>
      <Deck label="Sugestões" defaultIndex={2}>
        {["Trocar o arroz por batata", "Dividir o jantar", "Beber água antes"].map((dica) => (
          <Surface key={dica} padding={16}>
            <Stack gap={12}>
              <Text tone="body">{dica}</Text>
              <Button variant="secondary">Aplicar</Button>
            </Stack>
          </Surface>
        ))}
      </Deck>
    </div>
  ),
};
