import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Stack } from "../atoms/Stack";
import { Surface } from "../atoms/Surface";
import { Text } from "../atoms/Text";
import { ListRow } from "./ListRow";

/**
 * A linha repetida do sistema: refeição no diário, alimento na busca, seção no
 * menu.
 *
 * Com `onClick` sai um `<button>`; sem ele sai um `<div>`. **Nunca** um
 * `<div>` com `onClick`: não recebe foco, não responde a Enter nem a Espaço, e
 * não aparece para o leitor de tela como algo acionável — três defeitos de
 * acessibilidade que o elemento certo resolve de graça.
 */
const meta = {
  title: "Moléculas/ListRow",
  component: ListRow,
  args: { children: "Almoço", marker: true, selected: false },
} satisfies Meta<typeof ListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const ITENS = [
  { nome: "Arroz, branco, cozido", medida: "6 colheres de sopa · 150 g", kcal: 192 },
  { nome: "Feijão carioca, cozido", medida: "1 concha média · 140 g", kcal: 108 },
  { nome: "Filé de frango grelhado", medida: "1 filé · 120 g", kcal: 190 },
  { nome: "Salada de folhas", medida: "1 prato raso · 2 colheres de azeite", kcal: 181 },
];

export const Interativa: Story = {
  render: () => {
    const [aberta, definir] = useState(true);
    return (
      <Surface bordered>
        <ListRow
          marker
          selected={aberta}
          expanded={aberta}
          onClick={() => definir(!aberta)}
          trailing={
            <>
              <Text variant="body" numeric>
                671
              </Text>
              <Text variant="caption" tone="muted">
                kcal
              </Text>
            </>
          }
        >
          <Text variant="body" style={{ fontWeight: "var(--co-weight-medium)" }}>
            Almoço
          </Text>
          <Text variant="caption" tone="muted">
            12:30 · 4 itens
          </Text>
        </ListRow>
        {aberta ? (
          <Stack gap={10} style={{ padding: "12px 16px 16px 52px" }}>
            {ITENS.map((item) => (
              <Stack key={item.nome} direction="row" gap={12} justify="space-between" align="baseline">
                <Stack gap={2}>
                  <Text variant="caption">{item.nome}</Text>
                  <Text variant="caption" tone="muted" style={{ fontSize: "11px" }}>
                    {item.medida}
                  </Text>
                </Stack>
                <Text variant="caption" tone="muted" numeric>
                  {item.kcal}
                </Text>
              </Stack>
            ))}
          </Stack>
        ) : null}
      </Surface>
    );
  },
};

/**
 * Sem `onClick` a linha não vira controle. Use para o que só informa — um item
 * dentro de uma refeição, uma medida no histórico.
 */
export const SóLeitura: Story = {
  name: "Só leitura",
  render: () => (
    <Surface bordered>
      {ITENS.map((item) => (
        <ListRow
          key={item.nome}
          trailing={
            <Text variant="caption" tone="muted" numeric>
              {item.kcal}
            </Text>
          }
        >
          <Text variant="body">{item.nome}</Text>
          <Text variant="caption" tone="muted">
            {item.medida}
          </Text>
        </ListRow>
      ))}
    </Surface>
  ),
};

/**
 * Uma lista de escolha única. A barra da esquerda acende no item marcado — é
 * um segundo sinal além do fundo, para quem não distingue as duas cores.
 */
export const Seleção: Story = {
  render: () => {
    const [escolhido, definir] = useState("Arroz, branco, cozido");
    return (
      <Surface bordered>
        {ITENS.map((item) => (
          <ListRow
            key={item.nome}
            marker
            selected={item.nome === escolhido}
            onClick={() => definir(item.nome)}
            trailing={
              <Text variant="caption" tone="muted" numeric>
                {item.kcal}
              </Text>
            }
          >
            <Text variant="body">{item.nome}</Text>
            <Text variant="caption" tone="muted">
              {item.medida}
            </Text>
          </ListRow>
        ))}
      </Surface>
    );
  },
};
