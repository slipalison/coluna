import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Icon } from "./Icon";
import { reservarFim } from "./Input";
import { Text } from "./Text";

export interface SearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type" | "aria-label"> {
  /**
   * O nome do campo, obrigatório, e ele aparece ESCRITO, em cima da moldura,
   * num `<label>` amarrado ao campo — o mesmo rótulo do `Field`.
   *
   * Já foi só para o leitor de tela, confiando na lupa e no texto de exemplo
   * para quem enxerga. Não bastam: o exemplo some na primeira letra, e a lupa
   * diz "aqui se busca", não "busca o quê". Todo campo tem rótulo visível, a
   * busca também (`ux.md` §2, ADR-016).
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
   * O nome do × que esvazia o campo. Ele só aparece com texto no campo, e o
   * toque esvazia pelo `onChange` de quem usa (o mesmo evento de quem apaga
   * letra a letra) e devolve o foco ao campo, para a próxima busca.
   */
  clearLabel?: string;
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
 * Escreve no campo como a pessoa escreveria: pelo `value` do protótipo e um
 * evento `input`. É o que faz o `onChange` de quem usa receber o campo vazio,
 * controlado ou não — o React só ouve a mudança que chega por evento.
 */
function esvaziar(campo: HTMLInputElement) {
  const valor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  valor?.set?.call(campo, "");
  campo.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * O campo de busca: o nome escrito, a lupa, o texto, o × de limpar e o que a
 * busca respondeu.
 *
 * É um `<input type="search">` dentro de um marco `search`, e não um `Input`
 * com uma lupa desenhada do lado. As duas coisas mudam o que chega a quem não
 * enxerga: o marco é onde o atalho de "ir para a busca" do leitor de tela
 * pousa, e o tipo dá o teclado com a tecla "buscar" no telefone e o Esc que
 * limpa no navegador.
 *
 * O × é da coluna, e não o do navegador: o do Safari e o do Chrome são pequenos
 * demais para o dedo, não têm nome para o leitor de tela e cada um tem uma
 * cara. O desta peça tem 44px, nome (`clearLabel`) e só existe com texto.
 *
 * A moldura inteira é o campo, como a do `Input`: o controle a ocupa inteira,
 * e a lupa, a contagem e a tecla ficam por cima do respiro dele sem receber o
 * toque — o dedo nelas cai no texto, pelo navegador. O ×, que é outro
 * controle, fica por cima dele no fim. A moldura mede pelo menos 44 × 44px.
 *
 * O texto tem 16px nos dois tamanhos, pela mesma regra do `Input`: abaixo
 * disso o Safari do iPhone dá zoom ao focar, e a tela salta no meio da busca.
 */
export function SearchField({
  label,
  count,
  shortcut,
  clearLabel = "Limpar a busca",
  size = "md",
  full = false,
  className,
  id,
  onChange,
  ...resto
}: Readonly<SearchFieldProps>) {
  const campo = useRef<HTMLInputElement>(null);
  const gerado = useId();
  const idCampo = id ?? gerado;
  // O que o campo tem escrito quando ninguém o controla. Controlado, quem diz
  // é o `value` de fora.
  const [escritoLivre, setEscritoLivre] = useState(
    () => String(resto.defaultValue ?? "") !== "",
  );
  const temTexto = resto.value === undefined ? escritoLivre : String(resto.value) !== "";

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

  function aoMudar(evento: ChangeEvent<HTMLInputElement>) {
    setEscritoLivre(evento.target.value !== "");
    onChange?.(evento);
  }

  function limpar() {
    const no = campo.current;
    if (!no) return;
    // O foco vai antes: o × sai da tela quando o campo esvazia, e o foco que
    // estivesse nele cairia no começo da página.
    no.focus();
    esvaziar(no);
  }

  const classe = className ? `co-search ${className}` : "co-search";

  return (
    <div className="co-search-field" role="search" data-full={full ? "true" : undefined}>
      <label className="co-search-field__label" htmlFor={idCampo}>
        <Text as="span" variant="label" tone="subtle">
          {label}
        </Text>
      </label>
      <div
        className={classe}
        data-size={size === "md" ? undefined : size}
        data-full={full ? "true" : undefined}
        data-clearable={temTexto ? "true" : undefined}
      >
        <Icon className="co-search__icon" name="search" size={size === "lg" ? 20 : 17} />
        <input
          ref={campo}
          id={idCampo}
          className="co-search__control"
          type="search"
          aria-keyshortcuts={shortcut}
          onChange={aoMudar}
          {...resto}
        />
        {count === undefined && !shortcut ? null : (
          <span className="co-search__end" ref={reservarFim}>
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
          </span>
        )}
        {temTexto ? (
          <button
            type="button"
            className="co-search__clear"
            aria-label={clearLabel}
            title={clearLabel}
            onClick={limpar}
          >
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
