import type { Decorator, Preview } from "@storybook/react-vite";
import { ThemeProvider, type ThemePreference } from "../src";
import "../src/styles.css";

/**
 * O seletor de tema da barra de ferramentas.
 *
 * `system` está aqui de propósito, e não é enfeite: é o estado em que a maior
 * parte das pessoas abre o aplicativo, e o único em que o `data-theme` fica
 * AUSENTE. Um catálogo que só oferece claro e escuro nunca exercita o caminho
 * da media query — que é justamente onde o tema costuma quebrar.
 */
const temaGlobal: Decorator = (Story, contexto) => {
  const tema = (contexto.globals["tema"] ?? "system") as ThemePreference;
  return (
    <ThemeProvider theme={tema} attachTo="element" storageKey={null}>
      <div style={{ background: "var(--co-canvas)", padding: "24px", minHeight: "120px" }}>
        <Story />
      </div>
    </ThemeProvider>
  );
};

const preview: Preview = {
  decorators: [temaGlobal],
  initialGlobals: {
    tema: "system",
  },
  globalTypes: {
    tema: {
      description: "Tema do Coluna",
      toolbar: {
        title: "Tema",
        icon: "mirror",
        items: [
          { value: "system", title: "Sistema" },
          { value: "light", title: "Claro" },
          { value: "dark", title: "Escuro" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    // O fundo vem do token, e não da lista de fundos do Storybook: um cinza
    // escolhido no painel esconderia justamente o erro que interessa pegar —
    // um componente que não responde ao tema.
    backgrounds: { disable: true },
    a11y: { test: "error" },
    docs: {
      toc: true,
    },
  },
};

export default preview;
