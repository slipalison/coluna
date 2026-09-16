import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sistema } from "../test/setup";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function Sonda() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="escolha">{theme}</span>
      <span data-testid="resolvido">{resolvedTheme}</span>
      <button type="button" onClick={() => setTheme("light")}>
        claro
      </button>
      <button type="button" onClick={() => setTheme("system")}>
        sistema
      </button>
      <button type="button" onClick={toggleTheme}>
        alternar
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  it("segue o sistema quando ninguém escolheu nada", () => {
    sistema.escuro = true;
    render(
      <ThemeProvider>
        <Sonda />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("escolha")).toHaveTextContent("system");
    expect(screen.getByTestId("resolvido")).toHaveTextContent("dark");
    // Em `system` o atributo tem de estar AUSENTE: é isso que deixa a media
    // query do CSS decidir, e o que faz a tela acompanhar o sistema depois.
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });

  it("acompanha o sistema quando ele muda com o aplicativo aberto", () => {
    render(
      <ThemeProvider>
        <Sonda />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("resolvido")).toHaveTextContent("light");

    act(() => sistema.definir(true));

    expect(screen.getByTestId("resolvido")).toHaveTextContent("dark");
  });

  it("a escolha da pessoa vence a preferência do sistema", async () => {
    const usuario = userEvent.setup();
    sistema.escuro = true;
    render(
      <ThemeProvider>
        <Sonda />
      </ThemeProvider>,
    );

    await usuario.click(screen.getByRole("button", { name: "claro" }));

    expect(screen.getByTestId("resolvido")).toHaveTextContent("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("guarda a escolha e a devolve na montagem seguinte", async () => {
    const usuario = userEvent.setup();
    const { unmount } = render(
      <ThemeProvider>
        <Sonda />
      </ThemeProvider>,
    );
    await usuario.click(screen.getByRole("button", { name: "alternar" }));
    expect(screen.getByTestId("escolha")).toHaveTextContent("dark");
    unmount();

    render(
      <ThemeProvider>
        <Sonda />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("escolha")).toHaveTextContent("dark");
  });

  it("volta a seguir o sistema quando a escolha é desfeita", async () => {
    const usuario = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="dark">
        <Sonda />
      </ThemeProvider>,
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    await usuario.click(screen.getByRole("button", { name: "sistema" }));

    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });

  it("controlado de fora, ignora o que foi guardado", async () => {
    const usuario = userEvent.setup();
    window.localStorage.setItem("coluna-theme", "dark");
    render(
      <ThemeProvider theme="light">
        <Sonda />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("escolha")).toHaveTextContent("light");

    await usuario.click(screen.getByRole("button", { name: "alternar" }));

    // Quem controla é o pai: o clique avisa, não mexe.
    expect(screen.getByTestId("escolha")).toHaveTextContent("light");
  });

  it("com attachTo element, marca só a própria subárvore", () => {
    const { container } = render(
      <ThemeProvider attachTo="element" defaultTheme="dark" storageKey={null}>
        <Sonda />
      </ThemeProvider>,
    );

    expect(container.querySelector(".co-root")).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });

  it("useTheme fora do provedor estoura em vez de chutar", () => {
    // Um palpite silencioso aqui pinta a série do gráfico com a cor do tema
    // errado, e ninguém descobre.
    expect(() => render(<Sonda />)).toThrow(/ThemeProvider/);
  });
});
