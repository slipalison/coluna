import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/** O que a pessoa escolheu. `system` é ausência de escolha, não um terceiro tema. */
export type ThemePreference = "light" | "dark" | "system";

/** O tema que de fato está na tela. `system` nunca chega aqui. */
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextValue {
  /** A preferência guardada, inclusive `system`. */
  theme: ThemePreference;
  /** O que está pintado agora — é isto que serve para o `theme-color` do manifest. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  /** Alterna entre claro e escuro a partir do que está na tela, e sai de `system`. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const CONSULTA_ESCURO = "(prefers-color-scheme: dark)";

/**
 * Assina a preferência do sistema operacional.
 *
 * `useSyncExternalStore` e nao `useState` + `useEffect`: a leitura acontece no
 * mesmo instante em que o React renderiza, entao nao ha o quadro intermediario
 * em que a tela aparece clara e pisca para escura.
 */
function assinarSistema(notificar: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const consulta = window.matchMedia(CONSULTA_ESCURO);
  consulta.addEventListener("change", notificar);
  return () => consulta.removeEventListener("change", notificar);
}

function lerSistema(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia(CONSULTA_ESCURO).matches ? "dark" : "light";
}

/** No servidor nao ha preferencia para ler. O claro e o padrao do CSS tambem. */
function lerSistemaNoServidor(): ResolvedTheme {
  return "light";
}

function lerGuardado(chave: string): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto === "light" || bruto === "dark" || bruto === "system" ? bruto : null;
  } catch {
    // Janela anônima, cookie bloqueado, quota estourada. Nada disso é motivo
    // para a aplicação não abrir: cai no padrão e segue.
    return null;
  }
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** Tema controlado de fora. Passar isto desliga o armazenamento local. */
  theme?: ThemePreference;
  /** O que vale antes de haver escolha guardada. */
  defaultTheme?: ThemePreference;
  /** Chave do `localStorage`. `null` não guarda nada. */
  storageKey?: string | null;
  /**
   * Onde o `data-theme` é escrito.
   *
   * `document` (padrão) marca o `<html>`, e é o que faz `color-scheme` valer
   * também para a barra de rolagem, o seletor de data e o resto do que o
   * navegador desenha sozinho. `element` marca só o elemento desta árvore —
   * serve para uma pré-visualização de tema ao lado do resto da tela.
   */
  attachTo?: "document" | "element";
  className?: string;
}

/**
 * Monta os tokens do Coluna e decide o tema.
 *
 * Trocar de tema aqui NAO re-renderiza a arvore por causa da cor: o que muda e
 * um atributo no DOM, e o CSS faz o resto. O contexto existe para o codigo que
 * precisa SABER o tema (um grafico que escolhe a cor da serie, o `theme-color`
 * do manifest), nao para pintar.
 */
export function ThemeProvider({
  children,
  theme: temaControlado,
  defaultTheme = "system",
  storageKey = "coluna-theme",
  attachTo = "document",
  className,
}: ThemeProviderProps) {
  const controlado = temaControlado !== undefined;

  const [temaLocal, definirTemaLocal] = useState<ThemePreference>(
    () => (storageKey ? lerGuardado(storageKey) : null) ?? defaultTheme,
  );

  const tema = controlado ? temaControlado : temaLocal;

  const doSistema = useSyncExternalStore(assinarSistema, lerSistema, lerSistemaNoServidor);
  const resolvido: ResolvedTheme = tema === "system" ? doSistema : tema;

  const definirTema = useCallback(
    (proximo: ThemePreference) => {
      if (!controlado) definirTemaLocal(proximo);
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, proximo);
        } catch {
          // Ver `lerGuardado`: sem armazenamento, a escolha vale para a sessão.
        }
      }
    },
    [controlado, storageKey],
  );

  useEffect(() => {
    if (attachTo !== "document" || typeof document === "undefined") return;
    const raiz = document.documentElement;
    // `system` REMOVE o atributo em vez de escrever o valor resolvido. É o que
    // deixa a media query do CSS voltar a mandar — e o que faz a tela seguir o
    // sistema se ele mudar com o aplicativo aberto.
    if (tema === "system") raiz.removeAttribute("data-theme");
    else raiz.setAttribute("data-theme", tema);
    return () => raiz.removeAttribute("data-theme");
  }, [attachTo, tema]);

  const valor = useMemo<ThemeContextValue>(
    () => ({
      theme: tema,
      resolvedTheme: resolvido,
      setTheme: definirTema,
      toggleTheme: () => definirTema(resolvido === "dark" ? "light" : "dark"),
    }),
    [tema, resolvido, definirTema],
  );

  const classe = className ? `co-root ${className}` : "co-root";

  return (
    <ThemeContext.Provider value={valor}>
      <div className={classe} data-theme={attachTo === "element" ? tema === "system" ? undefined : tema : undefined}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * Le o tema atual.
 *
 * Fora de um `ThemeProvider` isto ESTOURA, de proposito: um componente que
 * pergunta o tema e recebe um palpite pinta a serie do grafico da cor errada
 * e ninguem descobre. Quem so quer desenhar nao precisa deste hook — os
 * tokens ja chegam pelo CSS.
 */
export function useTheme(): ThemeContextValue {
  const valor = useContext(ThemeContext);
  if (valor === null) {
    throw new Error("useTheme precisa de um <ThemeProvider> acima na árvore.");
  }
  return valor;
}
