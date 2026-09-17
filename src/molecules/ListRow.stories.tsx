import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { Group } from "./Group";
import { ListRow } from "./ListRow";

/**
 * A linha repetida do sistema: refeição no diário, alimento na busca, fórmula
 * na calculadora.
 *
 * Ela **não** desenha a própria separação — quem separa é o `Group`. Uma linha
 * que carrega o próprio `border-bottom` deixa um fio solto na última posição e
 * obriga todo consumidor a apagá-lo com `:last-child`.
 *
 * Com `onClick` sai um `<button>`; sem ele sai um `<div>`. **Nunca** um
 * `<div>` com `onClick`: não recebe foco, não responde a Enter nem a Espaço, e
 * não aparece para o leitor de tela como algo acionável.
 */
const meta = {
  title: "Moléculas/ListRow",
  component: ListRow,
  args: { children: "Almoço", selected: false },
} satisfies Meta<typeof ListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const ITENS = [
  { nome: "Arroz, branco, cozido", medida: "4 colheres de sopa · 100 g", kcal: 128 },
  { nome: "Feijão carioca, cozido", medida: "1 concha média · 140 g", kcal: 108 },
  { nome: "Filé de frango grelhado", medida: "1 filé · 120 g", kcal: 190 },
  { nome: "Farofa de mandioca", medida: "1 colher de sopa · 15 g", kcal: 60 },
  { nome: "Salada de folhas com azeite", medida: "1 prato de sobremesa", kcal: 126 },
];

/**
 * A refeição que abre. Repare que a linha e o painel que aparece embaixo dela
 * vão num `<div>` só, como UM filho do grupo: é assim que se diz ao grupo
 * "isto aqui é um item, não dois", e é o que impede um fio de cortar entre a
 * linha e o próprio detalhe dela.
 */
export const Interativa: Story = {
  render: () => {
    const [aberta, definir] = useState(true);
    return (
      <Group label="Refeições" labelTrailing="922 kcal registrados">
        <div>
          <ListRow
            size="lg"
            expanded={aberta}
            onClick={() => definir(!aberta)}
            trailing={
              <Text variant="headline" tone="secondary" numeric>
                612
              </Text>
            }
          >
            <Text variant="headline">Almoço</Text>
            <Text variant="footnote" tone="muted" numeric>
              12:40 · 5 itens
            </Text>
          </ListRow>
          {aberta ? (
            <Stack gap={12} style={{ padding: "0 20px 18px" }}>
              {ITENS.map((item) => (
                <Stack key={item.nome} direction="row" gap={12} justify="space-between" align="baseline">
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
        <ListRow onClick={() => undefined}>
          <Text variant="body" tone="accent">
            Nova refeição
          </Text>
        </ListRow>
      </Group>
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
    <Group label="O que entrou no almoço">
      {ITENS.map((item) => (
        <ListRow
          key={item.nome}
          trailing={
            <Text variant="subhead" tone="muted" numeric>
              {item.kcal}
            </Text>
          }
        >
          <Text variant="body">{item.nome}</Text>
          <Text variant="caption" tone="subtle">
            {item.medida}
          </Text>
        </ListRow>
      ))}
    </Group>
  ),
};

const FORMULAS = [
  {
    nome: "Katch-McArdle",
    conta: "370 + 21,6 × 65,91 = 1.793,7",
    kcal: 1794,
    nota: "Usa massa magra, e é a que o app escolheu porque você informou a gordura corporal.",
  },
  { nome: "Mifflin-St Jeor", conta: "10 × 82 + 6,25 × 178 − 5 × 34 + 5 = 1.772,5", kcal: 1773 },
  { nome: "Harris-Benedict", conta: "88,36 + 13,4 × 82 + 4,8 × 178 − 5,7 × 34 = 1.858,9", kcal: 1859 },
];

/**
 * Escolha única dentro de um grupo. Com `mark` a linha vira `role="radio"`, e
 * o leitor de tela anuncia "2 de 3, marcado" — a informação que falta num
 * punhado de botões comuns.
 *
 * O fio entre as linhas recua até depois da marca (`inset="mark"`), para o
 * corte cair alinhado com o texto e não com a borda do cartão.
 */
export const Escolha: Story = {
  render: () => {
    const [escolhida, definir] = useState("Katch-McArdle");
    return (
      <Group
        label="Fórmula da taxa basal"
        inset="mark"
        note="Três fórmulas, três resultados, 86 kcal de diferença entre a maior e a menor. Nenhuma está certa: a escolha muda o número, e é por isso que ela é sua."
        role="radiogroup"
        aria-label="Fórmula da taxa basal"
      >
        {FORMULAS.map((formula) => (
          <ListRow
            key={formula.nome}
            mark
            align="start"
            size="lg"
            selected={formula.nome === escolhida}
            onClick={() => definir(formula.nome)}
            trailing={
              <Text
                variant="body"
                tone={formula.nome === escolhida ? "default" : "muted"}
                weight={formula.nome === escolhida ? "semibold" : "regular"}
                numeric
              >
                {formula.kcal.toLocaleString("pt-BR")}
              </Text>
            }
          >
            <Text variant="body" weight={formula.nome === escolhida ? "semibold" : "regular"}>
              {formula.nome}
            </Text>
            <Text variant="caption" tone="subtle" numeric>
              {formula.conta}
            </Text>
          </ListRow>
        ))}
      </Group>
    );
  },
};
