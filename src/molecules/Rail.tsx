import { useId, type ReactNode } from "react";
import { Icon, type IconName } from "../atoms/Icon";
import { Text } from "../atoms/Text";
import { VisuallyHidden } from "../atoms/VisuallyHidden";

export interface RailItem<T extends string> {
  value: T;
  label: string;
  icon: IconName;
  /**
   * O grupo em que o destino aparece. Os itens sem grupo vêm primeiro, na ordem
   * em que chegaram; os grupos, na ordem em que aparecem na lista.
   *
   * No Basalto os grupos são "Todo dia" e "De vez em quando", e o critério é
   * FREQUÊNCIA, não assunto. Agrupar por assunto ("Comida", "Corpo", "Conta")
   * fica bonito na documentação e obriga a pensar toda vez; agrupar pelo que se
   * usa todo dia põe as quatro coisas de sempre onde a mão já vai.
   */
  group?: string;
}

export interface RailProps<T extends string> {
  /** Obrigatório: uma navegação sem nome é mais uma lista de links no leitor de tela. */
  label: string;
  items: readonly RailItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Só o ícone, em 72px de largura. O rótulo continua no leitor de tela e no `title`. */
  collapsed?: boolean;
  /** O rodapé do trilho: a conta, o tema, a versão. */
  footer?: ReactNode;
  className?: string | undefined;
}

/**
 * A navegação lateral do desktop.
 *
 * É a contraparte da `TabBar`, e as duas existem porque a diferença entre
 * telefone e desktop não é de tamanho, é de quantidade: embaixo cabem quatro
 * destinos e o resto vai para "Mais"; na lateral cabem os sete, e "Mais" deixa
 * de ser uma gaveta com o que não coube. Esticar a `TabBar` para 1440px daria
 * uma barra de abas gigante com quatro itens e uma gaveta que não precisa mais
 * existir.
 *
 * O destino atual muda de COR, de PESO, ganha uma marca à esquerda e
 * `aria-current="page"`. Cor sozinha não é sinal (ADR-005), e num trilho onde
 * todos os itens têm o mesmo ícone-mais-rótulo a marca é o que se enxerga de
 * longe.
 *
 * São botões dentro de um `<nav>`, como na `TabBar`: aqui a troca é estado do
 * aplicativo. Num app com rotas de verdade, troque por `<a>` — o `aria-current`
 * continua valendo igual.
 */
export function Rail<T extends string>({
  label,
  items,
  value,
  onChange,
  collapsed = false,
  footer,
  className,
}: RailProps<T>) {
  const base = useId();
  const classe = className ? `co-rail ${className}` : "co-rail";

  const grupos: { nome: string | undefined; itens: RailItem<T>[] }[] = [];
  for (const item of items) {
    const atual = grupos.find((g) => g.nome === item.group);
    if (atual) atual.itens.push(item);
    else grupos.push({ nome: item.group, itens: [item] });
  }

  function botao(item: RailItem<T>) {
    const atual = item.value === value;
    return (
      <button
        key={item.value}
        type="button"
        className="co-rail__item"
        aria-current={atual ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        onClick={() => onChange(item.value)}
      >
        <span className="co-rail__icon">
          <Icon name={item.icon} size={20} />
        </span>
        {collapsed ? <VisuallyHidden>{item.label}</VisuallyHidden> : item.label}
      </button>
    );
  }

  return (
    <nav className={classe} aria-label={label} data-collapsed={collapsed ? "true" : undefined}>
      <div className="co-rail__groups">
        {grupos.map((grupo, indice) => {
          if (grupo.nome === undefined) {
            return (
              <div className="co-rail__group" key={`sem-grupo-${indice}`}>
                {grupo.itens.map(botao)}
              </div>
            );
          }

          const idGrupo = `${base}-grupo-${indice}`;
          return (
            <div className="co-rail__group" key={grupo.nome} role="group" aria-labelledby={idGrupo}>
              {/*
                Recolhido, o versalete sai da tela mas continua nomeando o grupo:
                tirar o nome junto com a largura deixaria sete botões sem
                hierarquia nenhuma no leitor de tela.
              */}
              {collapsed ? (
                <VisuallyHidden id={idGrupo}>{grupo.nome}</VisuallyHidden>
              ) : (
                <Text id={idGrupo} className="co-rail__group-label" variant="micro" tone="subtle">
                  {grupo.nome}
                </Text>
              )}
              {grupo.itens.map(botao)}
            </div>
          );
        })}
      </div>

      {footer ? <div className="co-rail__footer">{footer}</div> : null}
    </nav>
  );
}
