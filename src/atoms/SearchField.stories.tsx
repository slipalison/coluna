import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SearchField } from "./SearchField";
import { Stack } from "./Stack";
import { Text } from "./Text";

/**
 * A busca: a lupa, o texto e o que ela respondeu.
 *
 * É um `<input type="search">` dentro de um marco `search`. As duas coisas
 * mudam o que chega a quem não enxerga: o marco é onde o atalho "ir para a
 * busca" do leitor de tela pousa, e o tipo dá a tecla "buscar" no teclado do
 * telefone e o Esc que limpa no navegador.
 *
 * O nome (`label`) é obrigatório e aparece escrito em cima da moldura, num
 * rótulo amarrado ao campo: o `placeholder` some na primeira letra e não é
 * nome. Ele sai na letra de corpo, a do rótulo do `Field` em linha, e não no
 * versalete do título de seção. Tocar na lupa ou em qualquer ponto da moldura
 * leva ao campo.
 */
const meta = {
  title: "Átomos/SearchField",
  component: SearchField,
  args: {
    label: "Buscar receita",
    placeholder: "Nome ou ingrediente",
    size: "md",
    full: false,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

const TACO = [
  "Arroz, branco, cozido",
  "Arroz, integral, cozido",
  "Arroz, branco, cru",
  "Arroz, carreteiro",
  "Arroz à grega",
  "Arroz, integral, cru",
  "Feijão carioca, cozido",
  "Filé de frango grelhado",
];

/**
 * A busca que É a tela: registrar. Grande (`lg`), ocupando a coluna, com a
 * contagem de resultados dentro da moldura.
 *
 * A contagem é anunciada com calma a cada mudança. Sem ela, quem usa leitor de
 * tela digita e não sabe se a lista ao lado encheu ou esvaziou — a única
 * resposta da busca estaria num lugar que o foco não visita.
 */
export const ComContagem: Story = {
  name: "Com contagem",
  render: () => {
    const [termo, setTermo] = useState("arroz cozido");
    const palavras = termo.toLowerCase().split(/\s+/).filter(Boolean);
    const achados = TACO.filter((nome) =>
      palavras.every((palavra) => nome.toLowerCase().includes(palavra)),
    );
    const contagem = achados.length === 1 ? "1 resultado" : `${achados.length} resultados`;

    return (
      <Stack gap={12} style={{ maxWidth: "640px" }}>
        <SearchField
          label="Buscar alimento"
          placeholder="Buscar alimento"
          size="lg"
          full
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          count={termo.trim() === "" ? undefined : contagem}
        />
        <Stack gap={4} style={{ padding: "0 4px" }}>
          {achados.map((nome) => (
            <Text key={nome} variant="callout" tone="body">
              {nome}
            </Text>
          ))}
        </Stack>
      </Stack>
    );
  },
};

/**
 * Com atalho: aperte `/` em qualquer ponto da página e o foco vem para cá. O
 * desenho da tecla some com o foco dentro — ela ensina o caminho até aqui, e
 * aqui já se está.
 *
 * A tecla não é tomada de quem está escrevendo em outro campo: "1/2 xícara"
 * numa observação continua sendo uma barra.
 */
export const ComAtalho: Story = {
  name: "Com atalho",
  render: () => (
    <Stack gap={16} style={{ maxWidth: "360px" }}>
      <SearchField label="Buscar alimento" placeholder="Buscar alimento" shortcut="/" full />
      <Text variant="footnote" tone="muted">
        Clique fora do campo e aperte a tecla barra.
      </Text>
    </Stack>
  ),
};

function BuscaComTexto() {
  const [termo, setTermo] = useState("arroz");
  return (
    <Stack gap={16} style={{ maxWidth: "360px" }}>
      <SearchField
        label="Buscar alimento"
        placeholder="arroz, feijão, banana"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        full
      />
      <Text variant="footnote" tone="muted">
        O × só aparece com texto no campo. O toque esvazia e devolve o foco ao campo.
      </Text>
    </Stack>
  );
}

/**
 * O × de limpar é da coluna, e não o do navegador: 44px de alvo, um nome para
 * o leitor de tela (`clearLabel`, "Limpar a busca" por padrão), e só existe
 * com texto. O toque esvazia pelo `onChange` de quem usa e devolve o foco ao
 * campo. No claro e no escuro, para conferir o contorno e o × nos dois temas.
 */
export const ComLimparClaro: Story = {
  name: "Com o × de limpar — claro",
  globals: { tema: "light" },
  render: () => <BuscaComTexto />,
};

export const ComLimparEscuro: Story = {
  name: "Com o × de limpar — escuro",
  globals: { tema: "dark" },
  render: () => <BuscaComTexto />,
};

function BuscaSobreALista() {
  const [termo, setTermo] = useState("arroz");
  const achados = TACO.filter((nome) => nome.toLowerCase().includes(termo.trim().toLowerCase()));
  return (
    <Stack gap={24} style={{ maxWidth: "360px" }}>
      <SearchField
        label="Buscar alimento"
        placeholder="arroz, feijão, banana"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        full
      />
      <Stack as="section" gap={8} aria-labelledby="busca-sobre-a-lista">
        <Text id="busca-sobre-a-lista" as="h2" variant="label">
          Alimentos achados
        </Text>
        {achados.map((nome) => (
          <Text key={nome} variant="callout" tone="body">
            {nome}
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}

/**
 * O nome da busca e o título da lista que ela filtra, um embaixo do outro: o
 * nome em letra de corpo, de caixa normal, e o título no versalete de seção.
 * Função diferente, cara diferente — com a mesma face, a pessoa lê os dois
 * como títulos, e o nome do campo fica em 11px, abaixo do piso de 12px do
 * rótulo (`ux.md` §1). No claro e no escuro.
 */
export const SobreAListaClaro: Story = {
  name: "Sobre a lista — claro",
  globals: { tema: "light" },
  render: () => <BuscaSobreALista />,
};

export const SobreAListaEscuro: Story = {
  name: "Sobre a lista — escuro",
  globals: { tema: "dark" },
  render: () => <BuscaSobreALista />,
};
