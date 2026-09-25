import type { Meta, StoryObj } from "@storybook/react-vite";
import { Series } from "../atoms/Series";
import { Stack } from "../atoms/Stack";
import { Surface } from "../atoms/Surface";
import { Stat } from "./Stat";
import { Legend } from "./Legend";

/**
 * Amostra e nome, lado a lado — a legenda de um gráfico ou de um calendário.
 *
 * Mora **fora** da `Series` pelo mesmo motivo de a série não ter eixo: texto
 * dentro do SVG prende a cor no desenho e escapa da moldura.
 *
 * A amostra copia a marca que explica — quadrado de categoria, ponto de medida,
 * traço cheio, tracejado, faixa — e sai `aria-hidden`: quem não vê a cor lê o
 * nome ao lado (ADR-005).
 */
const meta = {
  title: "Moléculas/Legend",
  component: Legend,
  args: {
    label: "Legenda do calendário",
    items: [
      { label: "dia fechado", tone: "accent" },
      { label: "parcial", tone: "carb" },
      { label: "sem registro", tone: "neutral" },
    ],
  },
} satisfies Meta<typeof Legend>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Os três estados de um dia no histórico. Nenhum deles é "falhou": cinza não é
 * vermelho, e o dia sem registro é só um dia sem registro.
 */
export const Calendário: Story = {};

/** As cinco formas, e o que cada uma copia. */
export const AsFormas: Story = {
  name: "As formas",
  args: {
    label: undefined,
    items: [
      { label: "categoria", swatch: "square" },
      { label: "pesagem do dia", swatch: "point", tone: "neutral" },
      { label: "tendência", swatch: "line" },
      { label: "projeção", swatch: "dashed" },
      { label: "faixa da meta", swatch: "band" },
    ],
  },
};

const PESO = [
  85.1, 84.6, 85.3, 84.9, 84.2, 84.8, 84.4, 84.9, 84.1, 84.5, 83.9, 84.6, 84.0, 83.7, 84.3, 83.8,
  84.1, 83.5, 84.0, 83.4, 83.9, 83.3, 83.7, 83.2, 83.8, 83.0, 83.6, 83.1,
].map((y, x) => ({ x, y }));

const TENDENCIA = PESO.map((_, i) => {
  const janela = PESO.slice(Math.max(0, i - 6), i + 1);
  return { x: i, y: janela.reduce((soma, p) => soma + p.y, 0) / janela.length };
});

/**
 * Embaixo do gráfico que ela explica. A `Series` desenha a pesagem com traço
 * cheio e a tendência tracejada; a legenda repete as duas formas, e o número
 * que interessa continua em HTML, no `Stat` de cima.
 */
export const ComOGráfico: Story = {
  name: "Com o gráfico",
  render: () => (
    <Surface padding={24} style={{ maxWidth: "556px" }}>
      <Stack gap={16}>
        <Stat label="Tendência de hoje" value="83,4" unit="kg" caption="pesagem de hoje: 83,1 kg" />
        <Series
          points={PESO}
          trend={TENDENCIA}
          band={{ from: 82.6, to: 83.4 }}
          width={508}
          height={184}
          label="Peso dos últimos 28 dias, de 85,1 a 83,1 kg, com a tendência caindo 0,38 kg por semana"
        />
        <Legend
          items={[
            { label: "pesagem do dia", swatch: "line" },
            { label: "tendência", swatch: "dashed", tone: "neutral" },
            { label: "faixa da meta", swatch: "band" },
          ]}
        />
      </Stack>
    </Surface>
  ),
};
