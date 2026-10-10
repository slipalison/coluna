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

/**
 * Marcar quantas quiser. Com `mark="multiple"` a linha vira `role="checkbox"`
 * e a marca sai QUADRADA — que é a forma que a pessoa já aprendeu a ler como
 * "pode marcar mais de uma", em qualquer aplicativo que ela tenha usado antes.
 *
 * Compare com a história acima: lá a marca é redonda porque só uma resposta
 * cabe. A diferença de forma é a pergunta sendo feita, e não decoração
 * ([ADR-007](/docs/adr-007)).
 */
export const Marcar: Story = {
  render: () => {
    const [marcadas, definir] = useState<readonly string[]>(["Sem lactose"]);
    const alternar = (nome: string) =>
      definir((atual) =>
        atual.includes(nome) ? atual.filter((item) => item !== nome) : [...atual, nome],
      );

    return (
      <Group label="Restrições" inset="mark">
        {["Sem lactose", "Sem glúten", "Vegetariano"].map((restricao) => (
          <ListRow
            key={restricao}
            mark="multiple"
            selected={marcadas.includes(restricao)}
            onClick={() => alternar(restricao)}
          >
            <Text variant="body">{restricao}</Text>
          </ListRow>
        ))}
      </Group>
    );
  },
};

const REFEICOES = [
  {
    hora: "07:20",
    nome: "Café da manhã",
    kcal: "310 kcal",
    resumo: "Pão francês · Manteiga · Café com leite",
  },
  {
    hora: "12:40",
    nome: "Almoço",
    kcal: "612 kcal",
    resumo:
      "Arroz, tipo 1, cozido · Feijão, carioca, cozido · Frango, peito, sem pele, grelhado · Alface, crespa, crua · Azeite de oliva, extra virgem",
  },
  { hora: "16:10", nome: "Lanche", kcal: "0 kcal", resumo: undefined },
];

/**
 * A refeição do diário no telefone: o nome em cima, o resumo dos alimentos
 * embaixo, em `description` (ADR-015).
 *
 * A moldura tem 361px — um telefone de 393px menos a calha de 16px de cada
 * lado. O resumo do almoço é comprido de propósito: ele fica numa linha só, o
 * que passa vira reticências, e a linha do almoço tem a mesma altura que a do
 * café, de resumo curto. Como segundo filho, o mesmo texto quebrava em três ou
 * quatro linhas.
 *
 * As reticências são desenho: o texto inteiro está no DOM, e o nome do botão
 * é a linha inteira, na ordem da tela ("12:40 Almoço Arroz, tipo 1, cozido ·
 * … 612 kcal") — o nome contém o que se lê nele. Sem alimento, não há resumo,
 * e a linha do lanche é a de antes.
 */
export const ComDescricaoNoTelefone: Story = {
  name: "Com descrição comprida, no telefone",
  render: () => (
    <div style={{ width: "361px" }}>
      <Group label="Refeições" labelTrailing="922 kcal registrados">
        {REFEICOES.map((refeicao) => (
          <ListRow
            key={refeicao.nome}
            expanded={false}
            onClick={() => undefined}
            leading={
              <Text as="span" variant="subhead" tone="muted" numeric>
                {refeicao.hora}
              </Text>
            }
            trailing={
              <Text as="span" variant="subhead" tone="secondary" numeric>
                {refeicao.kcal}
              </Text>
            }
            description={refeicao.resumo}
          >
            <Text as="span" variant="headline">
              {refeicao.nome}
            </Text>
          </ListRow>
        ))}
      </Group>
    </div>
  ),
};
