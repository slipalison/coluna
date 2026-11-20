# ADR-024 — A hora pelo CSSOM, e a guarda da CSP

**Data:** 2026-11-19
**Status:** aceito

## Contexto

No "Relógio de Sol" (ADR-022) a cor muda com a hora de cada refeição: o almoço
das 12h30 é céu, o jantar das 20h é anil. O tema dá a luminosidade e a folha
compõe a cor; falta quem dá o matiz e o croma de cada bloco — um valor que só
existe em tempo de execução, por elemento.

O jeito óbvio de escrever um valor de tempo de execução num elemento é o
atributo `style` (`<div style="--co-hora-h: 205">`), e é justamente o que a CSP
do Basalto recusa: `style-src 'self'`, sem `'unsafe-inline'`, barra o atributo
`style` escrito na marcação ou com `setAttribute`, e barra o `<style>` injetado
(`security.md` §1 do Basalto, `arquitetura.md` §10). O veredito do E2E de lá
reprova qualquer violação, em qualquer família. O que a CSP **não** barra é o
CSSOM: `element.style.setProperty`, a prop `style` do React (que escreve pelo
CSSOM no navegador), `element.animate()` e o CSS de arquivo.

A 1.x nunca precisou provar isso: nenhum componente injetava folha, e o
`Stack` e o `Notice` já usavam a prop `style`. A 2.0 é o momento de transformar
o que era hábito em guarda, porque é a primeira versão em que o consumidor
escreve, por elemento, um valor que vem do JS.

## Decisão

### 1. A hora é uma função pura, e se aplica pelo CSSOM

`src/theme/hour.ts` exporta:

- `hourVars(time)` → `{ h, c }`: o matiz e o croma de `"HH:MM"` (ou de um minuto
  do dia), com as cinco paradas da identidade — aurora 06h (350 / 0,11), manhã
  09h (75 / 0,14), meio-dia 12h (215 / 0,12), entardecer 16h (40 / 0,15), noite
  20h (285 / 0,12). Entre duas paradas, o croma em linha reta e o matiz pelo
  arco MENOR do círculo (das 16h às 20h passa por 0, e não pelo verde); das 20h
  às 6h a conta atravessa a meia-noite sem salto. Uma hora que não existe é
  `RangeError`: cor errada em silêncio pintaria a refeição de outra hora.
- `hourStyle(time)` → `{ "--co-hora-h", "--co-hora-c" }`, para a prop `style`
  do React: `<section style={hourStyle(refeicao.horario)}>`.
- `applyHour(element, time)`: o mesmo fora do React, por
  `element.style.setProperty`. Nunca `setAttribute("style")`.
- `hourStops`: as paradas, para quem precisa percorrê-las (o teste de contraste,
  a vitrine).

A cor é recomposta em cada elemento (ADR-022 §2), então o bloco que recebe a
hora e tudo dentro dele saem com aquela hora, e o resto da tela não muda.

**Limite honesto:** a prop `style` só passa pelo CSSOM quando o React renderiza
no navegador. HTML gerado no servidor sai com o atributo, e a CSP o recusaria.
O Basalto renderiza no navegador (ADR-002 de lá).

### 2. A guarda

Três camadas, cada uma com a sua isca:

- **Montando tudo** (`src/csp.test.tsx`). Todo componente exportado pelo
  pacote, montado no `ThemeProvider`, com a hora aplicada pelos dois caminhos,
  a folha aberta e o carrossel arrastado, sob a vigia de `src/test/csp.ts`, que
  acusa todo `<style>` que entra no documento (inclusive o que sai logo depois)
  e toda chamada a `setAttribute("style")`/`setAttributeNS`, todo
  `<link rel="stylesheet">` e toda `FontFace` com `url()` de outra origem (o que
  `style-src 'self'` e `font-src 'self'` recusam; adendo do lote 1). A lista de
  montagens tem de ser exatamente a dos componentes exportados: um componente
  novo que ninguém montou reprova. As iscas plantam um `<style>`, um atributo e
  um `<style>` que pisca, e reprovam pela mensagem da guarda.
- **No código-fonte** (`scripts/varrer-csp.mjs src`): o texto que leva aos
  caminhos recusados — `setAttribute("style")`, `createElement("style")`,
  `<style>`, `insertRule`, `adoptedStyleSheets`, `new CSSStyleSheet`, HTML cru
  (`dangerouslySetInnerHTML`, `innerHTML =`, `insertAdjacentHTML`,
  `document.write`) e as bibliotecas de CSS-in-JS —, fora dos comentários.
  Quem acha o comentário é o analisador do TypeScript, e não um regex: um
  `" //"` ou um `"/*"` dentro de string não esconde o resto da linha (adendo do
  lote 1). A isca planta cada um num arquivo e confere a linha de cada achado;
  a varredura que não lê arquivo nenhum falha em vez de passar.
- **No pacote**: o `npm run build` termina com `node scripts/varrer-csp.mjs
  dist`, sobre o `coluna.js` e o `index.d.ts` publicados, e falha com achado.
  No JS do pacote a varredura acusa também o `<style>` depois de compilado
  (`jsx("style", …)`) e qualquer URL `http(s)://` ou sem esquema
  (`"//host/…"`, que o navegador completa com o da página): o pacote não busca
  nada de fora. A isca é um `coluna.js` de mentira com cada caso.

**Uma armadilha do happy-dom, medida:** ali o `CSSStyleDeclaration` reflete o
CSSOM no atributo chamando `Element.setAttribute("style", …)` — o
`setProperty`, o setter de cada propriedade e o de `cssText`. Num navegador essa
reflexão não passa pelo `setAttribute`. A vigia lê na pilha quem chamou e ignora
só essa reflexão; sem isso, ela acusaria o CSSOM, que é o caminho permitido, e
a prop `style` de todo componente.

### 3. Medido no navegador

Num aplicativo Vite mínimo com o `dist/` desta versão, servido com a CSP do
Basalto inteira, no Chromium 1248 do Playwright 1.63, no toque e com ponteiro,
nos dois temas, com todas as peças da F0 montadas, a hora aplicada pela
`hourStyle` e pela `applyHour` e a folha aberta: **0 violações de CSP**
(ouvindo `securitypolicyviolation` desde antes do primeiro script), **0
`<style>`** no documento, e a tinta da hora computada como
`oklch(0.46 0.124 193.1)` no claro e `oklch(0.8 0.124 193.1)` no escuro para o
12h30 — o matiz do bloco e a luminosidade do tema.

## Consequências

- A forma de tingir um bloco com a hora é uma só, e cabe na CSP. Quem precisar
  de outro valor por elemento segue o mesmo caminho: a prop `style` com
  propriedades personalizadas, ou `setProperty`.
- Um componente novo nasce montado pela guarda, ou o teste reprova.
- A guarda não vê um `<style>` criado por uma dependência de quem consome (o
  pacote não tem dependência de execução além do React); esse é o veredito da
  CSP no E2E do Basalto (#166).

## Limites conhecidos

O que a guarda não alcança, dito aqui para não parecer que alcança:

- **`setAttribute` com o nome montado dentro de um evento.** A vigia de
  montagem só vê o que acontece enquanto os componentes montam, abrem e são
  arrastados. Um `el.setAttribute(nome, valor)` em que `nome` é montado em
  tempo de execução (`"sty" + "le"`, uma variável) e que só roda dentro de um
  evento que a guarda não dispara passa pelas três camadas: o teste não chega
  lá, o padrão do texto não lê `"style"` inteiro, e a vigia nunca vê a
  chamada. É o mesmo limite das dependências de quem consome (acima): o
  veredito final é o da CSP no navegador, no E2E do Basalto (#166).
