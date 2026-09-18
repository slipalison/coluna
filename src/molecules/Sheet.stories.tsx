import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../atoms/Button";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { Group } from "./Group";
import { ListRow } from "./ListRow";
import { Sheet } from "./Sheet";

/**
 * O painel que abre por cima (telefone) ou por dentro (desktop).
 *
 * Um componente só para os dois, e não dois componentes, porque é o **mesmo**
 * painel: mesmo título, mesmo conteúdo, mesmas ações. Separar em `Sheet` e
 * `Panel` faria as duas versões divergirem no primeiro ajuste feito com pressa —
 * e a que diverge é sempre a que menos gente testa.
 *
 * `mode="inline"` é a regra **"largura nunca vira modal"** escrita como código.
 * No desktop, trocar a porção de uma refeição não pode escurecer a tela inteira
 * e esconder a conta do dia — que é justamente o número que faz a pessoa
 * escolher a porção.
 *
 * Em `overlay` ele é um diálogo de verdade: `aria-modal`, foco que entra ao
 * abrir, Tab que dá a volta dentro do painel, Esc que fecha e foco que **volta**
 * para quem abriu. Esse último é o que mais falta por aí — sem ele, fechar o
 * painel joga o teclado no começo da página.
 */
const meta = {
  title: "Moléculas/Sheet",
  component: Sheet,
  args: {
    open: true,
    onClose: () => undefined,
    title: "Trocar a porção",
    children: null,
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

const PORÇÕES = [
  { rotulo: "1 unidade média", medida: "120 g", kcal: "62 kcal" },
  { rotulo: "1 unidade grande", medida: "160 g", kcal: "83 kcal" },
  { rotulo: "Meia unidade", medida: "60 g", kcal: "31 kcal" },
  { rotulo: "100 g", medida: "100 g", kcal: "52 kcal" },
];

/** No telefone: sobe do rodapé, com véu por trás. */
export const Sobreposto: Story = {
  render: () => {
    const [aberto, definir] = useState(true);
    const [porção, definirPorção] = useState(PORÇÕES[0]?.rotulo ?? "");

    return (
      <div
        style={{
          position: "relative",
          width: "390px",
          height: "520px",
          overflow: "hidden",
          borderRadius: "var(--co-radius-container)",
          background: "var(--co-canvas)",
        }}
      >
        <Stack gap={12} style={{ padding: "20px" }}>
          <Text variant="title-lg">Maçã</Text>
          <Text variant="footnote" tone="muted">
            Porção escolhida: {porção}
          </Text>
          <Button onClick={() => definir(true)}>Trocar a porção</Button>
        </Stack>

        <Sheet
          open={aberto}
          onClose={() => definir(false)}
          title="Trocar a porção"
          position="absolute"
          footer={
            <Button full onClick={() => definir(false)}>
              Registrar
            </Button>
          }
        >
          <Group inset="text">
            {PORÇÕES.map((p) => (
              <ListRow
                key={p.rotulo}
                mark
                selected={p.rotulo === porção}
                trailing={p.kcal}
                onClick={() => definirPorção(p.rotulo)}
              >
                {p.rotulo}
                <Text variant="subhead" tone="muted">
                  {p.medida}
                </Text>
              </ListRow>
            ))}
          </Group>
        </Sheet>
      </div>
    );
  },
};

/**
 * No desktop: o mesmo painel, dentro do cartão que o chamou. Sem véu, sem
 * sombra, sem prender o foco — a conta do dia continua visível ao lado, que é o
 * motivo de existir a versão larga.
 */
export const DentroDoCartão: Story = {
  name: "Dentro do cartão",
  render: () => {
    const [aberto, definir] = useState(true);

    return (
      <Stack
        gap={12}
        style={{
          width: "440px",
          padding: "20px",
          background: "var(--co-surface)",
          borderRadius: "var(--co-radius-container)",
        }}
      >
        <Text variant="headline" weight="semibold">
          Almoço
        </Text>
        <Text variant="footnote" tone="muted">
          Arroz, feijão, frango grelhado — 640 kcal
        </Text>
        {aberto ? (
          <Sheet
            open
            mode="inline"
            title="Trocar a porção"
            onClose={() => definir(false)}
            footer={
              <Button full onClick={() => definir(false)}>
                Registrar
              </Button>
            }
          >
            <Group inset="text" elevation="none">
              {PORÇÕES.map((p) => (
                <ListRow key={p.rotulo} trailing={p.kcal}>
                  {p.rotulo}
                  <Text variant="subhead" tone="muted">
                    {p.medida}
                  </Text>
                </ListRow>
              ))}
            </Group>
          </Sheet>
        ) : (
          <Button variant="secondary" onClick={() => definir(true)}>
            Trocar a porção
          </Button>
        )}
      </Stack>
    );
  },
};
