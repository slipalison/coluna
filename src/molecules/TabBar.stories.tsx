import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { TabBar } from "./TabBar";

const ABAS = [
  { value: "diario", label: "Diário", icon: "book" },
  { value: "cardapio", label: "Cardápio", icon: "utensils" },
  { value: "gasto", label: "Gasto", icon: "chart" },
  { value: "mais", label: "Mais", icon: "more" },
] as const;

/**
 * A barra de abas que flutua sobre o conteúdo.
 *
 * A aba atual muda de **cor**, de **peso** e ganha `aria-current="page"`. Três
 * sinais para a mesma informação, e é de propósito: cor sozinha não é sinal
 * (ADR-005). Quem não separa ametista de cinza ainda lê o rótulo mais pesado;
 * quem usa leitor de tela ouve "página atual".
 *
 * Aqui ela aparece com `position="static"` para caber no catálogo. Na tela de
 * verdade ela é `fixed`, e a tela precisa reservar o espaço embaixo — sem a
 * reserva a última linha da lista fica atrás do vidro e ninguém alcança. Veja
 * `Padrões/Tela do diário`.
 */
const meta = {
  title: "Moléculas/TabBar",
  component: TabBar,
  args: {
    label: "Seções do Basalto",
    items: ABAS,
    value: "diario",
    onChange: () => undefined,
    position: "static",
  },
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {
  render: () => {
    const [aba, definir] = useState<(typeof ABAS)[number]["value"]>("diario");
    return (
      <div style={{ maxWidth: "390px" }}>
        <TabBar
          label="Seções do Basalto"
          items={ABAS}
          value={aba}
          onChange={definir}
          position="static"
        />
      </div>
    );
  },
};

/**
 * O vidro só aparece quando há conteúdo passando por baixo. Role a caixa.
 */
export const SobreOConteúdo: Story = {
  name: "Sobre o conteúdo",
  render: () => {
    const [aba, definir] = useState<(typeof ABAS)[number]["value"]>("gasto");
    return (
      <div
        style={{
          position: "relative",
          width: "390px",
          height: "320px",
          overflow: "hidden",
          borderRadius: "var(--co-radius-container)",
          background: "var(--co-canvas)",
        }}
      >
        <div style={{ height: "100%", overflowY: "auto", padding: "16px 16px 96px" }}>
          {Array.from({ length: 14 }, (_, i) => (
            <div
              key={i}
              style={{
                padding: "14px 20px",
                marginBottom: "8px",
                background: "var(--co-surface)",
                borderRadius: "var(--co-radius-container)",
                color: "var(--co-text-secondary)",
                fontSize: "var(--co-text-14)",
              }}
            >
              Linha {i + 1}
            </div>
          ))}
        </div>
        <TabBar
          label="Seções do Basalto"
          items={ABAS}
          value={aba}
          onChange={definir}
          position="absolute"
        />
      </div>
    );
  },
};
