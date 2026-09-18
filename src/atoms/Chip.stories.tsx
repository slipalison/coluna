import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Chip } from "./Chip";
import { Stack } from "./Stack";

/**
 * Chip: uma restrição alimentar, um ingrediente, um filtro ligado.
 *
 * A diferença para `Badge` decide tudo: o selo é **leitura**, o chip é **ação**.
 * Por isso o chip tem 44px de alvo e o selo não tem.
 *
 * Escolhido ou removível — nunca os dois. A recusa está no tipo, porque a
 * versão com os dois é botão dentro de botão: HTML inválido que o navegador
 * conserta sozinho, e o defeito só aparece no teclado de quem tenta remover e
 * acaba escolhendo.
 */
const meta = {
  title: "Átomos/Chip",
  component: Chip,
  args: { label: "Sem lactose" },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

/**
 * Escolhido muda de fundo, de peso e ganha `aria-pressed="true"`. Três sinais
 * para a mesma informação (ADR-005).
 */
export const Escolhido: Story = {
  render: () => {
    const [ligados, definir] = useState<readonly string[]>(["Sem lactose"]);
    const restricoes = ["Sem lactose", "Sem glúten", "Vegetariano", "Sem frutos do mar"];

    return (
      <Stack direction="row" gap={8} wrap>
        {restricoes.map((nome) => (
          <Chip
            key={nome}
            label={nome}
            selected={ligados.includes(nome)}
            onClick={() =>
              definir((atuais) =>
                atuais.includes(nome) ? atuais.filter((n) => n !== nome) : [...atuais, nome],
              )
            }
          />
        ))}
      </Stack>
    );
  },
};

/**
 * Removível. O X tem os 44px inteiros, e não os 28px que caberiam bonito: um
 * alvo pequeno dentro de um alvo grande é pior que nenhum — a pessoa mira,
 * erra, e a restrição continua lá.
 */
export const Removível: Story = {
  render: () => {
    const [ingredientes, definir] = useState(["Ovo", "Aveia", "Banana", "Canela"]);

    return (
      <Stack direction="row" gap={8} wrap>
        {ingredientes.map((nome) => (
          <Chip
            key={nome}
            label={nome}
            onRemove={() => definir((atuais) => atuais.filter((n) => n !== nome))}
          />
        ))}
        {ingredientes.length === 0 ? (
          <span style={{ color: "var(--co-text-muted)", fontSize: "var(--co-text-13)" }}>
            Nenhum ingrediente na receita.
          </span>
        ) : null}
      </Stack>
    );
  },
};

/** Com ícone, para o chip que carrega uma origem — o código lido, o favorito. */
export const ComÍcone: Story = {
  name: "Com ícone",
  args: { label: "Lido do código", icon: "barcode" },
};
