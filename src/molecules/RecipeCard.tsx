import type { MouseEventHandler } from "react";
import { Text } from "../atoms/Text";
import { Legend } from "./Legend";
import { PlateArt, type PlateSlice } from "./Plate";

export interface RecipeCardProps {
  /** O nome da receita. É o nome do link (ou do botão) que abre a receita. */
  title: string;
  /** A composição do prato mini, pronta (a mesma do `Plate`). */
  slices: readonly PlateSlice[];
  /**
   * Quanto o prato fecha do alvo, escrito por quem consome ("Fecha 90% do alvo
   * do almoço", "Falta 10% para o alvo"). Obrigatório, como no `Plate`: o
   * desenho do prato é `aria-hidden`, e a parte vazia dele é informação.
   */
  summary: string;
  /** As kcal da proporção base, já escritas em pt-BR: "520", "1.020". A unidade é do cartão. */
  kcal: string;
  /** O tempo total, escrito: "35 min", "1 h 10 min". */
  time: string;
  /** A origem: "À mão", "Com a IA". */
  origin: string;
  /** Abre a receita por link. Com `href`, o cartão é um `<a>`. */
  href?: string | undefined;
  /** Abre a receita por ação. Sem `href`, o cartão é um `<button>`. */
  onSelect?: MouseEventHandler<HTMLElement> | undefined;
  /** O nível do título na tela: 3 por padrão, embaixo do título da tela (1) e da seção (2). */
  headingLevel?: 2 | 3 | 4;
  className?: string | undefined;
}

/**
 * O cartão de receita do livro: o prato mini, o título, as kcal da proporção
 * base, o tempo total e a origem.
 *
 * O cartão inteiro é o alvo, e ele mede pelo menos `--co-target-min` (44 px):
 * o link (ou o botão) mora no título, e uma camada dele cobre o cartão todo
 * (o padrão do "link esticado"). Assim o leitor de tela ouve o título como o
 * nome do link — e não o cartão inteiro lido de uma vez como um rótulo
 * gigante —, e o resto (a legenda do prato e os números) continua texto que se
 * percorre. O anel de foco contorna o cartão, por fora.
 *
 * O prato mini nunca vem sem a legenda (ADR-005): os grupos com os gramas
 * ficam em texto, embaixo dos números, e o `summary` diz quanto do alvo o
 * prato fecha, já que o desenho sai `aria-hidden`.
 */
export function RecipeCard({
  title,
  slices,
  summary,
  kcal,
  time,
  origin,
  href,
  onSelect,
  headingLevel = 3,
  className,
}: RecipeCardProps) {
  const classe = className ? `co-recipe-card ${className}` : "co-recipe-card";
  const Titulo = `h${headingLevel}` as const;
  const acao =
    href === undefined ? (
      <button type="button" className="co-recipe-card__action" onClick={onSelect}>
        {title}
      </button>
    ) : (
      <a className="co-recipe-card__action" href={href} onClick={onSelect}>
        {title}
      </a>
    );

  return (
    <article className={classe}>
      <PlateArt slices={slices} size="sm" className="co-recipe-card__plate" />
      <div className="co-recipe-card__body">
        <Text as={Titulo} variant="headline" className="co-recipe-card__title">
          {acao}
        </Text>
        <Text as="p" className="co-recipe-card__meta" variant="footnote" tone="secondary">
          <Text as="span" variant="footnote" numeric>
            {kcal}
          </Text>{" "}
          kcal · {time} · {origin}
        </Text>
        <Text as="p" className="co-recipe-card__summary" variant="footnote" tone="secondary">
          {summary}
        </Text>
        <Legend
          className="co-recipe-card__legend"
          label={`Prato de ${title}`}
          items={slices.map((s) => ({ label: s.label, tone: s.group, swatch: "hex" as const }))}
        />
      </div>
    </article>
  );
}
