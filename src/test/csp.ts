/**
 * A vigia da CSP nos testes (ADR-024).
 *
 * A CSP do Basalto é `style-src 'self'`: o navegador recusa o `<style>`
 * injetado e o atributo `style` escrito com `setAttribute`, e o veredito do E2E
 * de lá reprova a violação. O CSSOM (`element.style.setProperty`, a prop
 * `style` do React, `element.animate()`) continua valendo. Esta vigia acusa,
 * dentro do happy-dom, as duas coisas que a CSP recusaria:
 *
 * - toda chamada a `setAttribute("style", …)` (ou `setAttributeNS`), em
 *   qualquer caixa — MENOS a que o próprio happy-dom faz por dentro do
 *   `CSSStyleDeclaration` para refletir o CSSOM no atributo. Num navegador de
 *   verdade essa reflexão não passa pelo `setAttribute`; no happy-dom passa
 *   (medido: `setProperty`, o setter de cada propriedade e o de `cssText`
 *   chamam `Element.setAttribute`), e acusá-la seria acusar o CSSOM, que é
 *   justamente o caminho permitido. Quem chamou é lido na pilha;
 * - todo `<style>` que entra no documento depois de a vigia começar, mesmo o
 *   que sai logo depois (o `MutationObserver` vê os dois). Os `<style>` que já
 *   estavam lá — o Vite põe a folha do sistema num `<style>` quando o teste a
 *   importa — não contam;
 * - todo `<link rel="stylesheet">` de OUTRA origem que entra no documento (a
 *   folha de terceiro que `style-src 'self'` recusa), e toda `FontFace` com uma
 *   `url()` de outra origem (a fonte de terceiro que `font-src 'self'` recusa,
 *   e que entrega o IP de quem abre o app a quem a serve; ADR-014). O happy-dom
 *   não tem `FontFace`: enquanto vigia, a vigia põe no lugar uma que só anota,
 *   e tira ao parar.
 */

export interface Achado {
  tipo: "setAttribute(style)" | "<style>" | "<link rel=stylesheet>" | "FontFace";
  detalhe: string;
}

/**
 * A URL é de outra origem que a da página? `data:` e `blob:` também contam:
 * `style-src 'self'` e `font-src 'self'` recusam as duas.
 */
function deOutraOrigem(url: string): boolean {
  try {
    return new URL(url, document.baseURI).origin !== location.origin;
  } catch {
    return true;
  }
}

/** A URL sem consulta nem fragmento, para o achado não carregar o que vem nelas. */
function semConsulta(url: string): string {
  try {
    const lida = new URL(url, document.baseURI);
    return lida.protocol === "data:" || lida.protocol === "blob:" ? `${lida.protocol}…` : `${lida.origin}${lida.pathname}`;
  } catch {
    return "(URL ilegível)";
  }
}

/** As URLs de um `src` de fonte: `url(a) format("woff2"), local(b)`. */
const urlsDaFonte = (fonte: string) =>
  [...fonte.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? "");

export interface Vigia {
  /** O que a vigia viu até agora, na ordem. */
  achados: () => Achado[];
  /** Desliga a vigia e devolve o que ela viu. */
  parar: () => Achado[];
}

/** A chamada veio de dentro do `CSSStyleDeclaration` do happy-dom? */
function reflexaoDoCssom(pilha: string): boolean {
  // A linha 0 é "Error", a 1 é o embrulho daqui, a 2 é quem chamou o
  // `setAttribute`.
  const quemChamou = pilha.split("\n")[2] ?? "";
  return /happy-dom/.test(quemChamou) && /CSSStyleDeclaration/.test(quemChamou);
}

export function vigiarCsp(raiz: Node = document): Vigia {
  const achados: Achado[] = [];
  const original = Element.prototype.setAttribute;
  const originalNS = Element.prototype.setAttributeNS;

  Element.prototype.setAttribute = function (this: Element, nome: string, valor: string) {
    if (String(nome).toLowerCase() === "style" && !reflexaoDoCssom(new Error().stack ?? "")) {
      achados.push({ tipo: "setAttribute(style)", detalhe: `<${this.localName}> ${String(valor).slice(0, 60)}` });
    }
    return original.call(this, nome, valor);
  };
  Element.prototype.setAttributeNS = function (
    this: Element,
    espaco: string | null,
    nome: string,
    valor: string,
  ) {
    if (String(nome).toLowerCase().replace(/^.*:/, "") === "style" && !reflexaoDoCssom(new Error().stack ?? "")) {
      achados.push({ tipo: "setAttribute(style)", detalhe: `<${this.localName}> ${String(valor).slice(0, 60)}` });
    }
    return originalNS.call(this, espaco, nome, valor);
  };

  // A `FontFace` do ambiente (o navegador; o happy-dom não tem), embrulhada:
  // a de outra origem é anotada, e a construção segue para a de verdade.
  const escopo = globalThis as { FontFace?: unknown };
  const tinhaFontFace = "FontFace" in escopo;
  const FontFaceOriginal = escopo.FontFace as (new (...args: unknown[]) => object) | undefined;
  const Anotada = class {
    family: string;
    constructor(familia: string, fonte: unknown, descritores?: unknown) {
      this.family = familia;
      if (typeof fonte === "string") {
        for (const url of urlsDaFonte(fonte)) {
          if (deOutraOrigem(url)) achados.push({ tipo: "FontFace", detalhe: `${familia} ${semConsulta(url).slice(0, 60)}` });
        }
      }
      if (FontFaceOriginal) return new FontFaceOriginal(familia, fonte, descritores) as this;
    }
    load() {
      return Promise.resolve(this);
    }
  };
  escopo.FontFace = Anotada;

  const antes = new Set(document.querySelectorAll("style"));
  const acusarEstilo = (no: Node) => {
    if (!(no instanceof Element)) return;
    const estilos = [...(no.localName === "style" ? [no] : []), ...no.querySelectorAll("style")];
    for (const estilo of estilos) {
      if (!antes.has(estilo as HTMLStyleElement)) {
        achados.push({ tipo: "<style>", detalhe: (estilo.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60) });
      }
    }
    const folhas = [...(no.matches('link[rel~="stylesheet" i]') ? [no] : []), ...no.querySelectorAll('link[rel~="stylesheet" i]')];
    for (const folha of folhas) {
      const href = folha.getAttribute("href") ?? "";
      if (deOutraOrigem(href)) achados.push({ tipo: "<link rel=stylesheet>", detalhe: semConsulta(href).slice(0, 60) });
    }
  };
  const observador = new MutationObserver((mudancas) => {
    for (const mudanca of mudancas) mudanca.addedNodes.forEach(acusarEstilo);
  });
  observador.observe(raiz, { childList: true, subtree: true });

  let parada = false;
  const parar = () => {
    if (!parada) {
      parada = true;
      // O que o observador ainda não entregou entra antes de ele parar.
      for (const mudanca of observador.takeRecords()) mudanca.addedNodes.forEach(acusarEstilo);
      observador.disconnect();
      Element.prototype.setAttribute = original;
      Element.prototype.setAttributeNS = originalNS;
      if (tinhaFontFace) escopo.FontFace = FontFaceOriginal;
      else delete escopo.FontFace;
    }
    return [...achados];
  };
  return { achados: () => [...achados], parar };
}

/** A mensagem que a guarda dá quando acha alguma coisa — a isca confere por ela. */
export function mensagemDaVigia(onde: string, achados: Achado[]): string {
  return `${onde} violaria a CSP (style-src 'self'): ${achados.map((a) => `${a.tipo} ${a.detalhe}`).join(" | ")}`;
}
