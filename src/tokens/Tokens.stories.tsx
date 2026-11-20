import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { Grid } from "../atoms/Grid";
import { Stack } from "../atoms/Stack";
import { Surface } from "../atoms/Surface";
import { Text } from "../atoms/Text";
import { hourStops, hourStyle, hourVars } from "../theme/hour";
import { readToken, semanticTokens, type SemanticToken } from "./tokens";

/**
 * Os tokens, lidos do navegador agora — troque o tema na barra de ferramentas
 * e os valores abaixo mudam.
 *
 * Duas camadas: a primitiva guarda o valor (`--co-pomes-100`) e a semântica
 * guarda o papel (`--co-ink`). **Só a semântica muda com o tema**, e
 * componente nenhum lê primitiva.
 *
 * A fonte é `tokens/*.json` no formato W3C Design Tokens; o Style Dictionary
 * gera o CSS e esta lista de nomes na mesma passada, para que uma não possa
 * divergir da outra.
 */
const meta = {
  title: "Fundamentos/Tokens",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const GRUPOS: [string, SemanticToken[]][] = [
  // A pedra: o fundo, o painel, o rebaixado (fundo de texto) e o pressionado
  // (trilho de barra, NUNCA fundo de texto).
  ["Pedra", ["bg", "surface", "surface-2", "surface-3"]],
  // Três degraus de texto, em contraste decrescente; `on-ink` é o texto sobre a
  // tinta sólida (o botão primário, o escolhido).
  ["Tinta", ["ink", "ink-2", "ink-3", "on-ink"]],
  // `line` é a fissura do que não se toca; `control` é o limite do que se toca
  // (campo, busca, chip, segmentado), a 3:1 sobre o fundo.
  ["Traço", ["line", "control", "focus"]],
  ["Estado", ["ok", "warn", "bad", "ok-soft", "warn-soft", "bad-soft"]],
  // A cor da hora: cor de LUGAR, nunca de ação. O matiz e o croma vêm do
  // relógio (`hourStyle`); a luminosidade, do tema.
  ["Hora", ["hora", "hora-ink", "hora-soft", "on-hora"]],
  // Os papéis do alimento: a mesma luminosidade, nenhum grita mais que o outro.
  ["Papel do alimento", ["role-protein", "role-carb", "role-veg", "role-fruit", "role-dairy", "role-fat"]],
];

function Amostra({ token, de }: { token: SemanticToken; de: Element | null }) {
  const [valor, definir] = useState("");

  // Sem lista de dependências de propósito: o valor só pode ser lido DEPOIS
  // do commit, que é quando o `data-theme` novo já está no DOM. Lido durante o
  // render, ele viria um quadro atrasado. O React desiste sozinho quando a
  // string não mudou, então isto assenta numa passada extra e para.
  //
  // Lido do ELEMENTO, e não do documento: com tema por subárvore a cor daqui
  // e o da página podem ser cores diferentes ao mesmo tempo.
  useEffect(() => {
    definir(de ? readToken(token, de) : "");
  });

  return (
    <Surface bordered padding={12}>
      <Stack gap={8}>
        <div
          style={{
            height: "52px",
            background: `var(--co-${token})`,
            border: "1px solid var(--co-line)",
          }}
        />
        <Text variant="caption" style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
          --co-{token}
        </Text>
        <Text variant="caption" tone="muted" numeric>
          {valor || "—"}
        </Text>
      </Stack>
    </Surface>
  );
}

export const Cor: Story = {
  render: () => {
    const raiz = useRef<HTMLDivElement>(null);
    const [pronto, definir] = useState(false);
    useEffect(() => definir(true), []);

    return (
      <div ref={raiz} style={{ display: "flex", flexDirection: "column", gap: "var(--co-space-24)" }}>
        {GRUPOS.map(([titulo, tokens]) => (
          <Stack key={titulo} gap={10}>
            <Text variant="label">{titulo}</Text>
            <Grid columns={4} gap={12}>
              {tokens.map((token) => (
                <Amostra key={token} token={token} de={pronto ? raiz.current : null} />
              ))}
            </Grid>
          </Stack>
        ))}
        <Text variant="caption" tone="muted" style={{ maxWidth: "58ch" }}>
          {semanticTokens.length} tokens semânticos, e os dois temas cobrem exatamente o mesmo
          conjunto — isso é conferido na geração, não na revisão.
        </Text>
      </div>
    );
  },
};

const ESPACOS = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40] as const;

/**
 * O nome do token é o número de pixels. Um `--co-space-6` diz onde encaixa; um
 * `--co-space-md` exigiria decorar a tabela.
 */
export const Espaço: Story = {
  render: () => (
    <Stack direction="row" gap={8} align="flex-end" wrap>
      {ESPACOS.map((n) => (
        <Stack key={n} gap={6} align="center">
          <div style={{ width: `${n}px`, height: "16px", background: "var(--co-hora)" }} />
          <Text variant="caption" tone="muted" numeric>
            {n}
          </Text>
        </Stack>
      ))}
    </Stack>
  ),
};

/**
 * O raio é do PAPEL (ADR-004, ADR-022): o que se toca tem 14px, a vitrine que
 * segura conteúdo 22px, a folha 28px em cima, o diálogo 24px, o chip e o
 * segmentado são pílula, e o conteúdo (ponto, ripa, fio) é reto.
 */
export const Forma: Story = {
  render: () => (
    <Stack gap={16}>
      <Stack direction="row" gap={16} align="flex-end" wrap>
        {(
          [
            ["content", "conteúdo · 0"],
            ["inset", "dentro do trilho · 10,5"],
            ["control", "controle · 14"],
            ["container", "cartão · 22"],
            ["dialog", "diálogo · 24"],
            ["sheet", "folha · 28"],
            ["pill", "pílula"],
          ] as const
        ).map(([papel, legenda]) => (
          <Stack key={papel} gap={6} align="center">
            <div
              style={{
                width: "72px",
                height: "56px",
                background: "var(--co-surface)",
                border: "var(--co-control-width) solid var(--co-control)",
                borderRadius: `var(--co-radius-${papel})`,
              }}
            />
            <Text variant="caption" tone="muted">
              {legenda}
            </Text>
          </Stack>
        ))}
      </Stack>
      <Text variant="caption" tone="muted" style={{ maxWidth: "52ch" }}>
        O limite de controle tem 1,5px em <code>--co-control</code>; a fissura que só separa tem 1px em{" "}
        <code>--co-line</code>. A sombra fica só no que flutua.
      </Text>
    </Stack>
  ),
};

function CartaoDaHora({ time, nome }: { time: string; nome: string }) {
  // A hora entra pelo CSSOM (a prop `style`), e nunca pelo atributo: a CSP do
  // Basalto barra o atributo `style` na marcação (ADR-024).
  return (
    <div style={hourStyle(time)}>
      <Surface padding={16}>
        <Stack gap={10}>
          <div style={{ height: "40px", borderRadius: "var(--co-radius-control)", background: "var(--co-hora)" }} />
          <div
            style={{
              padding: "var(--co-space-8) var(--co-space-12)",
              borderRadius: "var(--co-radius-control)",
              background: "var(--co-hora-soft)",
            }}
          >
            <Text variant="callout" tone="accent" weight="semibold">
              {nome}
            </Text>
          </div>
          <Text variant="caption" tone="muted" numeric>
            {time} · h {hourVars(time).h} · c {hourVars(time).c}
          </Text>
        </Stack>
      </Surface>
    </div>
  );
}

/**
 * A cor da hora: o relógio dá o matiz e o croma (`hourStyle`), o tema dá a
 * luminosidade. As cinco paradas da identidade e, entre elas, a interpolação
 * (12:30 já anda do céu para o entardecer). A faixa é o preenchimento
 * (`--co-hora`), o texto é a tinta da hora (`--co-hora-ink`) sobre o lavado
 * (`--co-hora-soft`). É cor de lugar, nunca de ação.
 */
export const Hora: Story = {
  render: () => (
    <Stack gap={16}>
      <Grid columns={3} gap={12}>
        <CartaoDaHora time="06:00" nome="Aurora" />
        <CartaoDaHora time="09:00" nome="Manhã" />
        <CartaoDaHora time="12:00" nome="Meio-dia" />
        <CartaoDaHora time="12:30" nome="Almoço" />
        <CartaoDaHora time="16:00" nome="Entardecer" />
        <CartaoDaHora time="20:00" nome="Noite" />
      </Grid>
      <Text variant="caption" tone="muted" style={{ maxWidth: "58ch" }}>
        Paradas: {hourStops.map((parada) => parada.time).join(", ")}. Das 20h às 6h a noite atravessa a meia-noite sem salto.
      </Text>
    </Stack>
  ),
};

/**
 * "A pedra assenta, o sol desliza": os tempos e as curvas da identidade. A
 * resposta ao toque leva 90ms, abaixo dos 100ms do piso.
 */
export const Movimento: Story = {
  render: () => (
    <Grid columns={2} gap={12}>
      {(
        [
          ["--co-duration-press", "o toque (escala 0,97)"],
          ["--co-duration-quick", "hover, troca de estado"],
          ["--co-duration-base", "entrada de bloco, tema"],
          ["--co-duration-slow", "folha, tela, painel"],
          ["--co-duration-roll", "o número que rola"],
          ["--co-ease-settle", "a entrada (padrão)"],
          ["--co-ease-spring", "selo, célula, check"],
          ["--co-ease-move", "deslocamento"],
          ["--co-ease-exit", "a saída"],
        ] as const
      ).map(([token, uso]) => (
        <Surface key={token} padding={12}>
          <Text variant="caption" style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
            {token}
          </Text>
          <Text variant="caption" tone="muted">
            {uso}
          </Text>
        </Surface>
      ))}
    </Grid>
  ),
};
