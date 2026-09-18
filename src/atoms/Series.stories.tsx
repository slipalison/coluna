import type { Meta, StoryObj } from "@storybook/react-vite";
import { Series } from "./Series";

/**
 * A série no tempo: peso ao longo do mês, energia ao longo da semana.
 *
 * Ela não sabe o que está medindo — recebe pares `{x, y}`, calcula a escala a
 * partir dos próprios dados e desenha. **Nenhum eixo, nenhum rótulo, nenhum
 * número**, e isso é decisão: texto dentro do SVG é onde o tema quebra (a cor
 * fica presa no desenho) e onde o rótulo escapa da moldura. O número mora no
 * `Stat` ao lado, em HTML, com o tema e o leitor de tela que ele já tem.
 *
 * A tendência é **tracejada** antes de ser de outra cor: forma atravessa o
 * daltonismo, a impressão e o tema claro (ADR-005).
 */
const meta = {
  title: "Átomos/Series",
  component: Series,
} satisfies Meta<typeof Series>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Trinta pesagens de um mês, com o ruído que uma balança de banheiro tem. */
const PESO = [
  84.6, 84.9, 84.4, 84.7, 84.2, 84.5, 84.0, 84.3, 83.9, 84.1, 83.8, 84.0, 83.6, 83.9, 83.5, 83.7,
  83.3, 83.6, 83.2, 83.4, 83.1, 83.3, 83.0, 83.2, 82.9, 83.1, 82.8, 83.0, 82.7, 82.9,
].map((y, x) => ({ x, y }));

/** A mesma medida depois da média móvel: é ela que responde "está caindo?". */
const TENDÊNCIA = PESO.map((_, i) => {
  const janela = PESO.slice(Math.max(0, i - 6), i + 1);
  return { x: i, y: janela.reduce((soma, p) => soma + p.y, 0) / janela.length };
});

export const Padrão: Story = {
  args: {
    points: PESO,
    label: "Peso do mês: de 84,6 kg a 82,9 kg",
  },
};

/**
 * Medida crua e tendência juntas — a tela de peso do Basalto.
 *
 * As duas linhas existem porque a pergunta é outra: a crua responde "quanto deu
 * hoje", a tendência responde "para onde está indo". Mostrar só a crua faz a
 * pessoa comemorar ruído; mostrar só a tendência esconde o dia em que a balança
 * discordou.
 */
export const ComTendência: Story = {
  name: "Com tendência",
  args: {
    points: PESO,
    trend: TENDÊNCIA,
    label: "Peso do mês com a tendência de sete dias",
  },
};

/**
 * Com a faixa alvo pintada atrás. A escala sai de **todos** os dados — série,
 * tendência e faixa —, então a faixa nunca fica meio de fora do desenho.
 */
export const ComFaixa: Story = {
  name: "Com faixa alvo",
  args: {
    points: [2380, 2290, 2440, 2510, 2180, 2330, 2400, 2260, 2350].map((y, x) => ({ x, y })),
    band: { from: 2250, to: 2450 },
    label: "Energia da semana, com a faixa do plano entre 2.250 e 2.450 kcal",
    height: 120,
  },
};

/**
 * Três dias medidos: o começo de qualquer série real.
 *
 * Ela não tem estado de carregamento nem esqueleto: enquanto não há duas
 * medidas, a marca sozinha diz a verdade — existe um ponto, e só.
 */
export const Começo: Story = {
  args: {
    points: [{ x: 0, y: 84.6 }],
    label: "Uma única pesagem: 84,6 kg",
    height: 120,
  },
};

/**
 * Série chapada — todo mundo com o mesmo valor. Não divide por zero: vira uma
 * reta no meio da caixa.
 */
export const Chapada: Story = {
  args: {
    points: [83.0, 83.0, 83.0, 83.0, 83.0].map((y, x) => ({ x, y })),
    label: "Cinco pesagens iguais: 83,0 kg",
    height: 120,
  },
};
