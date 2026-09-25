import { useEffect, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Icon } from "./Icon";

export interface SearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type" | "aria-label"> {
  /**
   * O nome do campo, obrigatório. Ele não aparece escrito: para quem enxerga,
   * a lupa e o texto de exemplo já dizem o que o campo é. Para quem ouve, não
   * dizem nada — o `placeholder` some na primeira letra e não é nome.
   */
  label: string;
  /**
   * Quantos resultados a busca achou: "6 resultados". Fica à direita, dentro
   * da moldura, e é anunciado com calma quando muda.
   *
   * Sem isso, quem usa leitor de tela digita e não sabe se a lista ao lado
   * encheu, esvaziou ou continua igual — a única resposta da busca está num
   * lugar que o foco não visita.
   */
  count?: ReactNode;
  /**
   * A tecla que traz o foco para cá de qualquer ponto da página — `/` no
   * desktop. Aparece desenhada no campo enquanto ele está parado.
   *
   * A tecla só é tomada quando a pessoa NÃO está escrevendo em outro campo: uma
   * barra digitada numa observação ("1/2 xícara") tem de virar barra, e não um
   * salto para a busca.
   */
  shortcut?: string;
  /**
   * `md` tem 44px e serve a busca que filtra uma lista. `lg` tem 52px e é a
   * busca que É a tela — a de registrar, onde procurar é a tarefa inteira.
   */
  size?: "md" | "lg";
  /** Ocupa a largura do contêiner. */
  full?: boolean;
}

/** Onde a pessoa está escrevendo, e portanto onde a tecla de atalho é só uma letra. */
function escrevendo(alvo: EventTarget | null): boolean {
  if (!(alvo instanceof Element)) return false;
  if (alvo instanceof HTMLElement && alvo.isContentEditable) return true;
  return alvo.closest("input, textarea, select, [contenteditable]") !== null;
}

/**
 * O campo de busca: a lupa, o texto, e o que a busca respondeu.
 *
 * É um `<input type="search">` dentro de um marco `search`, e não um `Input`
 * com uma lupa desenhada do lado. As duas coisas mudam o que chega a quem não
 * enxerga: o marco é onde o atalho de "ir para a busca" do leitor de tela
 * pousa, e o tipo dá o teclado com a tecla "buscar" no telefone e o Esc que
 * limpa no navegador.
 *
 * O texto tem 16px nos dois tamanhos, pela mesma regra do `Input`: abaixo
 * disso o Safari do iPhone dá zoom ao focar, e a tela salta no meio da busca.
 */
export function SearchField({
  label,
  count,
  shortcut,
  size = "md",
  full = false,
  className,
  ...resto
}: Readonly<SearchFieldProps>) {
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcut) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== shortcut || evento.defaultPrevented) return;
      if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
      if (escrevendo(evento.target)) return;
      evento.preventDefault();
      campo.current?.focus();
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [shortcut]);

  const classe = className ? `co-search ${className}` : "co-search";

  return (
    <div
      className={classe}
      role="search"
      data-size={size === "md" ? undefined : size}
      data-full={full ? "true" : undefined}
    >
      <Icon className="co-search__icon" name="search" size={size === "lg" ? 20 : 17} />
      <input
        ref={campo}
        className="co-search__control"
        type="search"
        aria-label={label}
        aria-keyshortcuts={shortcut}
        {...resto}
      />
      {count === undefined ? null : (
        <span className="co-search__count" aria-live="polite" aria-atomic="true">
          {count}
        </span>
      )}
      {shortcut ? (
        // O desenho da tecla é para quem enxerga; quem usa leitor de tela
        // recebe o mesmo atalho pelo `aria-keyshortcuts` do campo.
        <kbd className="co-search__key" aria-hidden="true">
          {shortcut}
        </kbd>
      ) : null}
    </div>
  );
}
