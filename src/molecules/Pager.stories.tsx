import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Pager } from "./Pager";
import { PageHeader } from "./PageHeader";

/**
 * Anterior e próximo: o dia no diário, o mês no histórico.
 *
 * Mora **ao lado do título que ele troca**: o título diz onde a pessoa está, e
 * o paginador é o que muda isso — separar os dois obriga o olho a ir e voltar a
 * cada toque.
 *
 * Na ponta o botão fica `aria-disabled`, e não `disabled`: quem avança até hoje
 * apertando Enter tem o botão desligado debaixo do próprio foco no último
 * toque, e `disabled` jogaria esse foco para o começo da página.
 *
 * O `current` é o período por extenso, anunciado quando muda — sem ele, quem
 * usa leitor de tela aperta "Próximo mês" e não ouve nada.
 */
const meta = {
  title: "Moléculas/Pager",
  component: Pager,
  args: {
    label: "Mês",
    previousLabel: "Mês anterior",
    nextLabel: "Próximo mês",
    onPrevious: () => undefined,
    onNext: () => undefined,
    hasPrevious: true,
    hasNext: false,
    current: "setembro de 2026",
  },
} satisfies Meta<typeof Pager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

const MESES = ["julho", "agosto", "setembro"];
const RESUMO = [
  "29 dias fechados · 2 sem registro",
  "27 dias fechados · 3 parciais · 1 sem registro",
  "13 dias fechados · 2 parciais · 1 sem registro",
];

/**
 * No cabeçalho do histórico, colado ao título. O registro começa em julho e
 * termina hoje: nas duas pontas o botão apaga e continua com o foco.
 */
export const NoCabeçalho: Story = {
  name: "No cabeçalho",
  render: () => {
    const [mes, setMes] = useState(2);
    const nome = MESES[mes] ?? "";
    return (
      <div style={{ maxWidth: "720px" }}>
        <PageHeader
          title={nome.charAt(0).toUpperCase() + nome.slice(1)}
          subtitle={RESUMO[mes]}
          navigation={
            <Pager
              label="Mês"
              previousLabel="Mês anterior"
              nextLabel="Próximo mês"
              hasPrevious={mes > 0}
              hasNext={mes < MESES.length - 1}
              onPrevious={() => setMes((atual) => atual - 1)}
              onNext={() => setMes((atual) => atual + 1)}
              current={`${nome} de 2026`}
            />
          }
        />
      </div>
    );
  },
};
