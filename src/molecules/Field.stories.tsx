import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Input } from "../atoms/Input";
import { Stack } from "../atoms/Stack";
import { Field } from "./Field";

/**
 * Rótulo, controle, dica e erro — amarrados.
 *
 * É a peça que o sistema devia ter desde o começo e não tinha: a ADR-003 já
 * dizia que erro de verdade "é uma mensagem junto do campo que a produziu", e o
 * campo não existia.
 *
 * O controle chega por **função**, e não como filho que o `Field` clona: clonar
 * é mágica que some no primeiro dia em que alguém envolve o campo num `<div>`
 * para posicioná-lo — o clone acerta o `<div>`, os atributos não chegam ao
 * controle, e nada disso aparece na tela, só no leitor de tela de quem não está
 * aqui para reclamar.
 */
const meta = {
  title: "Moléculas/Field",
  component: Field,
  args: {
    label: "Peso de hoje",
    hint: "A balança da manhã, antes do café.",
    children: (controle) => (
      <Input {...controle} defaultValue="83,1" unit="kg" align="end" inputMode="decimal" full />
    ),
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrão: Story = {
  render: (args) => (
    <div style={{ maxWidth: "320px" }}>
      <Field {...args}>
        {(controle) => (
          <Input {...controle} defaultValue="83,1" unit="kg" align="end" inputMode="decimal" full />
        )}
      </Field>
    </div>
  ),
};

/**
 * Recusado. O erro é vermelho **e** tem ícone **e** entra no
 * `aria-describedby` do campo — três sinais, porque cor sozinha não é sinal
 * (ADR-005), e porque um erro que só existe em vermelho não existe para quem
 * chegou ali pelo teclado com o leitor de tela ligado.
 */
export const Recusado: Story = {
  args: {
    label: "Peso de hoje",
    hint: "A balança da manhã, antes do café.",
    error: "Um peso entre 30 e 300 kg. 830 parece um dígito a mais.",
  },
  render: (args) => (
    <div style={{ maxWidth: "320px" }}>
      <Field {...args}>
        {(controle) => (
          <Input {...controle} defaultValue="830" unit="kg" align="end" invalid full />
        )}
      </Field>
    </div>
  ),
};

/**
 * A porta do Basalto: quatro campos e nenhuma pergunta a mais.
 *
 * O erro aparece **ao sair do campo**, e não a cada tecla: validar enquanto a
 * pessoa digita significa acusar "85 não é um peso válido" no meio da palavra
 * "85,4".
 */
export const AConta: Story = {
  name: "A conta",
  render: () => {
    const [idade, definirIdade] = useState("38");
    const [tocado, definirTocado] = useState(false);
    const numero = Number(idade.replace(",", "."));
    const erro =
      tocado && (!Number.isFinite(numero) || numero < 14 || numero > 100)
        ? "Uma idade entre 14 e 100 anos."
        : undefined;

    return (
      <Stack gap={20} style={{ maxWidth: "320px" }}>
        <Field label="Altura" hint="Sem sapato.">
          {(controle) => (
            <Input {...controle} defaultValue="178" unit="cm" align="end" inputMode="numeric" full />
          )}
        </Field>

        <Field label="Idade" {...(erro ? { error: erro } : {})}>
          {(controle) => (
            <Input
              {...controle}
              value={idade}
              unit="anos"
              align="end"
              inputMode="numeric"
              invalid={erro !== undefined}
              full
              onBlur={() => definirTocado(true)}
              onChange={(evento) => definirIdade(evento.target.value)}
            />
          )}
        </Field>
      </Stack>
    );
  },
};
