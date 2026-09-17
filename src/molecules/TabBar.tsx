import { Icon, type IconName } from "../atoms/Icon";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon: IconName;
}

export interface TabBarProps<T extends string> {
  /** Obrigatório: uma navegação sem nome é mais uma lista de links no leitor de tela. */
  label: string;
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * `fixed` (padrão) gruda no rodapé da janela e deixa o conteúdo rolar por
   * baixo do vidro. `absolute` faz o mesmo dentro de uma moldura posicionada —
   * a pré-visualização de aparelho no catálogo. `static` é para quem já tem o
   * próprio rodapé.
   *
   * Com `fixed`, a tela precisa reservar o espaço embaixo — `Screen` com
   * `tabBar` faz isso. Sem a reserva, a última linha da lista fica atrás da
   * barra e ninguém alcança: o defeito clássico de barra translúcida, que não
   * aparece no desenho, só no polegar.
   */
  position?: "fixed" | "absolute" | "static";
  className?: string | undefined;
}

/**
 * A barra de abas que flutua sobre o conteúdo.
 *
 * A aba atual muda de COR, de PESO e ganha `aria-current="page"`. Três sinais
 * para a mesma informação, e é de propósito: cor sozinha não é sinal (ADR-005).
 * Quem não separa ametista de cinza ainda lê o rótulo mais pesado; quem usa
 * leitor de tela ouve "página atual".
 *
 * São botões dentro de um `<nav>`, e não links, porque aqui a troca de aba é
 * estado do aplicativo. Num app com rotas de verdade, troque por `<a>` — o
 * `aria-current` continua valendo igual.
 */
export function TabBar<T extends string>({
  label,
  items,
  value,
  onChange,
  position = "fixed",
  className,
}: TabBarProps<T>) {
  const classe = className ? `co-tabbar ${className}` : "co-tabbar";
  return (
    <nav
      className={classe}
      aria-label={label}
      data-position={position === "fixed" ? undefined : position}
    >
      {items.map((item) => {
        const atual = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            className="co-tabbar__item"
            aria-current={atual ? "page" : undefined}
            onClick={() => onChange(item.value)}
          >
            <span className="co-tabbar__icon">
              <Icon name={item.icon} size={22} />
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
