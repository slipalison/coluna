import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { IconButton } from "../atoms/IconButton";
import { SearchField } from "../atoms/SearchField";
import { Series } from "../atoms/Series";
import { Slat } from "../atoms/Slat";
import { Stack } from "../atoms/Stack";
import { Surface } from "../atoms/Surface";
import { Text } from "../atoms/Text";
import { VisuallyHidden } from "../atoms/VisuallyHidden";
import { Diff } from "../molecules/Diff";
import { Group } from "../molecules/Group";
import { ListRow } from "../molecules/ListRow";
import { MacroBar } from "../molecules/MacroBar";
import { NavList } from "../molecules/NavList";
import { Notice } from "../molecules/Notice";
import { PageHeader } from "../molecules/PageHeader";
import { Pager } from "../molecules/Pager";
import { Rail, type RailItem } from "../molecules/Rail";
import { Reckoning } from "../molecules/Reckoning";
import { SegmentedControl } from "../molecules/SegmentedControl";
import { Stat } from "../molecules/Stat";

/**
 * As telas do desktop, montadas só com peças do Coluna.
 *
 * O motivo é o mesmo da tela do diário no telefone: um catálogo de componentes
 * isolados não prova que eles convivem. No desktop a prova é outra — são três
 * colunas dividindo 1440px, o trilho ao lado da lista de seções, a busca no
 * cabeçalho ao lado do paginador — e é nessas vizinhanças que um sistema
 * pensado no telefone costuma quebrar.
 *
 * A regra que atravessa as três: **largura nunca vira modal**. O que o
 * telefone empilha em telas, o desktop põe lado a lado — a lista e o detalhe,
 * a escolha e o que ela muda, a conta e o número que ela produz.
 *
 * Os números fecham com os do telefone: 1.917 de meta, 922 registrados, 995
 * restantes; 135 × 4 + 225 × 4 + 53 × 9 = 1.917.
 */
const meta = {
  title: "Padrões/Desktop",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DESTINOS = [
  { value: "diario", label: "Diário", icon: "book", group: "Todo dia" },
  { value: "registrar", label: "Registrar", icon: "plus", group: "Todo dia" },
  { value: "historico", label: "Histórico", icon: "calendar", group: "Todo dia" },
  { value: "medidas", label: "Peso e gasto", icon: "scale", group: "Todo dia" },
  { value: "plano", label: "Plano", icon: "chart", group: "De vez em quando" },
  { value: "receitas", label: "Receitas", icon: "utensils", group: "De vez em quando" },
  { value: "ajustes", label: "Ajustes", icon: "gear", group: "De vez em quando" },
] as const satisfies readonly RailItem<string>[];

type Destino = (typeof DESTINOS)[number]["value"];

/** A marca no topo do trilho: o quadrado de acento e, aberto, o nome. */
function Marca({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          width: "26px",
          height: "26px",
          flexShrink: 0,
          borderRadius: "var(--co-radius-inset)",
          background: "var(--co-accent)",
        }}
      />
      {collapsed ? (
        <VisuallyHidden>Basalto</VisuallyHidden>
      ) : (
        <Text
          as="span"
          style={{ fontFamily: "var(--co-font-display)", fontSize: "var(--co-text-24)", lineHeight: 1 }}
        >
          Basalto
        </Text>
      )}
    </>
  );
}

/** A moldura de 1440 × 900 com o trilho à esquerda — a mesma das pranchas do desenho. */
function Moldura({
  destino,
  collapsed = false,
  children,
}: {
  destino: Destino;
  collapsed?: boolean;
  children: ReactNode;
}) {
  const [atual, definir] = useState<Destino>(destino);
  return (
    <div
      className="co-grain"
      style={{
        display: "flex",
        width: "1440px",
        height: "900px",
        overflow: "hidden",
        background: "var(--co-canvas)",
        color: "var(--co-text)",
      }}
    >
      <Rail
        label="Seções do Basalto"
        items={DESTINOS}
        value={atual}
        onChange={definir}
        collapsed={collapsed}
        header={<Marca collapsed={collapsed} />}
        footer={
          collapsed ? undefined : (
            <Stack gap={2} style={{ padding: "0 12px" }}>
              <Text variant="subhead" tone="body">
                Sua conta
              </Text>
              <Text variant="caption" tone="subtle">
                desde 12 de agosto
              </Text>
            </Stack>
          )
        }
      />
      {children}
    </div>
  );
}

/** Uma coluna que rola sozinha, para a tela inteira caber em 900px sem rolar. */
const coluna = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--co-space-16)",
  minHeight: 0,
  overflowY: "auto",
} as const;

// ------------------------------------------------------------------ diário --

const META = 1917;
const CONSUMIDO = 922;

const REFEICOES = [
  {
    id: "cafe",
    nome: "Café da manhã",
    hora: "07:20",
    kcal: "310",
    proteina: "21 g P",
    resumo: "Tapioca com queijo coalho · Mamão papaia · Café preto",
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
    kcal: "612",
    proteina: "47 g P",
    resumo: "Arroz · Feijão carioca · Filé de frango · Farofa · Salada",
    itens: [
      { nome: "Arroz, branco, cozido", medida: "4 colheres de sopa · 100 g", kcal: 128 },
      { nome: "Feijão carioca, cozido", medida: "1 concha média · 140 g", kcal: 108 },
      { nome: "Filé de frango grelhado", medida: "1 filé · 120 g", kcal: 190 },
      { nome: "Farofa de mandioca", medida: "1 colher de sopa · 15 g", kcal: 60 },
      { nome: "Salada de folhas com azeite", medida: "1 prato de sobremesa", kcal: 126 },
    ],
  },
  {
    id: "lanche",
    nome: "3ª refeição",
    hora: "16:00",
    kcal: "—",
    proteina: "—",
    resumo: "nada registrado ainda · alvo de 288 kcal",
    itens: [],
  },
];

const PESO = [85.1, 84.8, 84.6, 84.5, 84.2, 84.1, 83.9, 84.0, 83.8, 83.7, 83.6, 83.5, 83.4].map(
  (y, x) => ({ x, y }),
);

/**
 * D2 · o dia inteiro sem rolagem.
 *
 * O paginador fica colado ao "Hoje" que ele troca, e amanhã é a ponta da
 * direita. A busca tem o atalho `/`. A conta abre AO LADO do número grande, e
 * não embaixo: no desktop cabe, e o número sem a subtração vira veredito.
 *
 * As refeições ganham as duas colunas que o telefone não tinha onde pôr — o
 * horário à esquerda e a proteína à direita —, que é a coluna que o
 * fracionamento usa para decidir.
 */
export const Diário: Story = {
  render: () => {
    const [aberta, definir] = useState<string | null>("almoco");
    return (
      <Moldura destino="diario">
        <main
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            padding: "26px 32px 28px",
          }}
        >
          <PageHeader
            title="Hoje"
            subtitle="quarta, 16 de setembro"
            navigation={
              <Pager
                label="Dia"
                previousLabel="Dia anterior"
                nextLabel="Próximo dia"
                hasNext={false}
                onPrevious={() => undefined}
                onNext={() => undefined}
                current="quarta, 16 de setembro"
              />
            }
            actions={
              <>
                <SearchField label="Buscar alimento" placeholder="Buscar alimento" shortcut="/" />
                <Button icon="plus">Registrar</Button>
              </>
            }
          />

          <div
            style={{
              flexGrow: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 352px",
              gap: "var(--co-space-20)",
            }}
          >
            <div style={coluna}>
              <Surface padding={24}>
                <Stack direction="row" gap={24}>
                  <Stack gap={16} style={{ flexShrink: 0, width: "236px" }}>
                    <Stat
                      label="Restante"
                      value={(META - CONSUMIDO).toLocaleString("pt-BR")}
                      unit="kcal"
                      size="hero"
                    />
                    <Slat value={CONSUMIDO / META} label={`${CONSUMIDO} de ${META} kcal`} />
                  </Stack>
                  <div aria-hidden="true" style={{ width: "1px", background: "var(--co-line)" }} />
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <Reckoning
                      lines={[
                        { label: "Meta do dia", value: META.toLocaleString("pt-BR") },
                        { label: "Alimentos registrados", value: `− ${CONSUMIDO}` },
                        {
                          label: "Restante",
                          value: (META - CONSUMIDO).toLocaleString("pt-BR"),
                          total: true,
                        },
                      ]}
                      note="A conta fica aberta de propósito: o número grande é o resultado dela, e não um veredito sobre o seu dia."
                    />
                  </div>
                </Stack>
              </Surface>

              <Group label="Refeições" labelTrailing={`${CONSUMIDO} kcal registrados · 2 de 4`}>
                {REFEICOES.map((refeicao) => {
                  const vazia = refeicao.itens.length === 0;
                  const estaAberta = aberta === refeicao.id && !vazia;
                  return (
                    <div key={refeicao.id}>
                      <ListRow
                        size="lg"
                        // A refeição vazia não abre: não há o que mostrar embaixo, e uma
                        // seta que não leva a nada é uma promessa quebrada.
                        {...(vazia
                          ? {}
                          : {
                              expanded: estaAberta,
                              onClick: () => definir(estaAberta ? null : refeicao.id),
                            })}
                        leading={
                          <Text variant="subhead" tone="subtle" numeric style={{ width: "44px" }}>
                            {refeicao.hora}
                          </Text>
                        }
                        trailing={
                          <Stack direction="row" gap={16} align="baseline">
                            <Text variant="subhead" tone="subtle" numeric>
                              {refeicao.proteina}
                            </Text>
                            <Text
                              variant="headline"
                              tone="secondary"
                              numeric
                              style={{ width: "48px", textAlign: "right" }}
                            >
                              {refeicao.kcal}
                            </Text>
                          </Stack>
                        }
                      >
                        <Text variant="body" tone={vazia ? "muted" : "default"}>
                          {refeicao.nome}
                        </Text>
                        <Text
                          variant="caption"
                          tone="subtle"
                          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {refeicao.resumo}
                        </Text>
                      </ListRow>
                      {estaAberta ? (
                        <Stack gap={10} style={{ padding: "0 56px 16px 76px" }}>
                          {refeicao.itens.map((item) => (
                            <Stack key={item.nome} direction="row" gap={14} align="baseline">
                              <Text variant="callout" tone="body" style={{ flexGrow: 1 }}>
                                {item.nome}
                              </Text>
                              <Text variant="caption" tone="subtle">
                                {item.medida}
                              </Text>
                              <Text
                                variant="subhead"
                                tone="muted"
                                numeric
                                style={{ width: "48px", textAlign: "right" }}
                              >
                                {item.kcal}
                              </Text>
                            </Stack>
                          ))}
                        </Stack>
                      ) : null}
                    </div>
                  );
                })}
              </Group>
            </div>

            <div style={coluna}>
              <Group label="Macros" inset="dot">
                <MacroBar name="Proteína" value={68} target={135} kind="protein" />
                <MacroBar name="Carboidrato" value={95} target={225} kind="carb" />
                <MacroBar name="Gordura" value={30} target={53} kind="fat" />
              </Group>

              <Surface padding={20}>
                <Stack gap={14}>
                  <Stat
                    label="Gasto de hoje"
                    value="2.371"
                    unit="kcal"
                    size="lg"
                    trailing={<Badge solid>62% medido</Badge>}
                  />
                  <Slat value={0.62} marker label="62% medido, 38% pela fórmula" />
                  <Text variant="caption" tone="subtle" style={{ textWrap: "pretty" }}>
                    Sobe com dias de registro e cai quando fica uma semana sem registro.
                  </Text>
                </Stack>
              </Surface>

              <Surface padding={20}>
                <Stack gap={12}>
                  <Stat label="Tendência" value="83,4" unit="kg" size="md" caption="−0,38 kg por semana, em 28 dias" />
                  <Series
                    points={PESO}
                    width={312}
                    height={56}
                    label="Tendência de peso dos últimos 28 dias, de 85,1 a 83,4 kg"
                  />
                </Stack>
              </Surface>

              <Notice title="O cardápio ainda não entrou" tone="status" live="off">
                O cardápio de hoje ainda não foi copiado para o diário. Plano é plano — ele só entra se
                você mandar.
              </Notice>
            </div>
          </div>
        </main>
      </Moldura>
    );
  },
};

// ----------------------------------------------------------------- ajustes --

const SECOES = [
  { value: "meta", label: "Meta e ritmo", description: "perder 0,5 kg/semana · 1.917", group: "A sua conta" },
  { value: "macros", label: "Estratégia de macros", description: "padrão — carboidrato é o resto", group: "A sua conta" },
  { value: "refeicoes", label: "Refeições e janela", description: "4 refeições · livre", group: "A sua conta" },
  { value: "preferencias", label: "Preferências", description: "3 restrições ativas", group: "A sua conta" },
  { value: "avisos", label: "Avisos", description: "reavaliação · push e e-mail", group: "O que chega até você" },
  { value: "silencio", label: "Silêncio", description: "22h às 7h · respeita a janela", group: "O que chega até você" },
  { value: "dados", label: "Seus dados", description: "exportar, sair, apagar", group: "Conta e dados" },
  { value: "instalar", label: "Instalar no aparelho", description: "instalado", group: "Conta e dados" },
] as const;

const RITMOS = [
  { value: 0.25, nome: "Conservador", custo: "Cerca de 275 kcal de déficit. Fome baixa, treino intacto, prazo longo." },
  { value: 0.5, nome: "Moderado", custo: "Cerca de 550 kcal. Proteína em 1,6 g/kg para proteger massa magra." },
  { value: 0.75, nome: "Agressivo", custo: "Cerca de 825 kcal. Proteína sobe a 2,2 g/kg e a reavaliação passa a ser semanal." },
];

const OBJETIVOS = [
  { value: "perder", label: "Perder" },
  { value: "manter", label: "Manter" },
  { value: "ganhar", label: "Ganhar" },
] as const;

const GASTO = 2467;
const BASAL = 1794;
const PESO_ATUAL = 84.5;

/** A conta da meta, a mesma das pranchas: déficit de 1.100 kcal por kg/semana, proteína por peso. */
function contaDaMeta(ritmo: number) {
  const pedida = GASTO - Math.round(ritmo * 1100);
  const meta = Math.max(pedida, BASAL);
  const proteina = Math.round(PESO_ATUAL * (ritmo >= 0.75 ? 2.2 : 1.6));
  const gordura = Math.round((meta * 0.25) / 9);
  const carbo = Math.round((meta - proteina * 4 - gordura * 9) / 4);
  return {
    meta,
    pedida,
    travou: meta !== pedida,
    proteina,
    gordura,
    carbo,
    reavaliacao: ritmo >= 0.75 ? "semanal" : "quinzenal",
  };
}

const virgula = (n: number) => String(n).replace(".", ",");

/**
 * D8 · meta, com o diff ao lado.
 *
 * O trilho recolhido e a lista de seções dividem a esquerda: o trilho é a
 * navegação do aplicativo, a lista é a de dentro dos Ajustes, e cada seção diz
 * na linha de baixo o que guarda hoje.
 *
 * Mexer não grava nada. O painel da direita mostra o que muda — riscado o que
 * vale hoje, em destaque o que passa a valer —, e o botão só acorda quando há
 * o que confirmar.
 */
export const Ajustes: Story = {
  render: () => {
    const guardado = 0.5;
    const [secao, definirSecao] = useState<(typeof SECOES)[number]["value"]>("meta");
    const [objetivo, definirObjetivo] = useState<(typeof OBJETIVOS)[number]["value"]>("perder");
    const [ritmo, definirRitmo] = useState(0.75);

    const antes = contaDaMeta(guardado);
    const depois = contaDaMeta(ritmo);
    const mudou = ritmo !== guardado;
    const mil = (n: number) => n.toLocaleString("pt-BR");

    return (
      <Moldura destino="ajustes" collapsed>
        <div
          style={{
            width: "290px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--co-space-20)",
            padding: "26px 16px",
            borderRight: "var(--co-border-width) solid var(--co-line)",
          }}
        >
          <Text as="h1" variant="title-lg" style={{ padding: "0 8px" }}>
            Ajustes
          </Text>
          <NavList label="Seções dos ajustes" items={SECOES} value={secao} onChange={definirSecao} />
        </div>

        <main
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            padding: "26px 32px 28px",
          }}
        >
          <PageHeader
            as="h2"
            title="Meta e ritmo"
            subtitle="Mexa à vontade. Nada é gravado até você confirmar, e o painel da direita mostra o que muda."
            actions={<Button disabled={!mudou}>{mudou ? "Confirmar a meta nova" : "Nada para confirmar"}</Button>}
          />

          <div
            style={{
              flexGrow: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 396px",
              gap: "var(--co-space-20)",
            }}
          >
            <div style={coluna}>
              <Stack gap={10}>
                <Text variant="label" style={{ padding: "0 4px" }}>
                  Objetivo
                </Text>
                <SegmentedControl
                  label="Objetivo"
                  options={OBJETIVOS}
                  value={objetivo}
                  onChange={definirObjetivo}
                  full
                />
              </Stack>

              <Group
                label="Ritmo"
                labelTrailing={`guardado: ${virgula(guardado)} kg/semana`}
                inset="mark"
                role="radiogroup"
                aria-label="Ritmo"
              >
                {RITMOS.map((r) => {
                  const marcado = r.value === ritmo;
                  return (
                    <ListRow
                      key={r.value}
                      mark
                      align="start"
                      size="lg"
                      selected={marcado}
                      onClick={() => definirRitmo(r.value)}
                    >
                      <Stack direction="row" gap={10} align="baseline">
                        <Text variant="body" weight={marcado ? "semibold" : "regular"}>
                          {r.nome}
                        </Text>
                        <Text variant="footnote" tone="subtle" numeric>
                          {virgula(r.value)} kg/semana ·{" "}
                          {virgula(Math.round((r.value / PESO_ATUAL) * 10000) / 100)}% do peso
                        </Text>
                      </Stack>
                      <Text variant="footnote" tone="muted" style={{ textWrap: "pretty" }}>
                        {r.custo}
                      </Text>
                    </ListRow>
                  );
                })}
              </Group>
            </div>

            <div style={coluna}>
              <Group
                label="O que muda"
                note={
                  mudou
                    ? "Riscado é o que vale hoje. Em destaque, o que passa a valer se você confirmar."
                    : "Nada mudou em relação ao que está guardado, e o botão fica desligado — confirmar o que já vale não é ação."
                }
              >
                <Diff label="Meta diária" before={mil(antes.meta)} after={mil(depois.meta)} unit="kcal" />
                <Diff label="Proteína" before={String(antes.proteina)} after={String(depois.proteina)} unit="g" />
                <Diff label="Carboidrato" before={String(antes.carbo)} after={String(depois.carbo)} unit="g" />
                <Diff label="Reavaliação" before={antes.reavaliacao} after={depois.reavaliacao} />
              </Group>

              {depois.travou ? (
                <Notice title="O app parou na sua taxa basal">
                  Esse ritmo pediria {mil(depois.pedida)} kcal, abaixo da taxa basal. É limite do que o
                  app sugere — não do que você pode fazer nem do que pode registrar.
                </Notice>
              ) : null}

              {ritmo >= 0.75 ? (
                <Notice title="Agressivo muda três coisas, não uma">
                  Além do déficit maior, a proteína vai de {antes.proteina} para {depois.proteina} g e a
                  reavaliação passa de quinzenal para semanal.
                </Notice>
              ) : null}

              <Group label="Como a meta fica" inset="dot">
                <MacroBar
                  name="Proteína"
                  value={depois.proteina * 4}
                  target={depois.meta}
                  kind="protein"
                  layout="inline"
                  valueText={`${depois.proteina} g`}
                />
                <MacroBar
                  name="Carboidrato"
                  value={depois.carbo * 4}
                  target={depois.meta}
                  kind="carb"
                  layout="inline"
                  valueText={`${depois.carbo} g`}
                />
                <MacroBar
                  name="Gordura"
                  value={depois.gordura * 9}
                  target={depois.meta}
                  kind="fat"
                  layout="inline"
                  valueText={`${depois.gordura} g`}
                />
              </Group>
            </div>
          </div>
        </main>
      </Moldura>
    );
  },
};

// ---------------------------------------------------------------- receitas --

const RECEITAS = [
  { value: "frango", nome: "Frango com batata-doce", rende: "4 porções", tempo: "30 min", kcal: 519, grupo: "carne" },
  { value: "panqueca", nome: "Panqueca de banana e aveia", rende: "2 porções", tempo: "12 min", kcal: 268, grupo: "rapida" },
  { value: "escondidinho", nome: "Escondidinho de carne moída", rende: "6 porções", tempo: "1 h 10 min", kcal: 402, grupo: "carne" },
  { value: "omelete", nome: "Omelete de três ovos", rende: "1 porção", tempo: "8 min", kcal: 341, grupo: "rapida" },
  { value: "grao", nome: "Salada de grão-de-bico", rende: "3 porções", tempo: "20 min", kcal: 287, grupo: "sem-carne" },
];

const FILTROS = [
  { value: "todas", label: "Todas" },
  { value: "rapida", label: "15 min" },
  { value: "carne", label: "Carne" },
  { value: "sem-carne", label: "Sem carne" },
] as const;

const ESCALAS = [
  { value: "0.5", label: "½" },
  { value: "1", label: "1×" },
  { value: "1.5", label: "1½" },
  { value: "2", label: "2×" },
] as const;

const INGREDIENTES = [
  { nome: "Filé de frango", estado: "cru", g: 600, kcal: 954 },
  { nome: "Batata-doce", estado: "crua", g: 700, kcal: 798 },
  { nome: "Azeite de oliva", estado: "cru", g: 30, kcal: 265 },
  { nome: "Cebola", estado: "crua", g: 120, kcal: 46 },
  { nome: "Alho, sal e pimenta", estado: "cru", g: 15, kcal: 12 },
];

/**
 * D7 · lista e detalhe.
 *
 * A lista fica parada à esquerda, com a busca e o filtro em cima; a receita
 * abre ao lado, na mesma página — por isso a lista é `opens="detail"`, e o
 * item aberto se anuncia como o atual, não como página.
 *
 * O "Nova" é um botão-ícone no cabeçalho da coluna, onde o fundo já é o do
 * lugar; o botão grande da página é o de registrar a porção.
 */
export const Receitas: Story = {
  render: () => {
    const [filtro, definirFiltro] = useState<(typeof FILTROS)[number]["value"]>("todas");
    const [aberta, definirAberta] = useState("frango");
    const [escala, definirEscala] = useState<(typeof ESCALAS)[number]["value"]>("1");
    const [termo, definirTermo] = useState("");

    const visiveis = RECEITAS.filter(
      (r) =>
        (filtro === "todas" || r.grupo === filtro) &&
        r.nome.toLowerCase().includes(termo.trim().toLowerCase()),
    );
    const receita = RECEITAS.find((r) => r.value === aberta) ?? RECEITAS[0];
    const fator = Number(escala);
    const cru = INGREDIENTES.reduce((soma, i) => soma + i.kcal, 0);

    return (
      <Moldura destino="receitas" collapsed>
        <div
          style={{
            width: "392px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            borderRight: "var(--co-border-width) solid var(--co-line)",
          }}
        >
          <Stack gap={14} style={{ padding: "24px 24px 16px" }}>
            <Stack direction="row" justify="space-between" align="flex-end" gap={12}>
              <Text as="h1" variant="title-lg">
                Receitas
              </Text>
              <IconButton icon="plus" label="Nova receita" tone="accent" />
            </Stack>
            <SearchField
              label="Buscar receita"
              placeholder="Nome ou ingrediente"
              full
              value={termo}
              onChange={(evento) => definirTermo(evento.target.value)}
              count={termo.trim() === "" ? undefined : `${visiveis.length} de ${RECEITAS.length}`}
            />
            <SegmentedControl label="Filtro" options={FILTROS} value={filtro} onChange={definirFiltro} full />
          </Stack>
          <div style={{ flexGrow: 1, minHeight: 0, overflowY: "auto", padding: "0 12px 20px" }}>
            <NavList
              label="Receitas"
              opens="detail"
              value={aberta}
              onChange={definirAberta}
              items={visiveis.map((r) => ({
                value: r.value,
                label: r.nome,
                trailing: r.kcal,
                description: `${r.rende} · ${r.tempo}`,
              }))}
            />
          </div>
        </div>

        <main
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            padding: "26px 32px 28px",
            overflowY: "auto",
          }}
        >
          <PageHeader
            as="h2"
            title={receita?.nome}
            subtitle={`${Math.round(4 * fator)} porções · ${receita?.tempo ?? ""} · sua receita`}
            actions={
              <>
                <SegmentedControl label="Escala da receita" options={ESCALAS} value={escala} onChange={definirEscala} />
                <Button icon="check">Registrar 1 porção</Button>
              </>
            }
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 344px",
              gap: "var(--co-space-20)",
              alignItems: "start",
            }}
          >
            <Group label="Ingredientes" labelTrailing={`${Math.round(cru * fator).toLocaleString("pt-BR")} kcal crus`}>
              {INGREDIENTES.map((i) => (
                <ListRow
                  key={i.nome}
                  trailing={
                    <Stack direction="row" gap={16} align="baseline">
                      <Text variant="subhead" tone="subtle" numeric>
                        {Math.round(i.g * fator)} g
                      </Text>
                      <Text variant="callout" tone="secondary" numeric style={{ width: "48px", textAlign: "right" }}>
                        {Math.round(i.kcal * fator).toLocaleString("pt-BR")}
                      </Text>
                    </Stack>
                  }
                >
                  <Stack direction="row" gap={10} align="center">
                    <Text variant="body" tone="body">
                      {i.nome}
                    </Text>
                    <Badge shape="square">{i.estado}</Badge>
                  </Stack>
                </ListRow>
              ))}
              <ListRow onClick={() => undefined}>
                <Text variant="callout" tone="accent">
                  Acrescentar ingrediente
                </Text>
              </ListRow>
            </Group>

            <Surface padding={20}>
              <Stack gap={14}>
                <Text variant="label">Da panela ao prato</Text>
                <Reckoning
                  lines={[
                    { label: "Massa dos ingredientes", expression: "somada crua", value: `${Math.round(1465 * fator)} g` },
                    { label: "Massa pronta", expression: "pesada depois do fogo", value: `${Math.round(1180 * fator)} g` },
                    {
                      label: "Fator de rendimento",
                      expression: `${Math.round(1180 * fator)} ÷ ${Math.round(1465 * fator)}`,
                      value: "0,81",
                    },
                    { label: "Rende", expression: "porções iguais", value: `${Math.round(4 * fator)} porções`, total: true },
                  ]}
                />
              </Stack>
            </Surface>
          </div>
        </main>
      </Moldura>
    );
  },
};
