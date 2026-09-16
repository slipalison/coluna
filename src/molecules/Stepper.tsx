import { Icon } from "../atoms/Icon";

export interface StepperProps {
  /** Obrigatório: os dois botões só dizem "mais" e "menos"; o nome está aqui. */
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Como o número aparece — "4 colheres", "1,5 kg". O valor cru continua sendo `value`. */
  format?: (value: number) => string;
  className?: string | undefined;
}

/**
 * Menos, número, mais.
 *
 * Os botoes tem 46px e nao 44 porque eles andam em par colado: com o alvo no
 * limite exato, o dedo que erra por 2px aperta o outro — e aqui o outro faz o
 * contrario do que a pessoa queria.
 *
 * O numero e `output` com `aria-live="polite"`: quem usa leitor de tela aperta
 * "mais" e ouve o valor novo, sem precisar sair do botao e voltar.
 */
export function Stepper({
  label,
  value,
  onChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  format,
  className,
}: StepperProps) {
  const classe = className ? `co-stepper ${className}` : "co-stepper";
  const noPiso = value - step < min;
  const noTeto = value + step > max;

  return (
    <div className={classe} role="group" aria-label={label}>
      <button
        type="button"
        className="co-stepper__button"
        aria-label={`Diminuir ${label}`}
        disabled={noPiso}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        <Icon name="minus" size={18} />
      </button>
      <output className="co-stepper__value" aria-live="polite">
        {format ? format(value) : value}
      </output>
      <button
        type="button"
        className="co-stepper__button"
        aria-label={`Aumentar ${label}`}
        disabled={noTeto}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}
