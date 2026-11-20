import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { SegmentedControl } from "./SegmentedControl";

const ESTRATEGIAS = [
  { value: "padrao", label: "Padrão" },
  { value: "baixo", label: "Baixa em carbo" },
  { value: "ceto", label: "Cetogênica" },
  { value: "alto", label: "Alta em carbo" },
] as const;

type Estrategia = (typeof ESTRATEGIAS)[number]["value"];

/**
 * Escolha única entre poucas opções visíveis ao mesmo tempo.
 *
 * É `radiogroup`, e não um punhado de botões: com `role="radio"` o leitor de
 * tela anuncia "2 de 4, marcado", que é a informação que falta num grupo de
 * botões comuns.
 *
 * **Experimente pelo teclado.** Dê Tab até o controle e ande com as setas — não
 * com Tab. Um grupo de seis opções que exige seis Tabs para atravessar é um
 * grupo que ninguém atravessa; por isso só a opção marcada entra na ordem do
 * Tab, e as setas dão a volta na ponta.
 */
const meta = {
  title: "Moléculas/SegmentedControl",
  component: SegmentedControl,
  args: {
    label: "Estratégia de macros",
    options: ESTRATEGIAS,
    value: "padrao",
    onChange: () => {},
  },
} satisfies Meta<typeof SegmentedControl<Estrategia>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {
  render: () => {
    const [valor, definir] = useState<Estrategia>("padrao");
    return (
      <Stack gap={12}>
        <SegmentedControl
          label="Estratégia de macros"
          options={ESTRATEGIAS}
          value={valor}
          onChange={definir}
        />
        <Text variant="caption" tone="muted">
          escolhido: {valor}
        </Text>
      </Stack>
    );
  },
};

export const LarguraCheia: Story = {
  name: "Largura cheia",
  render: () => {
    const [valor, definir] = useState<"restante" | "consumido">("restante");
    return (
      <SegmentedControl
        full
        label="O que o número mostra"
        options={[
          { value: "restante", label: "Restante" },
          { value: "consumido", label: "Consumido" },
        ]}
        value={valor}
        onChange={definir}
      />
    );
  },
};

/**
 * Seis opções é onde o controle começa a apertar. Acima disso, o padrão certo
 * é uma lista, não um segmentado — e a navegação por seta é o que mantém as
 * seis alcançáveis sem seis Tabs.
 */
export const SeisOpções: Story = {
  name: "Seis opções",
  render: () => {
    const [valor, definir] = useState("4");
    return (
      <Stack gap={12}>
        <SegmentedControl
          full
          label="Refeições por dia"
          options={["1", "2", "3", "4", "5", "6"].map((n) => ({ value: n, label: n }))}
          value={valor}
          onChange={definir}
        />
        <Text variant="caption" tone="muted">
          {valor} refeições por dia
        </Text>
      </Stack>
    );
  },
};

const NUMEROS = ["1", "2", "3", "4", "5", "6", "7", "8"].map((n) => ({ value: n, label: n }));

/** A moldura de um telefone de 320px, com o respiro de 16px dos lados. */
function A320({ children }: { children: ReactNode }) {
  return <div style={{ width: "320px", padding: "0 16px", boxSizing: "border-box" }}>{children}</div>;
}

/**
 * A 320px, o mínimo da tela (WCAG 1.4.10). Toda opção continua com 44px de
 * largura e de altura, e o grupo nunca passa da largura: quando as opções no
 * mínimo não cabem numa fileira, ele quebra em linhas. Continua um
 * `radiogroup`, com uma parada do Tab, as setas e Home/End.
 *
 * **O que conferir.** Nenhuma das três rola a página de lado; nenhuma opção
 * fica mais estreita que 44px; os quatro rótulos longos ficam inteiros, em
 * duas fileiras.
 */
export const A320px: Story = {
  name: "A 320px — 6 e 8 opções, rótulos longos",
  render: () => {
    const [seis, definirSeis] = useState("4");
    const [oito, definirOito] = useState("4");
    const [estrategia, definirEstrategia] = useState<Estrategia>("padrao");
    return (
      <A320>
        <Stack gap={20}>
          <SegmentedControl full label="Refeições por dia (até 6)" options={NUMEROS.slice(0, 6)} value={seis} onChange={definirSeis} />
          <SegmentedControl full label="Refeições por dia (até 8)" options={NUMEROS} value={oito} onChange={definirOito} />
          <SegmentedControl label="Estratégia de macros" options={ESTRATEGIAS} value={estrategia} onChange={definirEstrategia} />
        </Stack>
      </A320>
    );
  },
};
