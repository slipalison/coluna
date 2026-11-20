/// <reference types="vite/client" />
import { act, fireEvent, render } from "@testing-library/react";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { afterAll, describe, expect, it } from "vitest";
import * as coluna from "./index";
import "./styles.css";
import { mensagemDaVigia, vigiarCsp } from "./test/csp";

/**
 * A guarda da CSP (ADR-024): nada de CSS-in-JS que injete `<style>`, nenhum
 * `setAttribute("style")`.
 *
 * A CSP do Basalto é `style-src 'self'`, e o veredito do E2E de lá reprova
 * qualquer violação. Uma peça desta coluna que injetasse uma folha ou
 * escrevesse o atributo `style` quebraria o app inteiro na primeira tela que a
 * usasse. A prova é em três camadas, cada uma com a sua isca:
 *
 * - MONTANDO TUDO: todo componente exportado pelo pacote, montado dentro do
 *   `ThemeProvider`, com a hora aplicada, a folha aberta e o carrossel
 *   arrastado. A vigia (`src/test/csp.ts`) acusa todo `<style>` que entra no
 *   documento e todo `setAttribute("style")`. Um componente exportado que não
 *   esteja na lista daqui reprova: ninguém esquece de montá-lo.
 * - NO CÓDIGO-FONTE: `scripts/varrer-csp.mjs` lê `src/` atrás do texto que
 *   leva a esses dois caminhos (e do CSS-in-JS em geral).
 * - NO PACOTE: o `npm run build` roda a mesma varredura sobre `dist/`
 *   (`coluna.js` e `index.d.ts`), e falha o build com achado.
 */

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nada = () => {};

/** Cada componente exportado, montado com o que ele precisa para pintar. */
const MONTAGENS: Record<string, () => ReactNode> = {
  ThemeProvider: () => <coluna.ThemeProvider storageKey={null}>tema</coluna.ThemeProvider>,
  Badge: () => (
    <>
      <coluna.Badge>Novo</coluna.Badge>
      <coluna.Badge tone="accent">Almoço</coluna.Badge>
      <coluna.Badge tone="status" solid>
        Feita
      </coluna.Badge>
    </>
  ),
  Button: () => (
    <>
      <coluna.Button>Guardar</coluna.Button>
      <coluna.Button variant="secondary" size="lg" icon="plus">
        Pôr num espaço
      </coluna.Button>
      <coluna.Button variant="ghost">Desfazer</coluna.Button>
      <coluna.Button variant="danger" aria-disabled="true">
        Apagar
      </coluna.Button>
    </>
  ),
  Chip: () => (
    <>
      <coluna.Chip label="Sem lactose" onRemove={nada} />
      <coluna.Chip label="Almoço" selected onClick={nada} />
    </>
  ),
  Divider: () => <coluna.Divider />,
  Dot: () => <coluna.Dot tone="protein" />,
  Grid: () => <coluna.Grid columns={2}>grade</coluna.Grid>,
  Icon: () => <coluna.Icon name="book" />,
  IconButton: () => <coluna.IconButton icon="close" label="Fechar" pressed />,
  Input: () => <coluna.Input aria-label="Peso" unit="kg" defaultValue="80" />,
  Screen: () => (
    <coluna.Screen
      tabBar={
        <coluna.TabBar
          label="Navegação"
          value="hoje"
          onChange={nada}
          items={[
            { value: "hoje", label: "Hoje", icon: "book" },
            { value: "voce", label: "Você", icon: "user" },
          ]}
        />
      }
      actionBar={<coluna.Button>Feita</coluna.Button>}
    >
      tela
    </coluna.Screen>
  ),
  SearchField: () => <coluna.SearchField label="Buscar receita" defaultValue="arroz" count="3 receitas" shortcut="/" />,
  Series: () => (
    <coluna.Series
      label="Peso"
      points={[
        { x: 0, y: 80 },
        { x: 1, y: 79.5 },
      ]}
    />
  ),
  Slat: () => <coluna.Slat value={0.4} tone="carb" label="Carboidrato" />,
  Stack: () => (
    <coluna.Stack direction="row" scroll gap={8}>
      fileira
    </coluna.Stack>
  ),
  Surface: () => <coluna.Surface bordered>cartão</coluna.Surface>,
  Text: () => (
    <coluna.Text variant="title-lg" tone="accent">
      Hoje
    </coluna.Text>
  ),
  VisuallyHidden: () => <coluna.VisuallyHidden>oculto</coluna.VisuallyHidden>,
  Diff: () => <coluna.Diff label="Meta" before="1.900" after="1.950" />,
  Deck: () => (
    <coluna.Deck label="Opções do almoço">
      <div>Opção 1</div>
      <div>Opção 2</div>
    </coluna.Deck>
  ),
  Disclosure: () => <coluna.Disclosure summary="Por que perguntamos">Para calcular a meta.</coluna.Disclosure>,
  EmptyState: () => (
    <coluna.EmptyState title="Nenhuma receita" icon="book">
      Crie a primeira.
    </coluna.EmptyState>
  ),
  Field: () => (
    <coluna.Field label="Peso" hint="Em quilos." error="Escreva um número.">
      {(controle) => <coluna.Input {...controle} />}
    </coluna.Field>
  ),
  Group: () => (
    <coluna.Group label="Refeições" note="A nota." error="O erro.">
      <coluna.ListRow>Almoço</coluna.ListRow>
    </coluna.Group>
  ),
  Legend: () => <coluna.Legend items={[{ label: "Proteína", tone: "protein" }]} />,
  Ruler: () => <coluna.Ruler label="Estimativas" min={1500} max={2500} marks={[{ value: 1950, emphasis: true }]} />,
  ListRow: () => (
    <coluna.ListRow onClick={nada} description="Arroz · Feijão" mark="single" selected>
      Almoço
    </coluna.ListRow>
  ),
  MacroBar: () => <coluna.MacroBar name="Proteína" value={68} target={135} kind="protein" />,
  NavList: () => (
    <coluna.NavList
      label="Você"
      value="corpo"
      onChange={nada}
      items={[
        { value: "corpo", label: "Corpo" },
        { value: "privacidade", label: "Privacidade" },
      ]}
    />
  ),
  Notice: () => (
    <coluna.Notice title="Platô" tone="status">
      A meta foi ajustada.
    </coluna.Notice>
  ),
  PageHeader: () => <coluna.PageHeader title="Livro" subtitle="12 receitas" />,
  Pager: () => (
    <coluna.Pager label="Dia" current="Hoje" previousLabel="Ontem" nextLabel="Amanhã" onPrevious={nada} onNext={nada} />
  ),
  Rail: () => (
    <coluna.Rail
      label="Principal"
      value="hoje"
      onChange={nada}
      items={[
        { value: "hoje", label: "Hoje", icon: "book" },
        { value: "voce", label: "Você", icon: "user" },
      ]}
    />
  ),
  Reckoning: () => (
    <coluna.Reckoning
      lines={[
        { label: "Gasto do dia", value: "2.371" },
        { label: "Meta", value: "1.950", total: true },
      ]}
    />
  ),
  ScreenHeader: () => <coluna.ScreenHeader title="Hoje" subtitle="quarta, 19 de novembro" />,
  SegmentedControl: () => (
    <coluna.SegmentedControl
      label="Dia"
      value="hoje"
      onChange={nada}
      options={[
        { value: "hoje", label: "Hoje" },
        { value: "amanha", label: "Amanhã" },
      ]}
    />
  ),
  Sheet: () => (
    <coluna.Sheet open onClose={nada} title="Apagar a conta" footer={<coluna.Button variant="danger">Apagar</coluna.Button>}>
      Isto apaga os seus dados.
    </coluna.Sheet>
  ),
  Stat: () => <coluna.Stat label="Meta do dia" value="1.950" unit="kcal" caption="na medida da sua meta" />,
  Stepper: () => <coluna.Stepper label="Porções" value={2} onChange={nada} />,
  TabBar: () => (
    <coluna.TabBar
      label="Navegação"
      value="hoje"
      position="static"
      onChange={nada}
      items={[
        { value: "hoje", label: "Hoje", icon: "book" },
        { value: "livro", label: "Livro", icon: "book" },
      ]}
    />
  ),
  Tabs: () => (
    <coluna.Tabs
      label="Receita"
      items={[
        { value: "ingredientes", label: "Ingredientes", content: "150 g de arroz" },
        { value: "preparo", label: "Preparo", content: "Cozinhe." },
      ]}
    />
  ),
};

/** Os componentes que o pacote exporta: as funções com nome de componente. */
const exportados = Object.entries(coluna)
  .filter(([nome, valor]) => typeof valor === "function" && /^[A-Z]/.test(nome))
  .map(([nome]) => nome)
  .sort();

/** Uma tela com tudo, a hora aplicada pelo CSSOM e o carrossel arrastado. */
function Tudo({ extra }: { extra?: ReactNode }) {
  const bloco = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (bloco.current) coluna.applyHour(bloco.current, "07:30");
  }, []);
  return (
    <coluna.ThemeProvider theme="dark" attachTo="element" storageKey={null}>
      <section style={coluna.hourStyle("12:30")}>
        <div ref={bloco}>
          {Object.entries(MONTAGENS).map(([nome, montar]) => (
            <div key={nome} data-componente={nome}>
              {montar()}
            </div>
          ))}
          {extra}
        </div>
      </section>
    </coluna.ThemeProvider>
  );
}

/** Monta, mexe e devolve o que a vigia viu. */
function montarTudo(extra?: ReactNode) {
  const vigia = vigiarCsp();
  const tela = render(<Tudo extra={extra} />);
  // O carrossel escreve o arrasto em propriedades (`--co-deck-dx`) pelo
  // CSSOM: o arrasto também passa pela vigia.
  const card = tela.container.querySelector(".co-deck__card");
  if (card) {
    act(() => {
      fireEvent.pointerDown(card, { pointerId: 1, clientX: 200, clientY: 10, isPrimary: true, button: 0 });
      fireEvent.pointerMove(card, { pointerId: 1, clientX: 120, clientY: 12, isPrimary: true, buttons: 1 });
      fireEvent.pointerUp(card, { pointerId: 1, clientX: 60, clientY: 12, isPrimary: true });
    });
  }
  const achados = vigia.parar();
  tela.unmount();
  return achados;
}

describe("a guarda da CSP, montando tudo", () => {
  it("a lista de montagens é a dos componentes exportados, nem mais nem menos", () => {
    expect(exportados.length).toBeGreaterThan(30);
    expect(Object.keys(MONTAGENS).sort()).toEqual(exportados);
  });

  it("nenhum componente exportado injeta <style> nem chama setAttribute('style')", () => {
    const achados = montarTudo();
    expect(achados, mensagemDaVigia("a coluna montada", achados)).toEqual([]);
  });

  it("a isca: um componente que planta um <style> reprova pela mensagem da guarda", () => {
    function PlantaFolha() {
      useLayoutEffect(() => {
        const folha = document.createElement("style");
        folha.textContent = ".isca { color: red }";
        document.head.append(folha);
        return () => folha.remove();
      }, []);
      return null;
    }
    const achados = montarTudo(<PlantaFolha />);
    expect(mensagemDaVigia("a coluna montada", achados)).toBe(
      "a coluna montada violaria a CSP (style-src 'self'): <style> .isca { color: red }",
    );
  });

  it("a isca: um componente que escreve o atributo style reprova pela mensagem da guarda", () => {
    function PlantaAtributo() {
      const ref = useRef<HTMLSpanElement>(null);
      useLayoutEffect(() => {
        ref.current?.setAttribute("style", "color: red");
      }, []);
      return <span ref={ref}>isca</span>;
    }
    const achados = montarTudo(<PlantaAtributo />);
    expect(mensagemDaVigia("a coluna montada", achados)).toBe(
      "a coluna montada violaria a CSP (style-src 'self'): setAttribute(style) <span> color: red",
    );
  });

  it("a isca: o <style> que entra e sai logo depois também é visto", () => {
    function PiscaFolha() {
      useLayoutEffect(() => {
        const folha = document.createElement("style");
        document.body.append(folha);
        folha.remove();
      }, []);
      return null;
    }
    expect(montarTudo(<PiscaFolha />).map((achado) => achado.tipo)).toEqual(["<style>"]);
  });

  it("o CSSOM não é acusado: a prop style, o setProperty e o cssText", () => {
    const vigia = vigiarCsp();
    const elemento = document.createElement("div");
    elemento.style.setProperty("--co-hora-h", "75");
    elemento.style.color = "red";
    elemento.style.cssText = "opacity: 0.5";
    render(<p style={{ textWrap: "pretty" }}>texto</p>);
    expect(vigia.parar()).toEqual([]);
  });
});

// ------------------------------------------------------------ no texto --

const varrer = (...alvos: string[]) => {
  try {
    const saida = execFileSync(process.execPath, [resolve(raiz, "scripts/varrer-csp.mjs"), ...alvos], {
      cwd: raiz,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { codigo: 0, saida };
  } catch (erro) {
    const falha = erro as { status: number; stderr: string };
    return { codigo: falha.status, saida: falha.stderr };
  }
};

const iscas = mkdtempSync(join(tmpdir(), "coluna-csp-"));
afterAll(() => rmSync(iscas, { recursive: true, force: true }));

describe("a guarda da CSP, no texto", () => {
  it("o código-fonte de src/ está limpo", () => {
    const { codigo, saida } = varrer("src");
    expect(saida).toMatch(/^varrer-csp: \d+ arquivo\(s\), nenhum achado/);
    expect(codigo).toBe(0);
  });

  it("a isca: cada caminho que a CSP recusa é achado, na linha dele, e o comentário não conta", () => {
    const arquivo = join(iscas, "Isca.tsx");
    writeFileSync(
      arquivo,
      [
        "// nunca setAttribute('style', x): isto é comentário",
        "/* nem createElement('style') */",
        'el.setAttribute("style", "color: red");',
        "el.setAttributeNS(null, 'style', 'x');",
        "const f = document.createElement('style');",
        "const j = <style>{'.a{}'}</style>;",
        "sheet.insertRule('.a{}');",
        "document.adoptedStyleSheets = [];",
        "const c = new CSSStyleSheet();",
        "<div dangerouslySetInnerHTML={{ __html: x }} />;",
        "el.innerHTML = x;",
        "el.insertAdjacentHTML('beforeend', x);",
        "document.write(x);",
        'import styled from "styled-components";',
        'import { css } from "@emotion/react";',
        'const url = "https://exemplo.com/a"; el.style.setProperty("--x", "1");',
      ].join("\n"),
    );
    const { codigo, saida } = varrer(arquivo);
    expect(codigo).toBe(1);
    const achados = saida
      .split("\n")
      .filter((linha) => linha.startsWith("  "))
      .map((linha) => linha.trim().replace(/^.*Isca\.tsx:/, ""));
    expect(achados).toEqual([
      "3: setAttribute(style)",
      "4: setAttributeNS(style)",
      '5: createElement("style")',
      "6: <style>",
      "7: insertRule",
      "8: adoptedStyleSheets",
      "9: new CSSStyleSheet",
      "10: dangerouslySetInnerHTML",
      "11: innerHTML/outerHTML",
      "12: insertAdjacentHTML",
      "13: document.write",
      "14: CSS-in-JS",
      "15: CSS-in-JS",
    ]);
  });

  it("a isca: uma varredura que não lê nada falha, em vez de passar", () => {
    const vazia = mkdtempSync(join(iscas, "vazia-"));
    expect(varrer(vazia).codigo).toBe(2);
  });

  it("o build varre o pacote: o npm run build chama a varredura sobre dist/", async () => {
    const pacote = (await import("../package.json")).default as { scripts: Record<string, string> };
    expect(pacote.scripts["build"]).toMatch(/node scripts\/varrer-csp\.mjs dist$/);
  });
});
