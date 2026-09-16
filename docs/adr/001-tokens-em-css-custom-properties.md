# ADR-001 — Tokens em CSS custom properties, e não em CSS-in-JS

**Data:** 2026-09-16
**Status:** aceito

## Contexto

Um design system precisa que a cor, o espaço e a tipografia venham de um lugar
só. As três formas que disputam isso hoje:

1. **CSS-in-JS** (styled-components, emotion): tokens são objetos JavaScript, o
   tema vai por contexto de React, a folha é gerada em tempo de execução.
2. **Zero-runtime com extração** (vanilla-extract, Panda): tokens em TypeScript,
   CSS extraído no build.
3. **CSS custom properties**: tokens são variáveis do próprio CSS.

A escolha muda o que o consumidor carrega, e muda o que acontece quando alguém
troca de tema.

## Decisão

**CSS custom properties**, em duas camadas: primitiva (o valor) e semântica (o
papel). Só a semântica muda com o tema.

## Por quê

**Trocar de tema não re-renderiza a árvore.** Com CSS-in-JS, o tema vive num
contexto de React; mudá-lo re-renderiza todo componente que o consome — que é
todo componente. Aqui o que muda é um atributo no DOM, e o navegador repinta.
Numa tela de diário com quatro refeições abertas, isso é a diferença entre
repintar e reconstruir.

**Zero runtime no bundle do consumidor.** O pacote publica JS de componente e
uma folha de CSS. Não há motor de estilo, não há cache de classe gerada, não há
ordem de injeção para dar errado em SSR.

**Os tokens continuam legíveis de fora do React.** O `index.html` do PWA precisa
da cor de fundo para o `<meta name="theme-color">` antes de qualquer bundle
carregar. Um e-mail, uma página de erro estática, um `<canvas>` — todos leem
`--co-canvas` sem montar componente nenhum. Token que só existe dentro do React
não serve para nada disso.

**O inspetor do navegador mostra o token, e não o pixel.** Ver
`gap: var(--co-space-16)` no DevTools diz de onde o valor veio; ver `gap: 16px`
não diz nada, e o próximo desenvolvedor escreve `15px` sem saber que errou.

## Consequências

**Aceitas:**

- **A lista do tema escuro aparece duas vezes** — uma na media query
  `prefers-color-scheme`, outra no seletor `[data-theme="dark"]`. É duplicação
  de MAPEAMENTO, não de valor: os dois blocos apontam para as mesmas
  primitivas, e um valor errado continua tendo um lugar só para consertar. Sem
  pré-processador não há como evitar, e trazer um por causa disso seria a
  ferramenta maior que o problema.
- **O TypeScript não valida nome de token dentro do CSS.** `var(--co-acent)`
  compila e some. O antídoto está em `src/tokens/tokens.ts`, que tipa os nomes
  semânticos para o lado do JavaScript, e na revisão.
- **Cor não é interpolável em JavaScript sem lê-la primeiro.** Quem precisar
  escurecer um acento em 10% tem de ler o valor resolvido (`readToken`) em vez
  de calcular a partir do objeto de tema.

**Recusadas:**

- Publicar tokens também como objeto JS com os valores copiados. Seriam duas
  verdades, e elas divergem no primeiro ajuste que alguém faz só de um lado.
