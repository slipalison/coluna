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
 *   importa — não contam.
 */

export interface Achado {
  tipo: "setAttribute(style)" | "<style>";
  detalhe: string;
}

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

  const antes = new Set(document.querySelectorAll("style"));
  const acusarEstilo = (no: Node) => {
    const estilos = no instanceof Element ? [...(no.localName === "style" ? [no] : []), ...no.querySelectorAll("style")] : [];
    for (const estilo of estilos) {
      if (!antes.has(estilo as HTMLStyleElement)) {
        achados.push({ tipo: "<style>", detalhe: (estilo.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60) });
      }
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
    }
    return [...achados];
  };
  return { achados: () => [...achados], parar };
}

/** A mensagem que a guarda dá quando acha alguma coisa — a isca confere por ela. */
export function mensagemDaVigia(onde: string, achados: Achado[]): string {
  return `${onde} violaria a CSP (style-src 'self'): ${achados.map((a) => `${a.tipo} ${a.detalhe}`).join(" | ")}`;
}
