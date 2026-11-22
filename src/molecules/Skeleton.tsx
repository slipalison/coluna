import { useEffect, useState } from "react";
import { VisuallyHidden } from "../atoms/VisuallyHidden";
import { PlateArt } from "./Plate";

export interface SkeletonProps {
  /**
   * O que está carregando, escrito para o leitor de tela: "Carregando
   * receitas". É o único texto do esqueleto, e ele é anunciado uma vez.
   */
  label: string;
  /**
   * A forma de cada peça:
   *
   *   recipe-card  o cartão de receita, com o prato mini (o livro carregando)
   *   plate        o prato grande sozinho (a receita aberta carregando)
   *   line         uma linha de texto
   */
  shape?: "recipe-card" | "plate" | "line";
  /** Quantas peças: o livro carregando mostra 3 cartões. */
  count?: number;
  className?: string | undefined;
}

/**
 * O esqueleto de carregamento, com o prato.
 *
 * Ele desenha a FORMA do que vem — o cartão de receita com o prato mini, o
 * prato grande, a linha de texto —, para a tela não pular quando o conteúdo
 * chegar. As colunas do prato ficam todas vazias.
 *
 * Um estado pronto (`.claude/rules/ux.md` §2): o contêiner é uma região viva
 * (`role="status"`) que nasce vazia e recebe o `label` logo depois de montar,
 * anunciado uma vez, e as peças saem `aria-hidden`. Quem consome não precisa
 * lembrar de dizer "carregando"; o fim ("7 receitas") e o erro com "Tentar de
 * novo", num prazo dele, são de quem consome.
 *
 * O pulso é só de opacidade e ACABA: seis meias-voltas de 700 ms, 4,2 s, e o
 * esqueleto para quieto — abaixo dos 5 s em que o WCAG 2.2.2 pede um jeito de
 * pausar o que se mexe sozinho, e "nada infinito, salvo o esqueleto (que
 * acaba)", como a identidade escreve. Com `prefers-reduced-motion`, ele já
 * nasce parado (ADR-025).
 */
export function Skeleton({ label, shape = "recipe-card", count = 1, className }: SkeletonProps) {
  const classe = className ? `co-skeleton ${className}` : "co-skeleton";
  // A região nasce vazia, e o rótulo entra depois da montagem: região viva que
  // nasce junto com o texto o leitor de tela pode não ler.
  const [anuncio, anunciar] = useState("");
  useEffect(() => anunciar(label), [label]);
  const pecas = Array.from({ length: Math.max(1, Math.floor(count)) }, (_, i) => i);
  return (
    <div className={classe} data-shape={shape} role="status">
      <VisuallyHidden>{anuncio}</VisuallyHidden>
      {pecas.map((i) => (
        <div key={i} className="co-skeleton__item" aria-hidden="true">
          {shape === "line" ? <span className="co-skeleton__bone" data-bone="line" /> : null}
          {shape === "plate" ? <PlateArt slices={[]} size="lg" skeleton /> : null}
          {shape === "recipe-card" ? (
            <>
              <PlateArt slices={[]} size="sm" skeleton className="co-recipe-card__plate" />
              <span className="co-skeleton__lines">
                <span className="co-skeleton__bone" data-bone="title" />
                <span className="co-skeleton__bone" data-bone="meta" />
                <span className="co-skeleton__bone" data-bone="legend" />
                <span className="co-skeleton__bone" data-bone="legend-2" />
              </span>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
