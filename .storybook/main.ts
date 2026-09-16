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
};

// SEM `base`. O build do Storybook já referencia tudo por caminho relativo
// (`./sb-manager/...`), então ele abre igual na raiz de um domínio, numa
// subpasta do GitHub Pages ou dentro de um artefato. Fixar `base: "/coluna/"`
// tornaria os caminhos absolutos e quebraria os outros dois casos — seria
// trocar um problema que não existe por dois que passariam a existir.

export default config;
