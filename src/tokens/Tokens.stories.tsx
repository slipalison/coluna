import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { Grid } from "../atoms/Grid";
import { Stack } from "../atoms/Stack";
import { Surface } from "../atoms/Surface";
import { Text } from "../atoms/Text";
import { readToken, semanticTokens, type SemanticToken } from "./tokens";

/**
 * Os tokens, lidos do navegador agora — troque o tema na barra de ferramentas
 * e os valores abaixo mudam.
 *
 * Duas camadas: a primitiva guarda o valor (`--co-amethyst-500`) e a semântica
 * guarda o papel (`--co-accent`). **Só a semântica muda com o tema**, e
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
  ["Superfície", ["canvas", "surface", "surface-raised", "surface-sunken", "overlay"]],
  ["Traço", ["border", "border-strong", "line", "track", "overlay-line"]],
  // Cinco degraus de texto, em contraste decrescente, e `icon-muted` no fim —
  // que é o único que NÃO serve para texto: ele passa em 3:1, não em 4,5:1.
  ["Texto", ["text", "text-body", "text-secondary", "text-muted", "text-subtle", "icon-muted"]],
  ["Acento", ["accent", "accent-hover", "accent-contrast", "accent-soft"]],
  ["Estado", ["status", "status-border", "danger", "danger-soft"]],
  // A cor de cada macro é do SISTEMA, não de quem monta a tela: proteína tem
  // que ser da mesma cor em todas as telas do aplicativo.
  ["Macro", ["macro-protein", "macro-carb", "macro-fat"]],
];

function Amostra({ token, de }: { token: SemanticToken; de: Element | null }) {
  const [valor, definir] = useState("");

  // Sem lista de dependências de propósito: o valor só pode ser lido DEPOIS
  // do commit, que é quando o `data-theme` novo já está no DOM. Lido durante o
  // render, ele viria um quadro atrasado. O React desiste sozinho quando a
  // string não mudou, então isto assenta numa passada extra e para.
  //
  // Lido do ELEMENTO, e não do documento: com tema por subárvore o acento daqui
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
            border: "1px solid var(--co-border)",
          }}
        />
        <Text variant="caption" style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
          --co-{token}
        </Text>
        <Text variant="caption" tone="muted" numeric style={{ fontSize: "11px" }}>
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
          <div style={{ width: `${n}px`, height: "16px", background: "var(--co-accent)" }} />
          <Text variant="caption" tone="muted" numeric style={{ fontSize: "10px" }}>
            {n}
          </Text>
        </Stack>
      ))}
    </Stack>
  ),
};

/**
 * O raio máximo do sistema é 4px, e a maior parte dos componentes usa 0.
 * Basalto lasca em coluna hexagonal, não em pílula — é decisão de marca, não
 * economia.
 */
export const Forma: Story = {
  render: () => (
    <Stack gap={16}>
      <Stack direction="row" gap={12} align="center">
        {[0, 2, 4].map((r) => (
          <Stack key={r} gap={6} align="center">
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "var(--co-surface-raised)",
                border: "1px solid var(--co-border-strong)",
                borderRadius: `var(--co-radius-${r})`,
              }}
            />
            <Text variant="caption" tone="muted" style={{ fontSize: "10px" }}>
              radius-{r}
            </Text>
          </Stack>
        ))}
      </Stack>
      <Stack direction="row" gap={12} align="center">
        <div
          style={{
            width: "var(--co-target-min)",
            height: "var(--co-target-min)",
            background: "var(--co-accent-soft)",
            border: "1px solid var(--co-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text variant="caption" tone="accent" numeric>
            44
          </Text>
        </div>
        <Text variant="caption" tone="muted" style={{ maxWidth: "44ch" }}>
          Alvo mínimo de toque. É piso da API, não recomendação: não existe <code>size="sm"</code>{" "}
          no botão.
        </Text>
      </Stack>
    </Stack>
  ),
};
