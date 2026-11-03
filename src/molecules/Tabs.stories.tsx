import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Stack } from "../atoms/Stack";
import { Surface } from "../atoms/Surface";
import { Text } from "../atoms/Text";
import { Tabs } from "./Tabs";

const PASSOS = Array.from({ length: 10 }, (_, k) => `Passo ${k + 1}: mexa por mais um minuto em fogo baixo.`);

type Aba = "ingredientes" | "preparo" | "macros";

function Receita({ altura = "300px" }: { altura?: string }) {
  const [aba, definir] = useState<Aba>("ingredientes");
  return (
    <Surface padding={16} style={{ height: altura, display: "flex", flexDirection: "column", gap: "12px" }}>
      <Text variant="headline" as="h3">
        Arroz branco
      </Text>
      <Tabs
        label="Receita: arroz branco"
        value={aba}
        onChange={definir}
        items={[
          {
            value: "ingredientes",
            label: "Ingredientes",
            content: <Text tone="body">Uma xícara de arroz, duas de água, alho e sal.</Text>,
          },
          {
            value: "preparo",
            label: "Preparo",
            content: (
              <Stack as="ol" gap={8} style={{ margin: 0, paddingLeft: "20px" }}>
                {PASSOS.map((passo) => (
                  <Text as="li" key={passo} tone="body">
                    {passo}
                  </Text>
                ))}
              </Stack>
            ),
          },
          {
            value: "macros",
            label: "Macros",
            content: <Text tone="body">205 kcal · 4 g de proteína · 45 g de carboidrato · 0 g de gordura</Text>,
          },
        ]}
      />
    </Surface>
  );
}

/**
 * Abas dentro de um card: um painel de cada vez, no mesmo card.
 *
 * **Experimente pelo teclado.** Dê Tab até a fileira e ande com as setas — a
 * fileira custa um Tab só, e a aba focada é a que abre; Home e End vão às
 * pontas. O Tab seguinte entra no painel, que rola por dentro com as setas
 * quando o conteúdo não cabe ("Preparo", aqui). A página nunca rola de lado.
 */
const meta = {
  title: "Moléculas/Tabs",
  component: Tabs,
  args: { label: "Receita", items: [] },
} satisfies Meta<typeof Tabs<Aba>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Claro: Story = {
  name: "No card — claro",
  globals: { tema: "light" },
  render: () => (
    <div style={{ maxWidth: "400px" }}>
      <Receita />
    </div>
  ),
};

export const Escuro: Story = {
  name: "No card — escuro",
  globals: { tema: "dark" },
  render: () => (
    <div style={{ maxWidth: "400px" }}>
      <Receita />
    </div>
  ),
};

/**
 * Até 320px, num card baixo: o painel de "Preparo" rola por dentro, e é uma
 * parada do Tab para rolar pelo teclado. Com o zoom do navegador em 200% (ou a
 * janela em 160px), os nomes das abas rolam de lado dentro da fileira — nada
 * empurra a página.
 */
export const Estreito: Story = {
  name: "Até 320px, painel que rola",
  render: () => (
    <div style={{ maxWidth: "320px" }}>
      <Receita altura="240px" />
    </div>
  ),
};
