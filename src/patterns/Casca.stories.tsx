import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Screen } from "../atoms/Screen";
import { Stack } from "../atoms/Stack";
import { Surface } from "../atoms/Surface";
import { Text } from "../atoms/Text";
import { Disclosure } from "../molecules/Disclosure";
import { EmptyState } from "../molecules/EmptyState";
import { NavList } from "../molecules/NavList";
import { Notice } from "../molecules/Notice";
import { PageHeader } from "../molecules/PageHeader";
import { Rail } from "../molecules/Rail";
import { ScreenHeader } from "../molecules/ScreenHeader";
import { SegmentedControl } from "../molecules/SegmentedControl";
import { Stat } from "../molecules/Stat";
import { TabBar } from "../molecules/TabBar";
import { hourStyle } from "../theme/hour";

/**
 * A casca vazia do Basalto na Coluna 2.0, montada só com peças do sistema: a
 * barra de abas no celular e o trilho no desktop, sem o vidro (que é da F4),
 * com três destinos — Hoje, Livro e Você.
 *
 * Ela existe pelo motivo de sempre: um catálogo de componentes isolados não
 * prova que eles convivem. O título na Bricolage, o número na Sofia, a cor da
 * hora no bloco da próxima refeição (e só nele), a pedra no botão principal e
 * a área segura emulada — tudo isso só aparece na tela inteira. Troque o tema
 * na barra de ferramentas: a casca é a mesma nos dois.
 *
 * As palavras são as do vocabulário do produto: o app calcula, a pessoa
 * decide; nada de "restam" nem de "dieta".
 */
const meta = {
  title: "Padrões/Casca",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DESTINOS = [
  { value: "hoje", label: "Hoje", icon: "calendar" },
  { value: "livro", label: "Livro", icon: "book" },
  { value: "voce", label: "Você", icon: "user" },
] as const;

type Destino = (typeof DESTINOS)[number]["value"];

/**
 * O iPhone 16 em retrato: 59px em cima (o relógio e a ilha), 34px embaixo (o
 * indicador de início). A vitrine escreve os tokens da área segura no
 * contêiner, que é o mesmo jeito que um aplicativo os zera debaixo de um aviso
 * (ADR-011); `--co-statusbar-height` vai junto porque é resolvida no `:root`
 * (ADR-012).
 */
const IPHONE = {
  ["--co-safe-top" as string]: "59px",
  ["--co-safe-bottom" as string]: "34px",
  ["--co-statusbar-height" as string]: "59px",
} as CSSProperties;

function Hoje({ titulo }: { titulo: (texto: string) => ReactNode }) {
  const [dia, definirDia] = useState<"ontem" | "hoje" | "amanha">("hoje");
  return (
    <Stack gap={20}>
      {titulo("Hoje")}
      <SegmentedControl
        label="Dia"
        value={dia}
        onChange={definirDia}
        options={[
          { value: "ontem", label: "Ontem" },
          { value: "hoje", label: "Hoje" },
          { value: "amanha", label: "Amanhã" },
        ]}
        full
      />
      <Surface padding={20}>
        <Stat label="Meta do dia" value="1.950" unit="kcal" caption="Na medida da sua meta: perder, ritmo moderado." />
      </Surface>
      {/* A cor da hora é cor de LUGAR: o bloco do almoço leva a hora dele, e o
          botão principal continua sendo a pedra. */}
      <section style={hourStyle("12:30")} aria-labelledby="proxima-refeicao">
        <Surface padding={20}>
          <Stack gap={12}>
            <Stack direction="row" gap={8} align="center">
              <Badge tone="accent">12:30</Badge>
              <Text id="proxima-refeicao" variant="headline" as="h2">
                Almoço
              </Text>
            </Stack>
            <Text variant="callout" tone="secondary">
              Para fechar o alvo do almoço: arroz, feijão e frango grelhado.
            </Text>
            <Stack direction="row" gap={8}>
              <Button size="lg" full>
                Feita
              </Button>
              <Button variant="secondary" size="lg" full>
                Outra opção
              </Button>
            </Stack>
          </Stack>
        </Surface>
      </section>
    </Stack>
  );
}

function Livro({ titulo }: { titulo: (texto: string) => ReactNode }) {
  return (
    <Stack gap={20}>
      {titulo("Livro de receitas")}
      <EmptyState title="Nenhuma receita no livro" icon="book" action={<Button>Criar à mão</Button>}>
        As receitas que você guardar aparecem aqui, na medida da sua meta.
      </EmptyState>
    </Stack>
  );
}

function Voce({ titulo }: { titulo: (texto: string) => ReactNode }) {
  const [secao, abrir] = useState("objetivo");
  return (
    <Stack gap={20}>
      {titulo("Você")}
      <NavList
        label="Você"
        value={secao}
        onChange={abrir}
        items={[
          { value: "objetivo", label: "Objetivo e meta", description: "Perder · 1.950 kcal" },
          { value: "corpo", label: "Corpo" },
          { value: "privacidade", label: "Privacidade" },
          { value: "aparencia", label: "Aparência" },
        ]}
      />
      <Notice title="Ajuste automático ligado">Quando o peso parar por 3 semanas, a meta desce 100 kcal, com aviso.</Notice>
      <Disclosure summary="Por que perguntamos">A meta sai do seu peso, da sua altura e da sua idade.</Disclosure>
    </Stack>
  );
}

function Conteudo({ destino, titulo }: { destino: Destino; titulo: (texto: string) => ReactNode }) {
  if (destino === "livro") return <Livro titulo={titulo} />;
  if (destino === "voce") return <Voce titulo={titulo} />;
  return <Hoje titulo={titulo} />;
}

/** O indicador de início desenhado, para a área segura de baixo se ver. */
function Indicador() {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom: "8px",
        left: "50%",
        zIndex: 30,
        width: "134px",
        height: "5px",
        transform: "translateX(-50%)",
        borderRadius: "var(--co-radius-pill)",
        background: "var(--co-ink)",
      }}
    />
  );
}

function Celular({ iphone = false, inicio = "hoje" }: Readonly<{ iphone?: boolean; inicio?: Destino }>) {
  const [destino, ir] = useState<Destino>(inicio);
  // `contain: layout` faz da moldura o bloco de contenção do que é `fixed`: a
  // barra de abas e a faixa sob o relógio ficam neste aparelho, e não na
  // página do catálogo.
  return (
    <div
      style={{
        position: "relative",
        contain: "layout",
        width: "390px",
        height: "844px",
        overflow: "hidden",
        borderRadius: "var(--co-radius-container)",
        background: "var(--co-bg)",
        ...(iphone ? IPHONE : {}),
      }}
    >
      <div style={{ height: "100%", overflowY: "auto" }}>
        <Screen tabBar={<TabBar label="Principal" items={DESTINOS} value={destino} onChange={ir} position="fixed" />}>
          <Conteudo
            destino={destino}
            titulo={(texto) => <ScreenHeader title={texto} subtitle="quarta, 19 de novembro" />}
          />
        </Screen>
      </div>
      {iphone ? <Indicador /> : null}
    </div>
  );
}

function Desktop({ inicio = "hoje" }: Readonly<{ inicio?: Destino }>) {
  const [destino, ir] = useState<Destino>(inicio);
  return (
    <div
      style={{
        display: "flex",
        width: "1180px",
        height: "760px",
        overflow: "hidden",
        borderRadius: "var(--co-radius-container)",
        background: "var(--co-bg)",
      }}
    >
      <Rail
        label="Principal"
        items={DESTINOS.map((d) => ({ ...d, group: "Basalto" }))}
        value={destino}
        onChange={ir}
        header={
          <Text variant="headline" as="span">
            Basalto
          </Text>
        }
      />
      <main style={{ flex: "1 1 auto", overflowY: "auto", padding: "32px 40px" }}>
        {/* A coluna de leitura não estica numa tela larga. */}
        <div style={{ maxWidth: "720px" }}>
          <Conteudo destino={destino} titulo={(texto) => <PageHeader title={texto} subtitle="quarta, 19 de novembro" />} />
        </div>
      </main>
    </div>
  );
}

/** O celular, sem área segura: a barra de abas opaca, o título de 26px. */
export const CelularHoje: Story = { name: "Celular · Hoje", render: () => <Celular /> };

/** O livro vazio: o estado vazio com a saída. */
export const CelularLivro: Story = { name: "Celular · Livro", render: () => <Celular inicio="livro" /> };

/** O menu de Você: a lista de seções, o aviso e o "Por que perguntamos". */
export const CelularVoce: Story = { name: "Celular · Você", render: () => <Celular inicio="voce" /> };

/**
 * O iPhone 16, com a área segura emulada pelos tokens: nada que se toca fica
 * atrás da ilha, e as abas ficam acima do indicador de início.
 */
export const CelularComAreaSegura: Story = { name: "Celular · Área segura", render: () => <Celular iphone /> };

/** O desktop: o trilho, a coluna de leitura que não estica e o título de 30px com ponteiro fino. */
export const DesktopHoje: Story = {
  name: "Desktop · Hoje",
  parameters: { layout: "fullscreen" },
  render: () => <Desktop />,
};

export const DesktopVoce: Story = {
  name: "Desktop · Você",
  parameters: { layout: "fullscreen" },
  render: () => <Desktop inicio="voce" />,
};
