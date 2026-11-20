/// <reference types="vite/client" />
import { act, fireEvent, render } from "@testing-library/react";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { forwardRef, memo, useLayoutEffect, useRef, type ReactNode } from "react";
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

/**
 * Os componentes de um módulo: o que tem nome de componente e é uma função, ou
 * um objeto de componente do React — `memo(...)` e `forwardRef(...)` devolvem
 * um objeto com `$$typeof`, e não uma função, e um filtro só de função deixaria
 * o componente embrulhado fora da lista sem ninguém notar.
 */
function componentesDe(modulo: Record<string, unknown>): string[] {
  return Object.entries(modulo)
    .filter(
      ([nome, valor]) =>
        /^[A-Z]/.test(nome) &&
        (typeof valor === "function" || (typeof valor === "object" && valor !== null && "$$typeof" in valor)),
    )
    .map(([nome]) => nome)
    .sort();
}

/** Os componentes que o pacote exporta. */
const exportados = componentesDe(coluna);

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

  it("a isca: o filtro dos exportados vê o componente embrulhado em memo e em forwardRef", () => {
    const Simples = () => null;
    const modulo = {
      Simples,
      Memorizado: memo(Simples),
      ComRef: forwardRef<HTMLDivElement>((_props, _ref) => null),
      CONSTANTE: 1,
      Objeto: { semTipo: true },
      utilitario: () => null,
    };
    expect(componentesDe(modulo)).toEqual(["ComRef", "Memorizado", "Simples"]);
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

  it("a isca: um componente que põe uma folha de outra origem reprova pela mensagem da guarda", () => {
    function PlantaLink() {
      useLayoutEffect(() => {
        const folha = document.createElement("link");
        folha.rel = "stylesheet";
        folha.href = "https://fonts.googleapis.com/css2?family=Isca";
        document.head.append(folha);
        return () => folha.remove();
      }, []);
      return null;
    }
    const achados = montarTudo(<PlantaLink />);
    expect(mensagemDaVigia("a coluna montada", achados)).toBe(
      "a coluna montada violaria a CSP (style-src 'self'): <link rel=stylesheet> https://fonts.googleapis.com/css2",
    );
  });

  it("a isca: uma FontFace de outra origem reprova pela mensagem da guarda", () => {
    function PlantaFonte() {
      useLayoutEffect(() => {
        const Fonte = (globalThis as unknown as { FontFace: new (familia: string, fonte: string) => object }).FontFace;
        new Fonte("Isca", 'url("https://fonts.gstatic.com/s/isca.woff2?v=1") format("woff2")');
      }, []);
      return null;
    }
    const achados = montarTudo(<PlantaFonte />);
    expect(mensagemDaVigia("a coluna montada", achados)).toBe(
      "a coluna montada violaria a CSP (style-src 'self'): FontFace Isca https://fonts.gstatic.com/s/isca.woff2",
    );
  });

  it("a folha e a fonte da própria origem não são acusadas, e a vigia devolve a FontFace do ambiente", () => {
    const antes = (globalThis as { FontFace?: unknown }).FontFace;
    const vigia = vigiarCsp();
    const folha = document.createElement("link");
    folha.rel = "stylesheet";
    folha.href = "/coluna/styles.css";
    document.head.append(folha);
    const Fonte = (globalThis as unknown as { FontFace: new (familia: string, fonte: string) => object }).FontFace;
    new Fonte("Figtree", 'url("./fonts/figtree.woff2") format("woff2"), local("Figtree")');
    expect(vigia.parar()).toEqual([]);
    folha.remove();
    expect((globalThis as { FontFace?: unknown }).FontFace).toBe(antes);
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
        // Um `//` e um `/*` dentro de string não abrem comentário: o que vem
        // depois deles na linha é código, e é achado.
        'const s = " //"; el.setAttribute("style", s);',
        'const a = "/*"; el.setAttribute("style", a); const b = "*/";',
        "const p = <p>// texto de JSX, e não comentário</p>; el.setAttribute('style', 'x');",
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
      "17: setAttribute(style)",
      "18: setAttribute(style)",
      "19: setAttribute(style)",
    ]);
  });

  it("a isca do pacote: no JS compilado, o `//` e o `/*` dentro de string também não escondem o que vem depois", () => {
    // O `dist/` é JavaScript sem tipo nem JSX escrito, e a varredura dele lê o
    // mesmo analisador (`npm run build` termina com `varrer-csp.mjs dist`).
    const pacote = mkdtempSync(join(iscas, "dist-"));
    writeFileSync(
      join(pacote, "coluna.js"),
      [
        "/* comentário de licença: setAttribute('style', x) aqui não conta */",
        'function a(e){const s=" //";e.setAttribute("style",s)}',
        'function b(e){const t="/*";e.setAttribute("style",t);const u="*/"}',
        "// e este, de linha, também não conta: createElement('style')",
        'function c(e){e.style.setProperty("--co-hora-h","75")}',
      ].join("\n"),
    );
    const { codigo, saida } = varrer(pacote);
    expect(codigo).toBe(1);
    expect(
      saida
        .split("\n")
        .filter((linha) => linha.startsWith("  "))
        .map((linha) => linha.trim().replace(/^.*coluna\.js:/, "")),
    ).toEqual(["2: setAttribute(style)", "3: setAttribute(style)"]);
  });

  it("a isca: uma varredura que não lê nada falha, em vez de passar", () => {
    const vazia = mkdtempSync(join(iscas, "vazia-"));
    expect(varrer(vazia).codigo).toBe(2);
  });

  it("a isca do pacote: o <style> compilado e a URL absoluta, com ou sem esquema, no JS são achados", () => {
    const pacote = mkdtempSync(join(iscas, "dist-"));
    writeFileSync(
      join(pacote, "coluna.js"),
      [
        'import{jsx as r,jsxs as n}from"react/jsx-runtime";',
        'function a(){return r("style",{children:".a{}"})}',
        'function b(){return n("style", {children:[".b{}"]})}',
        'const c="https://cdn.exemplo.com/isca.woff2";',
        "fetch('http://exemplo.com/a');",
        // Sem esquema: o navegador completa com o da página. O texto de uma
        // barra só (`\"/a//b\"`) e a divisão não são URL.
        'const d="//cdn.exemplo.com/isca.woff2";',
        "const e=`//fonts.exemplo.com:8080/x`;",
        "const f=\"@font-face{src:url(//cdn.exemplo.com/a.woff2)}\";",
        'const g="/a//b/",h=n//2;',
        // O que é do pacote, e não conta: o `style` do CSSOM e um texto que
        // só começa com "style".
        'function d(e){e.style.setProperty("--x","1");return r("div",{className:"styles"})}',
      ].join("\n"),
    );
    writeFileSync(join(pacote, "index.d.ts"), 'export declare const docs = "https://exemplo.com";');
    const { codigo, saida } = varrer(pacote);
    expect(codigo).toBe(1);
    expect(
      saida
        .split("\n")
        .filter((linha) => linha.startsWith("  "))
        .map((linha) => linha.trim().replace(/^.*(coluna\.js|index\.d\.ts):/, "$1:")),
    ).toEqual([
      'coluna.js:2: <id>("style", …)',
      'coluna.js:3: <id>("style", …)',
      "coluna.js:4: URL absoluta",
      "coluna.js:5: URL absoluta",
      "coluna.js:6: URL sem esquema",
      "coluna.js:7: URL sem esquema",
      "coluna.js:8: URL sem esquema",
    ]);
  });

  it("o build varre o pacote: o npm run build chama a varredura sobre dist/", async () => {
    const pacote = (await import("../package.json")).default as { scripts: Record<string, string> };
    expect(pacote.scripts["build"]).toMatch(/node scripts\/varrer-csp\.mjs dist$/);
  });
});
