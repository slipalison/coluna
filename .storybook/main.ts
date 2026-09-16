import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    // O eixo que mais paga num design system: ele roda o axe em cada story e
    // reprova contraste insuficiente, rótulo faltando e alvo pequeno demais —
    // exatamente as três coisas que passam despercebidas na revisão visual.
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  /**
   * O Storybook herda o `vite.config.ts` da raiz, e ali mora a configuração de
   * BIBLIOTECA — que não tem o que fazer aqui.
   *
   * `build.lib` diz que a saída é um pacote com um ponto de entrada só; o
   * catálogo é um site com muitos. E o `vite-plugin-dts` tenta gerar e agrupar
   * os `.d.ts` no meio do build do catálogo, o que derruba o processo. Na
   * máquina de quem já rodou `npm run build` isso passa despercebido, porque o
   * `dist/` de antes está lá; num runner limpo ele falha, e falha tarde.
   *
   * Nada de `base`: o Storybook já referencia tudo por caminho relativo, então
   * o mesmo build abre na raiz de um domínio, numa subpasta do GitHub Pages ou
   * dentro de um artefato. Fixar um `base` tornaria os caminhos absolutos e
   * quebraria os outros dois casos.
   */
  viteFinal(config) {
    config.plugins = (config.plugins ?? []).filter((plugin) => {
      const nome = plugin && typeof plugin === "object" && "name" in plugin ? plugin.name : "";
      return typeof nome !== "string" || !nome.startsWith("vite:dts");
    });
    if (config.build) {
      delete config.build.lib;
      delete config.build.rollupOptions;
    }
    return config;
  },
};

export default config;
