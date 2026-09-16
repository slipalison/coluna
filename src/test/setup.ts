import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * `matchMedia` controlável.
 *
 * O `ThemeProvider` assina `prefers-color-scheme`, e sem poder MUDAR essa
 * resposta no meio do teste não dá para provar o caso que mais importa: o
 * usuário escolheu claro, o sistema está no escuro, e a escolha tem de vencer.
 */
export const sistema = {
  escuro: false,
  ouvintes: new Set<() => void>(),
  definir(escuro: boolean) {
    this.escuro = escuro;
    for (const ouvinte of this.ouvintes) ouvinte();
  },
};

beforeEach(() => {
  sistema.escuro = false;
  sistema.ouvintes.clear();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (consulta: string) => ({
      media: consulta,
      get matches() {
        return consulta.includes("dark") && sistema.escuro;
      },
      onchange: null,
      addEventListener: (_: string, ouvinte: () => void) => sistema.ouvintes.add(ouvinte),
      removeEventListener: (_: string, ouvinte: () => void) => sistema.ouvintes.delete(ouvinte),
      addListener: (ouvinte: () => void) => sistema.ouvintes.add(ouvinte),
      removeListener: (ouvinte: () => void) => sistema.ouvintes.delete(ouvinte),
      dispatchEvent: () => false,
    }),
  });
});

afterEach(() => {
  cleanup();
});
