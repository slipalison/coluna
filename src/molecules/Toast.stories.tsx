import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { Button } from "../atoms/Button";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { Toast } from "./Toast";

/**
 * O aviso passageiro, com "Desfazer".
 *
 * Anuncia por região viva (que existe antes da mensagem), não rouba o foco,
 * some no tempo dado por quem usa e **pausa** enquanto tiver o foco ou o
 * ponteiro, até um teto também dado por quem usa. Fechou com o foco dentro, o
 * foco volta para onde estava. O Esc dispensa.
 *
 * Nas histórias ele fica no fluxo (`position="static"`); no app, preso
 * embaixo, acima das abas e da barra de ação.
 */
const meta = {
  title: "Moléculas/Toast",
  component: Toast,
  args: {
    open: true,
    position: "static",
    message: "Almoço marcado como feito",
    actionLabel: "Desfazer",
    duration: 6000,
    maxDuration: 30000,
    onClose: () => {},
    onAction: () => {},
  },
  argTypes: {
    tone: { control: "inline-radio", options: ["neutral", "warn"] },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Aberto, parado: o desenho. Nas histórias o tempo corre de verdade; aqui ele não fecha porque `onClose` não fecha. */
export const Aberto: Story = {};

/** O que deu errado e não bloqueia: ícone de atenção e o texto, nunca só a cor. */
export const Atenção: Story = {
  name: "Atenção",
  args: { tone: "warn", message: "Não deu para trocar agora. Tente de novo.", actionLabel: undefined },
};

/** Uma mensagem longa quebra, e a ação fica inteira ao lado. */
export const MensagemLonga: Story = {
  name: "Mensagem longa",
  args: { message: "Guardada no espaço 2 do almoço. A do espaço 2 voltou para o livro." },
};

/**
 * De verdade: marque feita, e o aviso aparece por 6 s. Passe o ponteiro ou
 * leve o foco (Tab) até ele, e o tempo para; o teto é de 30 s. Desfazer
 * devolve o foco a "Marcar feita".
 */
export const DeVerdade: Story = {
  name: "De verdade",
  args: { open: false },
  render: function DeVerdade(args) {
    const [aberto, abrir] = useState(false);
    const [feita, marcar] = useState(false);
    const [ultimo, registrar] = useState("");
    const botao = useRef<HTMLButtonElement>(null);
    return (
      <Stack gap={16}>
        <div>
          <Button
            ref={botao}
            onClick={() => {
              marcar(true);
              abrir(true);
            }}
          >
            {feita ? "Feita" : "Marcar feita"}
          </Button>
        </div>
        <Text variant="footnote" tone="secondary" role="note">
          {ultimo ? `Fechou por: ${ultimo}` : "Ainda não fechou."}
        </Text>
        <Toast
          {...args}
          open={aberto}
          returnFocus={botao}
          onAction={() => marcar(false)}
          onClose={(motivo) => {
            registrar(motivo);
            abrir(false);
          }}
        />
      </Stack>
    );
  },
};

/** A 320 px: a mensagem quebra, a ação e o fechar ficam com os 44 px. */
export const Em320px: Story = {
  name: "A 320 px",
  render: (args) => (
    <div style={{ width: "288px" }}>
      <Toast {...args} />
    </div>
  ),
};
