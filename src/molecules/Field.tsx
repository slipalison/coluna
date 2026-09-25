import { useId, type ReactNode } from "react";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";

export interface FieldControl {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
}

export interface FieldProps {
  label: string;
  /** A regra do campo, dita ANTES do erro: "entre 30 e 300 kg". */
  hint?: ReactNode;
  /** O que o campo recusou. Presente, ele liga `aria-invalid` no controle. */
  error?: ReactNode;
  /**
   * O controle. Recebe os atributos já prontos e DEVE espalhá-los — é o
   * contrato que amarra rótulo, dica e erro ao `<input>`.
   *
   * É função, e não um filho que o `Field` clona, porque clonar é mágica que
   * some no primeiro dia em que alguém envolve o campo num `<div>` para
   * posicioná-lo: o clone acerta o `<div>`, os atributos não chegam ao controle,
   * e nada disso aparece na tela — só no leitor de tela de quem não está lá
   * para reclamar.
   */
  children: (control: FieldControl) => ReactNode;
  /**
   * `stack` (o padrão): rótulo em cima, controle embaixo — o formulário solto.
   *
   * `row`: rótulo e dica à esquerda, controle à direita, erro embaixo de tudo —
   * a linha de medida dentro de um `Group` ("Sobre você": peso, altura,
   * gordura). A linha tem a mesma altura e a mesma calha da `ListRow`, para as
   * duas conviverem no mesmo grupo com o fio no mesmo lugar. O controle ganha
   * uma coluna de largura fixa (`--co-field-row-control`); passe `full` ao
   * `Input` para ele ocupar a coluna inteira.
   */
  layout?: "stack" | "row";
  className?: string | undefined;
}

/**
 * Rótulo, controle, dica e erro — amarrados.
 *
 * É a peça que o sistema devia ter desde o começo e não tinha: a ADR-003 já
 * dizia que erro de verdade "é uma mensagem junto do campo que a produziu", e o
 * campo não existia. Enquanto não existia, cada tela amarrava sozinha — e
 * amarrar sozinha significa, na prática, um `<label>` solto que não aponta para
 * controle nenhum.
 *
 * O erro é vermelho E tem ícone E entra no `aria-describedby`. Três sinais,
 * porque cor sozinha não é sinal (ADR-005) — e porque um erro que só existe em
 * vermelho não existe para quem chegou ali pelo teclado com o leitor de tela
 * ligado.
 */
export function Field({
  label,
  hint,
  error,
  children,
  layout = "stack",
  className,
}: FieldProps) {
  const base = useId();
  const idControle = `${base}-controle`;
  const idDica = `${base}-dica`;
  const idErro = `${base}-erro`;

  const descreve = [hint ? idDica : undefined, error ? idErro : undefined]
    .filter(Boolean)
    .join(" ");

  const classe = className ? `co-field ${className}` : "co-field";

  const controle = children({
    id: idControle,
    "aria-describedby": descreve === "" ? undefined : descreve,
    "aria-invalid": error ? true : undefined,
  });

  const mensagem = error ? (
    // `polite` e não `assertive`: o erro que aparece enquanto a pessoa
    // ainda digita não deve cortar a palavra no meio.
    <p className="co-field__error" id={idErro} aria-live="polite">
      <Icon className="co-field__error-icon" name="info" size={15} />
      <span>{error}</span>
    </p>
  ) : null;

  if (layout === "row") {
    // Na linha o rótulo é o nome da medida, lido como o título de uma
    // `ListRow` — e não o versalete de cima do campo solto. A dica vira a nota
    // embaixo dele ("passo de 100 g", "só a Katch-McArdle usa"), e o erro desce
    // para baixo da linha inteira: espremido ao lado do campo, ele quebraria a
    // coluna do controle em três linhas.
    return (
      <div className={classe} data-layout="row" data-invalid={error ? "true" : undefined}>
        <div className="co-field__row">
          <div className="co-field__text">
            <label className="co-field__label" htmlFor={idControle}>
              <Text as="span" variant="body">
                {label}
              </Text>
            </label>
            {hint ? (
              <Text id={idDica} variant="footnote" tone="muted" style={{ textWrap: "pretty" }}>
                {hint}
              </Text>
            ) : null}
          </div>
          <div className="co-field__control">{controle}</div>
        </div>
        {mensagem}
      </div>
    );
  }

  return (
    <div className={classe} data-invalid={error ? "true" : undefined}>
      <label className="co-field__label" htmlFor={idControle}>
        <Text as="span" variant="label" tone="subtle">
          {label}
        </Text>
      </label>

      {controle}

      {hint ? (
        <Text id={idDica} variant="footnote" tone="muted" style={{ textWrap: "pretty" }}>
          {hint}
        </Text>
      ) : null}

      {mensagem}
    </div>
  );
}
