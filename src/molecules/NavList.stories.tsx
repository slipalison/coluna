import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Badge } from "../atoms/Badge";
import { Dot } from "../atoms/Dot";
import { SearchField } from "../atoms/SearchField";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { NavList, type NavListItem } from "./NavList";

/**
 * A lista que escolhe o que a coluna do lado mostra.
 *
 * No telefone isto é uma lista agrupada com seta, e cada linha empurra uma tela
 * nova. No desktop há largura para as duas coisas juntas, e a lista vira
 * **coluna**: fica parada à esquerda enquanto o conteúdo muda à direita.
 *
 * O `Rail` é a navegação do aplicativo; esta é a de dentro de uma seção. As
 * duas moram lado a lado, e é por isso que não são a mesma peça: o trilho é
 * lido de relance, a lista é lida com calma — e a linha de baixo dela muda com
 * o que a pessoa guardou.
 *
 * `opens` diz o que o item abre, e dele saem o elemento e o anúncio: `page` é
 * `<nav>` com `aria-current="page"`; `detail` é um grupo com
 * `aria-current="true"`, porque a página não muda — muda o painel.
 */
const meta = {
  title: "Moléculas/NavList",
  component: NavList,
  args: {
    label: "Ajustes",
    items: [],
    value: "meta",
    onChange: () => undefined,
    opens: "page",
  },
} satisfies Meta<typeof NavList>;

export default meta;
type Story = StoryObj<typeof meta>;

const SECOES = [
  { value: "meta", label: "Meta e ritmo", description: "perder 0,5 kg/semana · 1.917", group: "A sua conta" },
  { value: "macros", label: "Estratégia de macros", description: "padrão — carboidrato é o resto", group: "A sua conta" },
  { value: "refeicoes", label: "Refeições e janela", description: "4 refeições · livre", group: "A sua conta" },
  { value: "preferencias", label: "Preferências", description: "3 restrições ativas", group: "A sua conta" },
  { value: "avisos", label: "Avisos", description: "reavaliação · push e e-mail", group: "O que chega até você" },
  { value: "silencio", label: "Silêncio", description: "22h às 7h · respeita a janela", group: "O que chega até você" },
  { value: "dados", label: "Seus dados", description: "exportar, sair, apagar", group: "Conta e dados" },
  { value: "instalar", label: "Instalar no aparelho", description: "instalado", group: "Conta e dados" },
] as const satisfies readonly NavListItem<string>[];

/**
 * As seções dos Ajustes. Cada item diz o que a seção guarda HOJE, e é isso que
 * faz a lista valer a coluna: dá para ler o estado da conta inteira sem abrir
 * nada.
 */
export const Ajustes: Story = {
  render: () => {
    const [secao, definir] = useState<(typeof SECOES)[number]["value"]>("meta");
    return (
      <div style={{ width: "290px" }}>
        <NavList label="Ajustes" items={SECOES} value={secao} onChange={definir} />
      </div>
    );
  },
};

const RECEITAS = [
  { value: "frango", nome: "Frango com batata-doce", rende: "4 porções", tempo: "30 min", kcal: 519 },
  { value: "panqueca", nome: "Panqueca de banana e aveia", rende: "2 porções", tempo: "12 min", kcal: 268 },
  { value: "escondidinho", nome: "Escondidinho de carne moída", rende: "6 porções", tempo: "1 h 10 min", kcal: 402, aviso: "passa do limite" },
  { value: "omelete", nome: "Omelete de três ovos", rende: "1 porção", tempo: "8 min", kcal: 341 },
  { value: "grao", nome: "Salada de grão-de-bico", rende: "3 porções", tempo: "20 min", kcal: 287 },
];

/**
 * Lista e detalhe: as receitas. O item abre a receita **ao lado**, na mesma
 * página, e por isso `opens="detail"` — anunciar "página atual" ali seria
 * mentir sobre o que o clique fez.
 */
export const ListaEDetalhe: Story = {
  name: "Lista e detalhe",
  render: () => {
    const [aberta, definir] = useState("frango");
    const itens = RECEITAS.map((r) => ({
      value: r.value,
      label: r.nome,
      trailing: r.kcal,
      description: (
        <>
          {r.rende} · {r.tempo}
          {r.aviso ? (
            <>
              {" "}
              <Badge tone="accent">{r.aviso}</Badge>
            </>
          ) : null}
        </>
      ),
    }));
    return (
      <Stack gap={14} style={{ width: "392px" }}>
        <SearchField label="Buscar receita" placeholder="Nome ou ingrediente" full />
        <NavList label="Receitas" items={itens} value={aberta} onChange={definir} opens="detail" />
      </Stack>
    );
  },
};

const FONTES = [
  { value: "taco", label: "TACO", trailing: "597", tone: "carb" },
  { value: "off", label: "Embalagem", trailing: "por código", tone: "fat" },
  { value: "meus", label: "Meus", trailing: "9", tone: "accent" },
] as const;

/**
 * As bases de alimentos da busca, com o ponto da cor de cada uma. O ponto é
 * atalho — o nome e a contagem estão escritos do lado (ADR-005).
 */
export const ComPonto: Story = {
  name: "Com ponto",
  render: () => {
    const [fonte, definir] = useState<(typeof FONTES)[number]["value"]>("taco");
    return (
      <Stack gap={12} style={{ width: "300px" }}>
        <NavList
          label="Bases de alimentos"
          opens="detail"
          value={fonte}
          onChange={definir}
          items={FONTES.map((f) => ({
            value: f.value,
            label: f.label,
            trailing: f.trailing,
            leading: <Dot tone={f.tone} />,
          }))}
        />
        <Text variant="caption" tone="subtle" style={{ padding: "0 14px" }}>
          O ponto é atalho; o nome é a informação.
        </Text>
      </Stack>
    );
  },
};
