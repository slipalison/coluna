/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    // Os tipos saem de `src/`, e não do bundle: o consumidor recebe a mesma
    // assinatura que o código fonte declara, com os comentários junto.
    dts({ include: ["src"], exclude: ["src/**/*.test.tsx", "src/test/**"], rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "coluna.js",
    },
    rollupOptions: {
      // React fica de fora do bundle. Empacotá-lo junto daria DUAS cópias no
      // aplicativo do consumidor, e duas cópias quebram hook — o erro aparece
      // como "invalid hook call" e ninguém suspeita da biblioteca de UI.
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
    sourcemap: true,
    target: "es2022",
  },
  test: {
    // `happy-dom` e não `jsdom`, pelo mesmo motivo medido no Basalto: o jsdom
    // instala o próprio `AbortController` e o `fetch` do Node recusa um signal
    // que não seja da classe dele. Aqui ainda não há fetch, mas divergir do
    // aplicativo no ambiente de teste é dívida que cobra juros depois.
    environment: "happy-dom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      reportsDirectory: "coverage",
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/index.ts"],
    },
  },
});
