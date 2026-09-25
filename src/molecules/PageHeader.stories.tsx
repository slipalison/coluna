import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../atoms/Button";
import { SearchField } from "../atoms/SearchField";
import { Legend } from "./Legend";
import { PageHeader } from "./PageHeader";
import { Pager } from "./Pager";
import { SegmentedControl } from "./SegmentedControl";

/**
 * O cabeçalho de uma página do desktop: título e linha de baixo à esquerda, as
 * ações da página à direita, tudo assentado na mesma base.
 *
 * É outra peça, e não o `ScreenHeader` esticado: no telefone cabe uma ação, e
 * ela é um ícone; no desktop cabem a busca, o botão principal e o seletor de
 * período na linha do título — e é lá que a pessoa procura. O próprio
 * `ScreenHeader` diz que "duas ações já são uma barra de ferramentas, e isso é
 * outro componente". É este.
 *
 * `navigation` fica colado ao título porque muda o título; `actions` quebra
 * para baixo dele quando a janela estreita, em vez de espremê-lo.
 */
const meta = {
  title: "Moléculas/PageHeader",
  component: PageHeader,
  args: {
    title: "Plano e realizado",
    subtitle: "quarta, 16 de setembro · 4 refeições · janela livre",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {
  args: {
    actions: (
      <>
        <Button variant="secondary" icon="refresh">
          Regerar o plano
        </Button>
        <Button icon="arrow-right">Copiar o que falta para o diário</Button>
      </>
    ),
  },
};

/**
 * O diário: o paginador colado ao título que ele troca, a busca com o atalho
 * `/` e o botão de registrar. Hoje é a ponta da direita — não há amanhã para
 * abrir.
 */
export const Diário: Story = {
  render: () => (
    <PageHeader
      title="Hoje"
      subtitle="quarta, 16 de setembro"
      navigation={
        <Pager
          label="Dia"
          previousLabel="Dia anterior"
          nextLabel="Próximo dia"
          hasNext={false}
          onPrevious={() => undefined}
          onNext={() => undefined}
          current="quarta, 16 de setembro"
        />
      }
      actions={
        <>
          <SearchField label="Buscar alimento" placeholder="Buscar alimento" shortcut="/" />
          <Button icon="plus">Registrar</Button>
        </>
      }
    />
  ),
};

/** O histórico: a legenda do calendário mora no cabeçalho, onde o olho chega primeiro. */
export const ComLegenda: Story = {
  name: "Com legenda",
  render: () => (
    <PageHeader
      title="Setembro"
      subtitle="13 dias fechados · 2 parciais · 1 sem registro"
      navigation={
        <Pager
          label="Mês"
          previousLabel="Mês anterior"
          nextLabel="Próximo mês"
          hasNext={false}
          onPrevious={() => undefined}
          onNext={() => undefined}
        />
      }
      actions={
        <Legend
          label="Legenda do calendário"
          items={[
            { label: "dia fechado", tone: "accent" },
            { label: "parcial", tone: "carb" },
            { label: "sem registro", tone: "neutral" },
          ]}
        />
      }
    />
  ),
};

const JANELAS = [
  { value: "14", label: "14 dias" },
  { value: "28", label: "28 dias" },
  { value: "90", label: "90 dias" },
] as const;

/** Peso e gasto: a ação da página é escolher a janela de tempo que os dois gráficos leem. */
export const ComSegmentado: Story = {
  name: "Com segmentado",
  render: () => {
    const [janela, definir] = useState<(typeof JANELAS)[number]["value"]>("28");
    return (
      <PageHeader
        title="O que o corpo respondeu"
        subtitle="Peso à esquerda, gasto à direita — e a seta entre os dois é a razão de estarem na mesma tela."
        actions={
          <SegmentedControl label="Janela de tempo" options={JANELAS} value={janela} onChange={definir} />
        }
      />
    );
  },
};
