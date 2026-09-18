import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Input } from "./Input";

/**
 * O campo de entrada, sozinho.
 *
 * Aqui ele aparece com `aria-label` para o catálogo não ficar com um campo sem
 * nome — mas **esse não é o jeito de usar**. Na tela, o campo vai dentro de um
 * `Field`, que dá o rótulo visível, a dica e o erro, e amarra os três ao
 * controle. Rótulo que só existe para o leitor de tela é rótulo que a pessoa
 * vidente não tem.
 *
 * A altura é 44px pelo mesmo motivo do botão, e a fonte é 16px por um motivo de
 * plataforma: abaixo disso o Safari do iPhone dá zoom ao focar, e a tela salta.
 */
const meta = {
  title: "Átomos/Input",
  component: Input,
  args: {
    "aria-label": "Peso de hoje",
    defaultValue: "83,1",
    unit: "kg",
    align: "end",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {};

/**
 * Sem unidade e alinhado à esquerda: o caso do texto livre — o nome que a
 * pessoa dá a uma refeição, a busca no catálogo.
 */
export const Texto: Story = {
  args: {
    "aria-label": "Nome da refeição",
    defaultValue: "Café reforçado",
    unit: undefined,
    align: "start",
    full: true,
  },
};

/**
 * Recusado. A moldura fica vermelha E o campo ganha `aria-invalid` — a cor
 * sozinha não é sinal (ADR-005). A mensagem não está aqui: ela é do `Field`.
 */
export const Recusado: Story = {
  args: {
    "aria-label": "Peso de hoje",
    defaultValue: "830",
    invalid: true,
  },
};

/**
 * A unidade entra no `aria-describedby` do campo. Sem isso, quem usa leitor de
 * tela ouve "peso de hoje" e digita 83 sem saber se o campo quer quilo ou
 * libra — e o `kg` impresso na tela não existe para essa pessoa.
 */
export const ComTeclado: Story = {
  name: "Digitando",
  render: () => {
    const [valor, definir] = useState("83,1");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "320px" }}>
        <Input
          aria-label="Peso de hoje"
          inputMode="decimal"
          value={valor}
          unit="kg"
          align="end"
          full
          onChange={(evento) => definir(evento.target.value)}
        />
        <span style={{ color: "var(--co-text-muted)", fontSize: "var(--co-text-12)" }}>
          valor: {valor === "" ? "(vazio)" : valor}
        </span>
      </div>
    );
  },
};
