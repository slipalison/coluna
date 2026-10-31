/// <reference types="vite/client" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchField } from "./atoms/SearchField";
import { Sheet } from "./molecules/Sheet";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./styles.css";
import { bloco } from "./test/folha";

/**
 * O corpo da folha que rola se rola pelo teclado (ADR-018).
 *
 * O defeito, medido no E2E do Basalto (slipalison/basalto#99, WebKit no
 * iPhone): a folha "Modo de preparo" tem só texto no corpo — ingredientes e
 * passos —, o corpo passa da altura e rola, e o axe acusa
 * `scrollable-region-focusable` em `.co-sheet__body`. O WebKit não faz do
 * contêiner que rola uma parada do Tab, e sem nada focável dentro quem usa
 * teclado não lê o fim da receita (WCAG 2.1.1).
 *
 * O happy-dom não faz layout: a folha alta é dada aqui à mão — o corpo com
 * 2000px de conteúdo em 500px de altura, e o texto abaixo do recorte —, que é
 * exatamente o que a regra do axe lê para decidir que o corpo rola. O axe que
 * roda é o de verdade, o mesmo que o Storybook e o E2E do Basalto rodam.
 */

const PASSOS = Array.from({ length: 12 }, (_, k) => `Passo ${k + 1}: mexa por mais um minuto.`);

function FolhaDeLeitura({ mode = "overlay" as "overlay" | "inline", footer = false }) {
  return (
    <Sheet
      open
      mode={mode}
      title="Modo de preparo"
      onClose={() => undefined}
      footer={footer ? <button type="button">Comi</button> : undefined}
    >
      <p>Ingredientes: arroz, água e sal.</p>
      <ol>
        {PASSOS.map((passo) => (
          <li key={passo}>{passo}</li>
        ))}
      </ol>
    </Sheet>
  );
}

/** O corpo como o navegador o mede numa folha alta: 2000px de conteúdo em 500px. */
function alta(corpo: HTMLElement) {
  Object.defineProperty(corpo, "scrollHeight", { configurable: true, value: 2000 });
  Object.defineProperty(corpo, "clientHeight", { configurable: true, value: 500 });
  corpo.getBoundingClientRect = () => new DOMRect(0, 100, 390, 500);
  // O texto do fim da receita está abaixo do recorte.
  vi.spyOn(Range.prototype, "getClientRects").mockImplementation(
    () => [new DOMRect(16, 1500, 300, 22)] as unknown as DOMRectList,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

const corpoDa = (container: HTMLElement) =>
  container.ownerDocument.querySelector<HTMLElement>(".co-sheet__body") as HTMLElement;

/** O axe nas regras do WCAG A/AA — `scrollable-region-focusable` é `wcag2a`. */
async function varrer(raiz: HTMLElement) {
  const resultado = await axe.run(raiz, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    // O happy-dom não pinta: o contraste é provado em `tokens/contraste.test.ts`.
    rules: { "color-contrast": { enabled: false } },
  });
  return resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

describe("o corpo da folha que rola se rola pelo teclado", () => {
  it.each(["light", "dark"] as const)(
    "no tema %s, a folha só de texto e alta passa no axe, sem scrollable-region-focusable",
    async (tema) => {
      const { container } = render(
        <ThemeProvider theme={tema} attachTo="element" storageKey={null}>
          <FolhaDeLeitura />
        </ThemeProvider>,
      );
      const corpo = corpoDa(container);
      alta(corpo);
      expect(await varrer(container)).toEqual([]);
    },
  );

  it("a isca: sem o tabIndex, o axe acusa o corpo como o Basalto mediu", async () => {
    const { container } = render(<FolhaDeLeitura />);
    const corpo = corpoDa(container);
    alta(corpo);
    corpo.removeAttribute("tabindex");
    expect(await varrer(container)).toEqual(["scrollable-region-focusable: .co-sheet__body"]);
  });

  it("a isca de controle: a folha baixa não rola, e o axe nem olha o corpo", async () => {
    // Sem a altura dada à mão, o axe acha o corpo sem rolagem: a isca acima
    // reprova pela folha alta, e não por outro motivo.
    const { container } = render(<FolhaDeLeitura />);
    corpoDa(container).removeAttribute("tabindex");
    expect(await varrer(container)).toEqual([]);
  });

  it("o corpo é uma região com o nome do título, e uma parada do Tab", () => {
    render(<FolhaDeLeitura />);
    const regiao = screen.getByRole("region", { name: "Modo de preparo" });
    expect(regiao).toHaveClass("co-sheet__body");
    expect(regiao).toHaveAttribute("tabindex", "0");
    // O nome vem do título, e não de um texto novo: o mesmo `h2` que nomeia o diálogo.
    const titulo = screen.getByRole("heading", { name: "Modo de preparo" });
    expect(regiao.getAttribute("aria-labelledby")).toBe(titulo.id);
    expect(screen.getByRole("dialog", { name: "Modo de preparo" }).getAttribute("aria-labelledby")).toBe(titulo.id);
  });

  it("o Tab passa pelo fechar, pelo corpo e pelo rodapé, e dá a volta dentro da folha", async () => {
    const usuario = userEvent.setup();
    render(<FolhaDeLeitura footer />);
    const painel = screen.getByRole("dialog", { name: "Modo de preparo" });
    expect(document.activeElement).toBe(painel);

    const fechar = screen.getByRole("button", { name: "Fechar" });
    const corpo = screen.getByRole("region", { name: "Modo de preparo" });
    const comi = screen.getByRole("button", { name: "Comi" });

    await usuario.tab();
    expect(document.activeElement).toBe(fechar);
    await usuario.tab();
    expect(document.activeElement).toBe(corpo);
    await usuario.tab();
    expect(document.activeElement).toBe(comi);
    await usuario.tab();
    expect(document.activeElement, "o Tab dá a volta, e não sai da folha").toBe(fechar);
    await usuario.tab({ shift: true });
    expect(document.activeElement).toBe(comi);
  });

  it("o initialFocus continua pousando no campo, e o foco volta a quem abriu", async () => {
    function Abridor() {
      const [aberto, definir] = useState(false);
      return (
        <>
          <button type="button" onClick={() => definir(true)}>
            Registrar alimento
          </button>
          <Sheet open={aberto} title="Registrar alimento" onClose={() => definir(false)} initialFocus="first-field">
            <SearchField label="Buscar alimento" />
          </Sheet>
        </>
      );
    }
    const usuario = userEvent.setup();
    render(<Abridor />);
    const abridor = screen.getByRole("button", { name: "Registrar alimento" });
    await usuario.click(abridor);
    const campo = screen.getByRole("searchbox", { name: "Buscar alimento" });
    expect(document.activeElement).toBe(campo);

    // O corpo focável fica ANTES do campo na ordem, e o campo continua alcançável.
    await usuario.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole("region", { name: "Registrar alimento" }));
    await usuario.tab();
    expect(document.activeElement).toBe(campo);

    await usuario.keyboard("{Escape}");
    expect(document.activeElement).toBe(abridor);
  });

  it("na inline o corpo não rola, e nada muda: sem parada do Tab e sem região", () => {
    const { container } = render(<FolhaDeLeitura mode="inline" />);
    const corpo = corpoDa(container);
    expect(corpo).not.toHaveAttribute("tabindex");
    expect(corpo).not.toHaveAttribute("role");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("o anel do corpo vai para dentro dele, com a cor do anel de sempre", () => {
    // O corpo encosta nas bordas da folha, e a folha nas da tela no telefone:
    // com o afastamento de fora, o anel sairia da tela dos lados. Para dentro,
    // largura (2px) + afastamento (-2px) = 0: ele cabe na caixa.
    expect(bloco(".co-root :focus-visible")).toEqual([
      ["outline", "2px solid var(--co-accent)"],
      ["outline-offset", "2px"],
    ]);
    // Só o afastamento muda: a cor e a largura continuam as do anel provado
    // em 3:1 (`tokens/contraste.test.ts`).
    expect(bloco(".co-sheet__body:focus-visible")).toEqual([["outline-offset", "-2px"]]);
  });
});
