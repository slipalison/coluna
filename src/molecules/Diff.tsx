import { Text } from "../atoms/Text";
import { VisuallyHidden } from "../atoms/VisuallyHidden";

export interface DiffProps {
  label: string;
  /** O valor de hoje, JÁ FORMATADO. O sistema não formata número: formato é do idioma, e idioma é do aplicativo. */
  before: string;
  /** O valor que a tela está propondo, já formatado. */
  after: string;
  unit?: string;
  className?: string | undefined;
}

/**
 * O que muda se a pessoa confirmar.
 *
 * A tela de meta, a de reavaliação e a de ajustes abrem todas do mesmo jeito no
 * desenho: valor de hoje riscado, valor novo em destaque, e o botão morto
 * enquanto os dois forem iguais. O diff é essa frase, e ela é de interface —
 * não sabe se o número é kcal, quilo ou hora.
 *
 * Quando `before` e `after` são iguais ele diz isso, e não some: um bloco que
 * desaparece quando a pessoa volta o valor ao original faz a tela pular por
 * baixo do dedo no meio do ajuste.
 *
 * O risco no valor antigo é desenho — `<s>` não é anunciado por leitor de tela
 * nenhum, e a seta seria lida como "seta para a direita". Então o par visível
 * sai `aria-hidden` e no lugar dele vai uma frase inteira: "de 1.677 para
 * 1.540". Uma informação, dita uma vez, em cada canal.
 */
export function Diff({ label, before, after, unit, className }: DiffProps) {
  const mudou = before !== after;
  const sufixo = unit ? ` ${unit}` : "";
  const classe = className ? `co-diff ${className}` : "co-diff";

  return (
    <div className={classe} data-changed={mudou ? "true" : "false"}>
      <Text as="span" variant="callout" tone="secondary">
        {label}
      </Text>

      <span className="co-diff__values" aria-hidden="true">
        {mudou ? (
          <>
            <s className="co-diff__before">
              {before}
              {sufixo}
            </s>
            <span className="co-diff__arrow">→</span>
            <span className="co-diff__after">
              {after}
              {sufixo}
            </span>
          </>
        ) : (
          <span className="co-diff__same">
            {after}
            {sufixo}
          </span>
        )}
      </span>

      <VisuallyHidden>
        {mudou
          ? `${label}: de ${before}${sufixo} para ${after}${sufixo}`
          : `${label}: ${after}${sufixo}, sem mudança`}
      </VisuallyHidden>
    </div>
  );
}
