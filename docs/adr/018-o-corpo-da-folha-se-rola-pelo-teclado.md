# ADR-018 — O corpo da folha se rola pelo teclado

**Data:** 2026-10-30
**Status:** aceito

## Contexto

O E2E do Basalto mediu, com a 1.11.1, o axe acusando
`scrollable-region-focusable` em `.co-sheet__body` no WebKit do iPhone (cartão
slipalison/basalto#99). A folha "Modo de preparo" tem só texto no corpo —
ingredientes e passos —, e o corpo, que rola quando o conteúdo passa da altura
máxima da folha (`max-height: 88%`), não tem nenhum controle dentro. O WebKit
não faz do contêiner que rola uma parada do Tab, e quem usa teclado não alcança
o fim da receita: o Tab só passa pelo fechar, e as setas e o Page Down não têm
o que rolar (WCAG 2.2, 2.1.1).

Medido na coluna, na história "Só de leitura" (corpo com 153px a rolar), no
Chromium e no WebKit do Playwright, nos dois temas, com o `tabindex` tirado na
hora (a isca): o Tab vai do fechar para o fechar, o End deixa o `scrollTop` em
0, e o axe acusa `scrollable-region-focusable`.

A `Sheet` não aceita props no corpo, então o app não tem como consertar. E nem
deveria: o defeito é da peça, e o piso que depende de um componente é garantido
no componente (ADR-016).

## Decisão

**Em `overlay`, o corpo da folha é uma parada do Tab e uma região com o nome do
título: `tabIndex={0}`, `role="region"` e `aria-labelledby` apontando o `h2` da
folha.** Sem prop. O anel de foco é o de sempre (`--co-accent`, 2px), com o
afastamento para dentro (`outline-offset: -2px`).

- `tabIndex={0}` é o conserto que o próprio axe recomenda, e o que o Chromium
  passou a fazer sozinho com os "keyboard-focusable scrollers" — o WebKit, não.
  Com o corpo focado, as setas, o Page Down, o Home e o End rolam a receita.
- **O nome é o título, e não um texto novo.** Um `div` focável sem papel lê,
  no foco, o texto inteiro do corpo — a receita toda de uma vez. Como região,
  ele se anuncia "Arroz branco, região". O título é o mesmo que nomeia o
  diálogo: o leitor de tela diz o nome duas vezes (ao abrir e ao entrar no
  corpo), e é o preço de não inventar um rótulo ("Conteúdo") que a coluna teria
  de traduzir e que não diz nada.
- **O anel vai para dentro.** O corpo encosta nas bordas da folha, e a folha nas
  da tela no telefone: com o afastamento de fora (`+2px`), o anel sairia da tela
  dos lados e cobriria o cabeçalho e o rodapé. Com `-2px`, largura mais
  afastamento é 0: o anel fica no respiro do corpo, sobre a superfície da folha,
  com `--co-accent` a 6,34:1 no claro e 6,07:1 no escuro (medido no navegador;
  o teste de tokens prova ≥ 3:1 nos quatro fundos).

### Sempre, e não só quando rola

A outra opção era medir `scrollHeight > clientHeight` com um `ResizeObserver`
(e um `MutationObserver`, porque o conteúdo que cresce dentro de um corpo já na
altura máxima não muda o tamanho do corpo) e só então pôr o `tabIndex`. Ficou
de fora:

- **A parada que aparece e some é pior que uma a mais.** A altura do corpo muda
  com o conteúdo (um resultado de busca), a rotação do telefone e o texto a
  200%. Medido, o Tab mudaria de caminho no meio da folha aberta, para a mesma
  pessoa, sem que nada na tela dissesse por quê.
- **A primeira pintura não teria a parada.** O efeito que mede roda depois do
  layout; um leitor que chega pelo Tab logo ao abrir pode passar pelo corpo
  antes de ele virar focável.
- **O custo de sempre é uma tecla, numa ordem que continua lógica** (WCAG
  2.4.3): fechar, corpo, o que há no corpo, rodapé. A folha já prende o Tab
  dentro dela, então a parada a mais não alonga a página, só a volta da folha.
  E é a parada que faz o Page Down rolar o corpo também numa folha com
  controles, sem precisar de um controle no meio do texto.

### O que não muda

- **`inline`**: o corpo não tem altura máxima e não rola. Ali nada muda — sem
  `tabIndex` e sem região —, porque uma parada que não rola nada, fora de um
  diálogo, alongaria o Tab da página inteira.
- **`initialFocus`**: o foco ainda pousa no painel, no primeiro campo ou no
  `ref`. A busca `CAMPOS` não procura o corpo, e o corpo não é campo. Quem abriu
  continua gravado antes, e o foco volta para ele ao fechar.
- **A busca presa (ADR-017)**: continua presa no topo do corpo; o corpo focado
  não rola sozinho. Com a busca presa, a borda de cima do anel do corpo fica por
  baixo da faixa (`z-index: 1`); os lados e a base continuam à vista.
- **A área segura**: o recuo de baixo é da folha (`padding-bottom`), fora do
  corpo; o anel do corpo não passa da caixa dele.

## Consequências

- Toda folha em `overlay` ganha uma parada do Tab entre o fechar e o conteúdo,
  e um landmark de região dentro do diálogo. Um app que contava as paradas do
  Tab da folha conta uma a mais.
- A prova (`src/corpo-focavel.test.tsx`) roda o axe-core de verdade no
  happy-dom, com a folha alta dada à mão (o happy-dom não faz layout): sem o
  `tabIndex`, ele acusa `scrollable-region-focusable` em `.co-sheet__body`, e
  com ele, nada, nos dois temas. O mesmo arquivo prova a região com o nome do
  título, a ordem do Tab, o `initialFocus`, a `inline` sem nada e o anel para
  dentro. O `axe-core` passa a ser dependência de desenvolvimento declarada (já
  vinha pelo `@storybook/addon-a11y`).
- A medida no navegador (Chromium e WebKit, história "Só de leitura", claro e
  escuro) é a do PR: com o conserto, o Tab vai do fechar para o corpo e o End
  leva o `scrollTop` de 0 a 153, o fim; o axe nas regras do WCAG A/AA não acha
  nada.
