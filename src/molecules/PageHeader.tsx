import type { ReactNode } from "react";
import { Text } from "../atoms/Text";

export interface PageHeaderProps {
  title: ReactNode;
  /** A linha embaixo do título: a data, o resumo do mês, a frase que diz o que a página faz. */
  subtitle?: ReactNode;
  /**
   * Colado ao título: o `Pager` que troca o dia ou o mês que o título nomeia.
   * Fica AQUI, e não junto das ações, porque ele muda o próprio título — longe
   * dele o olho tem de ir e voltar a cada toque.
   */
  navigation?: ReactNode;
  /**
   * À direita: o que se faz nesta página — a busca e o "Registrar", o
   * segmentado da janela de tempo, o botão de confirmar, a legenda do gráfico.
   * Quebra para baixo do título quando a janela estreita, em vez de apertar o
   * título até ele virar três linhas.
   */
  actions?: ReactNode;
  /** O elemento do título. `h1` quando a página é a página; `h2` num painel dentro dela. */
  as?: "h1" | "h2";
  className?: string | undefined;
}

/**
 * O cabeçalho de uma página do desktop: título e linha de baixo à esquerda, as
 * ações da página à direita.
 *
 * É outra peça, e não o `ScreenHeader` esticado, porque a diferença é de
 * quantidade e não de tamanho — a mesma do `Rail` com a `TabBar`. No telefone
 * cabe uma ação, e ela é um ícone; o resto vai para dentro da tela. No desktop
 * cabem a busca, o botão principal e o seletor de período na mesma linha do
 * título, e é lá que a pessoa procura. O `ScreenHeader` diz de si mesmo que
 * "duas ações já são uma barra de ferramentas, e isso é outro componente": é
 * este.
 *
 * O título é a mesma serifa de 36px do telefone. O desenho pedia 38; dois
 * degraus quase iguais na rampa são dois degraus que ninguém sabe qual usar.
 *
 * Tudo se alinha pela BASE: o título, o paginador e os botões assentam na
 * mesma linha, que é a linha de onde o conteúdo começa logo abaixo.
 */
export function PageHeader({
  title,
  subtitle,
  navigation,
  actions,
  as = "h1",
  className,
}: Readonly<PageHeaderProps>) {
  const classe = className ? `co-page-header ${className}` : "co-page-header";
  return (
    <header className={classe}>
      <div className="co-page-header__lead">
        <div className="co-page-header__body">
          <Text as={as} variant="title-lg">
            {title}
          </Text>
          {subtitle === undefined ? null : (
            <Text variant="subhead" tone="subtle" style={{ textWrap: "pretty" }}>
              {subtitle}
            </Text>
          )}
        </div>
        {navigation === undefined ? null : (
          <div className="co-page-header__navigation">{navigation}</div>
        )}
      </div>
      {actions === undefined ? null : <div className="co-page-header__actions">{actions}</div>}
    </header>
  );
}
