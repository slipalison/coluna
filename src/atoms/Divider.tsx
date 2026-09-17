import type { HTMLAttributes } from "react";

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /**
   * Onde o fio começa. `none` corta o cartão de ponta a ponta; os outros
   * alinham o corte com o conteúdo da linha — `text` depois do recuo, `dot`
   * depois do ponto de macro, `mark` depois da marca de escolha.
   *
   * Dentro de um `Group` você não precisa disto: o grupo desenha os fios entre
   * os filhos sozinho. Isto é para o fio avulso.
   */
  inset?: "none" | "text" | "dot" | "mark";
}

/** Fio de 1px no token de linha. `<hr>` porque a separação também é semântica. */
export function Divider({ inset = "none", className, ...resto }: DividerProps) {
  const classe = className ? `co-divider ${className}` : "co-divider";
  return <hr className={classe} data-inset={inset === "none" ? undefined : inset} {...resto} />;
}
