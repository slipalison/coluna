import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Dot } from "../atoms/Dot";
import { Text } from "../atoms/Text";
import { Group } from "./Group";
import { ListRow } from "./ListRow";

/**
 * A lista agrupada: um contêiner arredondado que junta linhas irmãs e as
 * separa por um fio recuado.
 *
 * É a estrutura central deste sistema, e ela existe para tirar borda da tela.
 * Antes cada linha carregava um `border-bottom` e cada cartão um contorno; o
 * resultado era uma tela de caixas dentro de caixas, tudo com o mesmo peso
 * visual e nada guiando o olho. Aqui a continuidade é o fundo do grupo, o
 * corte é um fio de 1px que começa depois do recuo, e a hierarquia volta a ser
 * feita de **peso e cor**.
 *
 * O grupo desenha os fios sozinho, por CSS, entre cada filho e o seguinte —
 * então a lista pode vir de `.map()` sem intercalar separador nenhum, e não
 * sobra fio na última linha.
 */
const meta = {
  title: "Moléculas/Group",
  component: Group,
} satisfies Meta<typeof Group>;

export default meta;
type Story = StoryObj<typeof meta>;

const DADOS = [
  ["Sexo", "masculino"],
  ["Idade", "34 anos"],
  ["Altura", "178 cm"],
  ["Peso", "82,0 kg"],
  ["Gordura corporal", "19,6%"],
] as const;

export const Padrão: Story = {
  render: () => (
    <Group label="Sobre você">
      {DADOS.map(([rotulo, valor]) => (
        <ListRow
          key={rotulo}
          size="sm"
          trailing={
            <Text variant="body" tone="secondary" numeric>
              {valor}
            </Text>
          }
        >
          <Text variant="body">{rotulo}</Text>
        </ListRow>
      ))}
    </Group>
  ),
};

/**
 * Os três recuos do fio. O valor acompanha o que existe à esquerda **dentro**
 * da linha, para o corte cair alinhado com o texto e não com a borda do
 * cartão. Olhe onde cada fio começa.
 */
export const Recuos: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "20px" }}>
      <Group label="none — corta de ponta a ponta" inset="none">
        <ListRow size="sm">
          <Text variant="body">Primeira</Text>
        </ListRow>
        <ListRow size="sm">
          <Text variant="body">Segunda</Text>
        </ListRow>
      </Group>

      <Group label="text — o caso comum, 20px">
        <ListRow size="sm">
          <Text variant="body">Primeira</Text>
        </ListRow>
        <ListRow size="sm">
          <Text variant="body">Segunda</Text>
        </ListRow>
      </Group>

      <Group label="dot — depois do ponto de macro, 42px" inset="dot">
        <ListRow size="sm" leading={<Dot tone="protein" />}>
          <Text variant="body">Proteína</Text>
        </ListRow>
        <ListRow size="sm" leading={<Dot tone="carb" />}>
          <Text variant="body">Carboidrato</Text>
        </ListRow>
      </Group>

      <Group label="mark — depois da marca de escolha, 52px" inset="mark">
        <ListRow size="sm" mark selected onClick={() => undefined}>
          <Text variant="body">Katch-McArdle</Text>
        </ListRow>
        <ListRow size="sm" mark onClick={() => undefined}>
          <Text variant="body">Mifflin-St Jeor</Text>
        </ListRow>
      </Group>
    </div>
  ),
};

/**
 * Rótulo em cima, nota embaixo — os dois **fora** da caixa, alinhados pela
 * calha de 4px. Dentro do cartão, o rótulo viraria mais uma linha da lista e a
 * nota pareceria um item.
 */
export const RótuloENota: Story = {
  name: "Rótulo e nota",
  render: () => (
    <Group
      label="O que faz esse número melhorar"
      note="Nenhum dos dois é obrigatório. Sem eles o app segue usando a fórmula — e continua dizendo que é a fórmula."
    >
      <ListRow
        trailing={
          <Text variant="subhead" tone="status" numeric>
            12 de 14
          </Text>
        }
      >
        <Text variant="body">Pesar-se em jejum</Text>
        <Text variant="footnote" tone="muted">
          Duas semanas seguidas afinam a mistura
        </Text>
      </ListRow>
      <ListRow
        trailing={
          <Text variant="subhead" tone="muted" numeric>
            3 de 14
          </Text>
        }
      >
        <Text variant="body">Registrar o que comeu</Text>
        <Text variant="footnote" tone="muted">
          O gasto medido sai da diferença entre o que entrou e o peso
        </Text>
      </ListRow>
    </Group>
  ),
};

/**
 * Com `role`, o grupo amarra sozinho o rótulo (nome), a nota e o erro
 * (descrição) e o `aria-invalid` — o que o `Field` faz com o campo. O erro sai
 * embaixo da nota, vermelho e com ícone. Escolha uma opção e ele some.
 */
export const EscolhaComErro: Story = {
  name: "Escolha com erro",
  render: () => {
    const [metodo, definirMetodo] = useState<string | undefined>(undefined);
    const opcoes = ["Bioimpedância", "Adipômetro", "DEXA"];
    return (
      <div style={{ maxWidth: "380px" }}>
        <Group
          role="radiogroup"
          inset="mark"
          label="Como a gordura foi medida"
          note="A conta só usa o percentual quando sabe de onde ele veio."
          {...(metodo === undefined ? { error: "Escolha como o percentual foi medido." } : {})}
        >
          {opcoes.map((opcao) => (
            <ListRow
              key={opcao}
              mark="single"
              selected={metodo === opcao}
              onClick={() => definirMetodo(opcao)}
            >
              {opcao}
            </ListRow>
          ))}
        </Group>
      </div>
    );
  },
};
