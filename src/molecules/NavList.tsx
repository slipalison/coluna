import { useId, type ReactNode } from "react";
import { Text } from "../atoms/Text";

export interface NavListItem<T extends string> {
  value: T;
  label: string;
  /**
   * A linha de baixo: o que a seção guarda hoje ("perder 0,5 kg/semana ·
   * 1.917"), o resumo do item ("4 porções · 30 min"). Uma linha só — o que não
   * cabe é cortado com reticências, e a lista não muda de altura por isso.
   */
  description?: ReactNode;
  /** O que abre o item: um `Dot` com a cor da base de alimentos. */
  leading?: ReactNode;
  /** O que fica à direita: uma contagem, as kcal da receita. */
  trailing?: ReactNode;
  /** O grupo em que o item aparece. Os grupos saem na ordem em que aparecem na lista. */
  group?: string;
}

export interface NavListProps<T extends string> {
  /** Obrigatório: uma lista de destinos sem nome é mais uma lista no leitor de tela. */
  label: string;
  items: readonly NavListItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * O que um item ABRE, e daí saem o elemento e o anúncio — da mesma decisão,
   * para não poderem discordar:
   *
   * - `page` (padrão): cada item é uma página — as seções dos Ajustes. Sai um
   *   `<nav>`, e o item aberto é `aria-current="page"`.
   * - `detail`: cada item abre ao lado, na mesma página — a receita na lista
   *   e detalhe, a base de alimentos da busca. Sai um grupo, e o item aberto é
   *   `aria-current="true"`. Não é navegação: a página não muda, muda o painel.
   */
  opens?: "page" | "detail";
  className?: string | undefined;
}

/**
 * A lista que escolhe o que a coluna do lado mostra.
 *
 * No telefone isto é uma lista agrupada com seta, e cada linha empurra uma tela
 * nova por cima da anterior. No desktop há largura para as duas coisas ao mesmo
 * tempo, e a lista vira coluna: fica parada à esquerda enquanto o conteúdo muda
 * à direita. É a mesma troca que o `Rail` fez com a `TabBar` — a diferença entre
 * as duas larguras não é de tamanho, é de quantas coisas cabem juntas.
 *
 * O `Rail` é a navegação do APLICATIVO; esta é a de DENTRO de uma seção. As
 * duas moram lado a lado no desktop, e é por isso que elas não são a mesma
 * peça: o trilho tem ícone porque é lido de relance, sete itens, sempre os
 * mesmos; a lista tem a linha de baixo porque é lida com calma, e o que ela diz
 * muda com o que a pessoa guardou.
 *
 * O item aberto muda de FUNDO, de PESO, ganha a marca na borda direita — que
 * aponta para o conteúdo que ele abriu — e `aria-current` (ADR-005).
 */
export function NavList<T extends string>({
  label,
  items,
  value,
  onChange,
  opens = "page",
  className,
}: Readonly<NavListProps<T>>) {
  const base = useId();
  const classe = className ? `co-nav-list ${className}` : "co-nav-list";
  const atualVale = opens === "page" ? "page" : "true";

  const grupos: { nome: string | undefined; itens: NavListItem<T>[] }[] = [];
  for (const item of items) {
    const atual = grupos.find((g) => g.nome === item.group);
    if (atual) atual.itens.push(item);
    else grupos.push({ nome: item.group, itens: [item] });
  }

  function lista(itens: NavListItem<T>[]) {
    return (
      <ul className="co-nav-list__items">
        {itens.map((item) => {
          const aberto = item.value === value;
          // O nome do botão é o RÓTULO, e o resto é descrição. Sem isso o nome
          // vira a linha inteira — "Meta e ritmo perder 0,5 kg/semana · 1.917" —,
          // e quem pula de item em item ouve a conta antes de saber onde está.
          // A posição na lista, e não o `value`: um valor com espaço quebraria
          // a lista de ids do `aria-describedby`.
          const id = `${base}-${items.indexOf(item)}`;
          const descreve = [
            item.description === undefined ? undefined : `${id}-descricao`,
            item.trailing === undefined ? undefined : `${id}-direita`,
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <li key={item.value}>
              <button
                type="button"
                className="co-nav-list__item"
                aria-current={aberto ? atualVale : undefined}
                aria-labelledby={`${id}-rotulo`}
                aria-describedby={descreve === "" ? undefined : descreve}
                onClick={() => onChange(item.value)}
              >
                {item.leading === undefined ? null : (
                  <span className="co-nav-list__leading">{item.leading}</span>
                )}
                <span className="co-nav-list__body">
                  <span className="co-nav-list__label" id={`${id}-rotulo`}>
                    {item.label}
                  </span>
                  {item.description === undefined ? null : (
                    <Text
                      as="span"
                      id={`${id}-descricao`}
                      className="co-nav-list__description"
                      variant="caption"
                      tone="subtle"
                    >
                      {item.description}
                    </Text>
                  )}
                </span>
                {item.trailing === undefined ? null : (
                  <Text
                    as="span"
                    id={`${id}-direita`}
                    className="co-nav-list__trailing"
                    variant="subhead"
                    tone="muted"
                    numeric
                  >
                    {item.trailing}
                  </Text>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  const conteudo = grupos.map((grupo, indice) => {
    if (grupo.nome === undefined) {
      // Chave pelo primeiro item do bloco, e não pela posição — o mesmo cuidado
      // do `Rail`: itens sem grupo podem vir em mais de um ponto da lista.
      return (
        <div className="co-nav-list__group" key={grupo.itens[0]?.value ?? "sem-grupo"}>
          {lista(grupo.itens)}
        </div>
      );
    }

    const idGrupo = `${base}-grupo-${indice}`;
    return (
      <fieldset className="co-nav-list__group" key={grupo.nome} aria-labelledby={idGrupo}>
        <Text id={idGrupo} className="co-nav-list__group-label" variant="micro" tone="subtle">
          {grupo.nome}
        </Text>
        {lista(grupo.itens)}
      </fieldset>
    );
  });

  if (opens === "page") {
    return (
      <nav className={classe} aria-label={label}>
        {conteudo}
      </nav>
    );
  }

  // `<fieldset>`, e não `<div role="group">`: o elemento já nasce grupo — o
  // mesmo motivo de os blocos com nome, lá em cima, também serem `<fieldset>`.
  return (
    <fieldset className={classe} aria-label={label}>
      {conteudo}
    </fieldset>
  );
}
