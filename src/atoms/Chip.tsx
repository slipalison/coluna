import { Icon, type IconName } from "./Icon";

interface ChipBase {
  /**
   * Texto do chip, e ele é `string` de propósito: o botão de remover se chama
   * "Remover sem lactose", e um `ReactNode` não vira nome acessível.
   */
  label: string;
  icon?: IconName;
  className?: string | undefined;
}

/**
 * Chip escolhível (vira `<button aria-pressed>`) ou removível (texto com um
 * botão de fechar do lado). Nunca os dois.
 *
 * A recusa está no tipo, e não num aviso na documentação, porque a versão com
 * os dois é botão dentro de botão — HTML inválido, que o navegador conserta
 * sozinho tirando um dos dois do lugar, e o defeito só aparece no teclado de
 * quem tenta remover e acaba escolhendo.
 */
export type ChipProps =
  | (ChipBase & {
      selected?: boolean;
      onClick?: (() => void) | undefined;
      onRemove?: undefined;
    })
  | (ChipBase & {
      onRemove: () => void;
      selected?: undefined;
      onClick?: undefined;
    });

/**
 * Chip: uma restrição alimentar, um ingrediente, um filtro ligado.
 *
 * É diferente de `Badge` em uma coisa que decide tudo: o selo é LEITURA, o chip
 * é AÇÃO. Por isso ele tem 44px de alvo e o selo não tem — e por isso o selo
 * não recebe evento (ADR-003).
 *
 * Escolhido muda de fundo, de peso e ganha `aria-pressed="true"`. Três sinais
 * para a mesma informação: cor sozinha não é sinal (ADR-005).
 */
export function Chip(props: ChipProps) {
  const { label, icon, className } = props;
  const classe = className ? `co-chip ${className}` : "co-chip";

  if (props.onRemove) {
    return (
      <span className={classe} data-removable="true">
        {icon ? <Icon className="co-chip__icon" name={icon} size={15} /> : null}
        <span className="co-chip__label">{label}</span>
        <button
          type="button"
          className="co-chip__remove"
          aria-label={`Remover ${label}`}
          onClick={props.onRemove}
        >
          <Icon name="close" size={14} />
        </button>
      </span>
    );
  }

  const { selected = false, onClick } = props;

  if (!onClick) {
    return (
      <span className={classe} data-selected={selected ? "true" : undefined}>
        {icon ? <Icon className="co-chip__icon" name={icon} size={15} /> : null}
        <span className="co-chip__label">{label}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={classe}
      data-selected={selected ? "true" : undefined}
      aria-pressed={selected}
      onClick={onClick}
    >
      {icon ? <Icon className="co-chip__icon" name={icon} size={15} /> : null}
      <span className="co-chip__label">{label}</span>
    </button>
  );
}
