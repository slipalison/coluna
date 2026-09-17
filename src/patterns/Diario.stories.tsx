import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Badge } from "../atoms/Badge";
import { Screen } from "../atoms/Screen";
import { Slat } from "../atoms/Slat";
import { Stack } from "../atoms/Stack";
import { Surface } from "../atoms/Surface";
import { Text } from "../atoms/Text";
import { Group } from "../molecules/Group";
import { ListRow } from "../molecules/ListRow";
import { MacroBar } from "../molecules/MacroBar";
import { Reckoning } from "../molecules/Reckoning";
import { ScreenHeader } from "../molecules/ScreenHeader";
import { Stat } from "../molecules/Stat";
import { TabBar } from "../molecules/TabBar";

/**
 * A tela inteira, montada só com peças do Coluna.
 *
 * Ela existe por um motivo prático: um catálogo de componentes isolados não
 * prova que eles convivem. Espaçamento entre grupos, o recuo do rótulo contra
 * o recuo da linha, o vidro da barra de abas sobre o conteúdo rolando — nada
 * disso aparece num componente por vez, e é onde um design system costuma
 * falhar.
 *
 * Os números fecham, e isso também é de propósito: 310 + 612 = 922 consumidos,
 * 1.917 − 922 = 995 restantes, 68×4 + 95×4 + 30×9 = 922. Dado de mentira num
 * catálogo esconde justamente o caso que quebra o alinhamento.
 */
const meta = {
  title: "Padrões/Tela do diário",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const META = 1917;
const CONSUMIDO = 922;

const ABAS = [
  { value: "diario", label: "Diário", icon: "book" },
  { value: "cardapio", label: "Cardápio", icon: "utensils" },
  { value: "gasto", label: "Gasto", icon: "chart" },
  { value: "mais", label: "Mais", icon: "more" },
] as const;

const REFEICOES = [
  {
    id: "cafe",
    nome: "Café da manhã",
    hora: "07:20",
    kcal: 310,
    itens: [
      { nome: "Tapioca com queijo coalho", medida: "1 unidade · 90 g", kcal: 240 },
      { nome: "Mamão papaia", medida: "1 fatia · 170 g", kcal: 66 },
      { nome: "Café preto sem açúcar", medida: "1 xícara · 200 ml", kcal: 4 },
    ],
  },
  {
    id: "almoco",
    nome: "Almoço",
    hora: "12:40",
    kcal: 612,
    itens: [
      { nome: "Arroz, branco, cozido", medida: "4 colheres de sopa · 100 g", kcal: 128 },
      { nome: "Feijão carioca, cozido", medida: "1 concha média · 140 g", kcal: 108 },
      { nome: "Filé de frango grelhado", medida: "1 filé · 120 g", kcal: 190 },
      { nome: "Farofa de mandioca", medida: "1 colher de sopa · 15 g", kcal: 60 },
      { nome: "Salada de folhas com azeite", medida: "1 prato de sobremesa", kcal: 126 },
    ],
  },
];

export const Diário: Story = {
  render: () => {
    const [aberta, definir] = useState<string | null>("almoco");
    const [aba, trocarAba] = useState<(typeof ABAS)[number]["value"]>("diario");

    return (
      <div
        style={{
          position: "relative",
          width: "390px",
          height: "844px",
          overflow: "hidden",
          borderRadius: "var(--co-radius-container)",
          background: "var(--co-canvas)",
        }}
      >
        <div style={{ height: "100%", overflowY: "auto" }}>
          <Screen tabBar>
            <ScreenHeader
              title="Hoje"
              subtitle="quarta, 16 de setembro"
              action={{ icon: "calendar", label: "Dias anteriores", onClick: () => undefined }}
            />

            <Stack gap={20}>
              <Surface padding={20}>
                <Stack gap={16}>
                  <Stat
                    label="Restante"
                    value={(META - CONSUMIDO).toLocaleString("pt-BR")}
                    unit="kcal"
                    size="hero"
                    trailing={<Badge tone="accent">48% da meta</Badge>}
                  />
                  <Slat value={CONSUMIDO / META} label={`${CONSUMIDO} de ${META} kcal`} />
                  <Reckoning
                    lines={[
                      { label: "Meta do dia", value: META.toLocaleString("pt-BR") },
                      { label: "Alimentos registrados", value: `− ${CONSUMIDO}` },
                      { label: "Restante", value: (META - CONSUMIDO).toLocaleString("pt-BR"), total: true },
                    ]}
                    note="A conta fica aberta de propósito: o número grande é o resultado dela, e não um veredito sobre o seu dia."
                  />
                </Stack>
              </Surface>

              <Group label="Macros" inset="dot">
                <MacroBar name="Proteína" value={68} target={135} kind="protein" />
                <MacroBar name="Carboidrato" value={95} target={225} kind="carb" />
                <MacroBar name="Gordura" value={30} target={53} kind="fat" />
              </Group>

              <Group
                label="Refeições"
                labelTrailing={`${CONSUMIDO} kcal registrados`}
                note="O diário não recusa registro. Comeu, registra — nenhum dia é marcado como falha, e é isso que mantém o histórico honesto."
              >
                {REFEICOES.map((refeicao) => (
                  <div key={refeicao.id}>
                    <ListRow
                      size="lg"
                      expanded={aberta === refeicao.id}
                      onClick={() => definir(aberta === refeicao.id ? null : refeicao.id)}
                      trailing={
                        <Text variant="headline" tone="secondary" numeric>
                          {refeicao.kcal}
                        </Text>
                      }
                    >
                      <Text variant="headline">{refeicao.nome}</Text>
                      <Text variant="footnote" tone="muted" numeric>
                        {refeicao.hora} · {refeicao.itens.length} itens
                      </Text>
                    </ListRow>
                    {aberta === refeicao.id ? (
                      <Stack gap={12} style={{ padding: "0 20px 18px" }}>
                        {refeicao.itens.map((item) => (
                          <Stack
                            key={item.nome}
                            direction="row"
                            gap={12}
                            justify="space-between"
                            align="baseline"
                          >
                            <Stack gap={2}>
                              <Text variant="callout" tone="body">
                                {item.nome}
                              </Text>
                              <Text variant="caption" tone="subtle">
                                {item.medida}
                              </Text>
                            </Stack>
                            <Text variant="subhead" tone="muted" numeric>
                              {item.kcal}
                            </Text>
                          </Stack>
                        ))}
                      </Stack>
                    ) : null}
                  </div>
                ))}
                <ListRow onClick={() => undefined}>
                  <Text variant="body" tone="accent">
                    Nova refeição
                  </Text>
                </ListRow>
              </Group>
            </Stack>
          </Screen>
        </div>

        <TabBar
          label="Seções do Basalto"
          items={ABAS}
          value={aba}
          onChange={trocarAba}
          position="absolute"
        />
      </div>
    );
  },
};
