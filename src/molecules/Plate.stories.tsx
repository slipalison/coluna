import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../atoms/Button";
import { Stack } from "../atoms/Stack";
import { Plate, type PlateSlice } from "./Plate";

/**
 * O prato de colunas: a imagem de toda receita, nunca uma foto.
 *
 * 37 colunas hexagonais vistas de cima, que se completam exatamente quando a
 * receita fecha o alvo da refeição. Cada célula tem a cor do grupo do
 * alimento, todos com a mesma luminosidade.
 *
 * O prato **recebe a composição pronta** (grupo, fração e rótulo com os
 * gramas) e não calcula nada. A legenda em texto vem **sempre** junto, e o
 * `summary` (obrigatório) diz quanto do alvo o prato fecha: a cor nunca é o
 * único sinal (ADR-005), e o desenho sai `aria-hidden`.
 *
 * Os seis grupos têm luminâncias distintas (em cinza, um setor não se funde ao
 * vizinho), e a célula vazia tem contorno de controle.
 */
const ALMOCO: PlateSlice[] = [
  { group: "protein", fraction: 0.3, label: "Frango · 150 g" },
  { group: "carb", fraction: 0.3, label: "Arroz · 120 g" },
  { group: "veg", fraction: 0.25, label: "Brócolis · 80 g" },
  { group: "dairy", fraction: 0.1, label: "Iogurte · 100 g" },
  { group: "fat", fraction: 0.05, label: "Azeite · 5 g" },
];

const meta = {
  title: "Moléculas/Plate",
  component: Plate,
  args: { slices: ALMOCO, summary: "Fecha 100% do alvo do almoço", size: "lg", over: false },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "lg"] },
  },
} satisfies Meta<typeof Plate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** O grande, da receita aberta: o prato fechado no alvo do almoço. */
export const Grande: Story = {};

/** O mini, do cartão de receita e do painel do editor. A legenda continua. */
export const Mini: Story = { args: { size: "sm" } };

/** Os seis grupos do prato, um de cada. O tempero não entra no prato. */
export const OsSeisGrupos: Story = {
  name: "Os seis grupos",
  args: {
    slices: [
      { group: "protein", fraction: 1 / 6, label: "Proteína · Ovo 100 g" },
      { group: "carb", fraction: 1 / 6, label: "Carboidrato · Pão 50 g" },
      { group: "veg", fraction: 1 / 6, label: "Hortaliça · Tomate 60 g" },
      { group: "fruit", fraction: 1 / 6, label: "Fruta · Banana 80 g" },
      { group: "dairy", fraction: 1 / 6, label: "Laticínio · Queijo 30 g" },
      { group: "fat", fraction: 1 / 6, label: "Gordura · Manteiga 5 g" },
    ],
  },
};

/** Faltando para o alvo: a parte vazia fica junta, no fim, contornada, e o resumo diz quanto falta. */
export const FaltandoParaOAlvo: Story = {
  name: "Faltando para o alvo",
  args: { slices: ALMOCO.slice(0, 2), summary: "Falta 40% para o alvo do almoço" },
};

/**
 * Passou do alvo: o aro fica tracejado na cor de atenção. O `summary` diz
 * quanto passou — o aro sozinho não diz nada a quem não vê a cor.
 */
export const PassouDoAlvo: Story = {
  name: "Passou do alvo",
  args: { over: true, summary: "Passou 40 kcal do alvo do almoço" },
};

/**
 * A onda: troque a porção e as células que mudam de grupo entram do centro
 * para a borda, 12 ms por anel. Com `prefers-reduced-motion`, trocam todas de
 * uma vez, com um esmaecer.
 */
export const AOnda: Story = {
  name: "A onda",
  render: function Onda(args) {
    const [mais, trocar] = useState(false);
    const fatias = mais ? ALMOCO.map((s) => (s.group === "protein" ? { ...s, fraction: 0.4, label: "Frango · 200 g" } : s)) : ALMOCO;
    return (
      <Stack gap={16}>
        <Plate
          {...args}
          slices={fatias}
          over={mais}
          summary={mais ? "Passou 40 kcal do alvo do almoço" : "Fecha 100% do alvo do almoço"}
        />
        <div>
          <Button variant="secondary" onClick={() => trocar((v) => !v)}>
            {mais ? "Voltar para 150 g" : "Pôr 200 g de frango"}
          </Button>
        </div>
      </Stack>
    );
  },
};

/** A 320 px, a legenda desce para baixo do prato, e nada rola de lado. */
export const Em320px: Story = {
  name: "A 320 px",
  render: (args) => (
    <div style={{ width: "288px" }}>
      <Plate {...args} />
    </div>
  ),
};
