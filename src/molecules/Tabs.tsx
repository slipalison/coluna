import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabsItem<T extends string> {
  value: T;
  /** O nome da aba, escrito: aba de ícone sozinho não tem de onde tirar o nome. */
  label: string;
  /** O painel que a aba mostra. */
  content: ReactNode;
}

export interface TabsProps<T extends string> {
  /** Obrigatório: o nome da fileira de abas ("Receita"), que o leitor de tela diz ao entrar nela. */
  label: string;
  items: readonly TabsItem<T>[];
  /** A aba aberta, controlada. Sem ela, as abas guardam a escolha sozinhas, a partir de `defaultValue`. */
  value?: T | undefined;
  defaultValue?: T | undefined;
  onChange?: ((value: T) => void) | undefined;
  className?: string | undefined;
}

/**
 * Abas dentro de um card: o mesmo card mostra "Ingredientes", "Preparo" e
 * "Macros", um painel de cada vez.
 *
 * É o padrão de abas do WAI-ARIA, com ativação automática: `tablist`, `tab` e
 * `tabpanel`, e a fileira custa um Tab só (tabindex itinerante). As setas para
 * os lados andam entre as abas e dão a volta na ponta; Home e End vão à
 * primeira e à última. A aba que recebe o foco é a que abre — com três ou
 * quatro painéis leves, abrir no foco é o que a pessoa espera.
 *
 * - **O painel rola por dentro** quando o conteúdo não cabe — letra a 200%, 320
 *   px, um card de altura fixa —, para os dois lados: a página nunca rola de
 *   lado por causa dele. Por isso o painel é uma parada do Tab (`tabIndex={0}`),
 *   como o corpo da folha (ADR-018): só de texto, ele não teria por onde ser
 *   rolado pelo teclado. O anel fica por dentro.
 * - **A fileira** tem o limite de controle, como o segmentado, e a aba aberta
 *   muda de fundo e de peso, e não só de cor. Nome comprido a 200% não empurra
 *   a página: a fileira rola de lado dentro de si, e a aba focada entra à vista.
 * - Os painéis fechados ficam montados e `hidden`: o que a pessoa rolou ou
 *   escreveu num deles continua lá.
 */
export function Tabs<T extends string>({
  label,
  items,
  value,
  defaultValue,
  onChange,
  className,
}: Readonly<TabsProps<T>>) {
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [interno, definirInterno] = useState<T | undefined>(defaultValue);
  const pedido = value ?? interno;
  const achado = items.findIndex((item) => item.value === pedido);
  // Sem escolha que case, a primeira aba abre — um card sem painel nenhum é
  // um card vazio, e a fileira sem aba no Tab some da ordem do teclado.
  const aberta = achado === -1 ? 0 : achado;
  const classe = className ? `co-tabs ${className}` : "co-tabs";

  function abrir(indice: number) {
    const item = items[indice];
    if (!item) return;
    if (value === undefined) definirInterno(item.value);
    onChange?.(item.value);
    refs.current[indice]?.focus();
  }

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const total = items.length;
    switch (evento.key) {
      case "ArrowRight":
        evento.preventDefault();
        abrir((indice + 1) % total);
        break;
      case "ArrowLeft":
        evento.preventDefault();
        abrir((indice - 1 + total) % total);
        break;
      case "Home":
        evento.preventDefault();
        abrir(0);
        break;
      case "End":
        evento.preventDefault();
        abrir(total - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div className={classe}>
      <div className="co-tabs__list" role="tablist" aria-label={label}>
        {items.map((item, indice) => {
          const marcada = indice === aberta;
          return (
            <button
              key={item.value}
              ref={(no) => {
                refs.current[indice] = no;
              }}
              id={`${base}-aba-${indice}`}
              type="button"
              role="tab"
              aria-selected={marcada}
              aria-controls={`${base}-painel-${indice}`}
              tabIndex={marcada ? 0 : -1}
              className="co-tabs__tab"
              onClick={() => abrir(indice)}
              onKeyDown={(evento) => aoTeclar(evento, indice)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, indice) => (
        <div
          key={item.value}
          id={`${base}-painel-${indice}`}
          role="tabpanel"
          aria-labelledby={`${base}-aba-${indice}`}
          tabIndex={0}
          hidden={indice !== aberta}
          className="co-tabs__panel"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
