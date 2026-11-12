# ADR-019 — O carrossel de cards e as abas dentro do card

**Data:** 2026-11-03
**Status:** aceito

## Contexto

O cardápio em cards do Basalto (cartão slipalison/basalto#120, guia da série em
#114) mostra uma refeição por card, que se troca arrastando para os lados, e
dentro de cada card abas com ingredientes, preparo e macros. A Coluna não tinha
nenhuma das duas peças, e peça que o app precisa nasce aqui, não no app
(ADR-016): o piso de UX de um carrossel e de uma fileira de abas é do
componente, e não de cada tela que os usa.

## Decisão

**Duas moléculas novas: `Deck` (o carrossel) e `Tabs` (as abas). As duas seguem
o padrão do WAI-ARIA, e todo limiar do piso que elas tocam é provado em
`src/carrossel-e-abas.test.tsx`.**

### `Deck`

- **A raiz é uma região com `aria-roledescription="carrossel"`** e o `label`
  como nome; cada card é um grupo com `aria-roledescription="card"` e o nome de
  `cardLabel` (a posição, "2 de 5", por padrão). Um card na tela; os outros
  ficam montados e `hidden`, para o que a pessoa escreveu num deles continuar lá.
- **O gesto sempre tem alternativa** (WCAG 2.5.1 e 2.5.7): duas setas embaixo do
  card, com 44px e o limite de controle (`--co-control-border`), porque o card
  e a seta têm a mesma superfície. As setas do teclado, Home e End trocam de
  card com o foco no card ou numa seta; com o foco num controle dentro do card,
  a tecla é do controle. Não dá a volta: na ponta a seta fica `aria-disabled`, e
  não `disabled`, como no `Pager`.
- **O foco vai para o card novo** em toda troca feita pela pessoa, no quadro
  seguinte (o card só foca sem o `hidden`): quem usa leitor de tela ouve o nome
  do card, e quem usa teclado continua com as setas dali. Por isso não há região
  viva: o anúncio é o do foco, e uma região viva diria a posição duas vezes.
- **O arrasto** leva o card com o dedo e um giro de no máximo 6°
  (`DECK_GIRO_MAX`), e troca quando passa de 64px (`DECK_LIMIAR`); abaixo
  disso, o card volta com a transição normal. O ponteiro só é capturado depois
  de 8px (`DECK_FOLGA`): capturar na descida faria o toque num botão dentro do
  card cair no card. O clique que fecha um arrasto não chega ao que está embaixo
  do dedo. A vertical é da página (`touch-action: pan-y`).
- **Com `prefers-reduced-motion`**, o card não anda nem gira com o dedo
  (`transform: none`), e a volta, que é transição, zera pela regra geral: o
  arrasto só decide, ao soltar, se troca.
- **O indicador de posição** é desenho (`aria-hidden`): a vaga vazia é um anel
  de 8px no limite de controle, e a cheia um traço de 24px cheio de acento.
  Forma e largura diferentes, e não só cor (ADR-005); os dois no piso de 3:1.
- **A página não rola de lado**: a janela do card corta só na horizontal com
  `overflow-x: clip`, que não vira contêiner de rolagem — o card que sai de lado
  com o dedo não alarga a página. O anel do card fica por dentro.

### `Tabs`

- **`tablist`, `tab` e `tabpanel`, com ativação automática**: a aba focada é a
  que abre. As setas para os lados dão a volta, Home e End vão às pontas, e a
  fileira custa um Tab só (tabindex itinerante), como o `SegmentedControl`.
- **O painel rola por dentro**, nos dois eixos, quando o conteúdo não cabe —
  letra a 200%, 320px, um card de altura fixa (`flex` com `min-height: 0`, e
  `--co-tabs-panel-max-height` para quem quer um teto sem fixar o card). Por
  isso o painel é sempre uma parada do Tab (`tabIndex={0}`), pelo mesmo motivo
  do corpo da folha (ADR-018): só de texto, ele não teria por onde ser rolado
  pelo teclado. O anel fica por dentro.
- **A fileira tem o limite de controle**, como o segmentado; a aba aberta muda
  de fundo e de peso. Nome comprido a 200% rola de lado dentro da fileira, nunca
  na página. O anel da aba aberta é `--co-accent-contrast`, porque o de acento
  sumiria no fundo de acento.
- **A letra da aba é `--co-text-14`**, a do `Button`, e herda a fonte
  (`font: inherit`).

## O que ficou de fora

- **Rolagem por `scroll-snap`** em vez do arrasto escrito à mão. O snap dá o
  gesto de graça, mas não o giro, e põe todos os cards na rolagem horizontal: o
  leitor de tela atravessa os quatro como se fossem um texto só, e o foco num
  card fora da tela rola a fileira sem trocar o card "na tela".
- **Avançar sozinho**. Um carrossel que gira sozinho exige botão de pausa (WCAG
  2.2.2) e tira o card de quem está lendo. O cardápio não precisa.
- **Pontos clicáveis**. Cada ponto como botão exigiria 44px de alvo, e com seis
  cards o indicador não cabe a 320px. O indicador é desenho, e as setas, o
  teclado e o arrasto já levam a qualquer card.

## Consequências

- Duas peças novas no pacote, versão menor nova pela esteira; o Basalto fixa
  essa versão no C1 da série.
- A seta do carrossel e a fileira de abas entram na lista de controles do teste
  de contraste (`control-border` ≥ 3:1 nos dois temas), e a seta na lista do
  desligado que apaga igual no `:disabled` e no `aria-disabled`.
- A regra de movimento reduzido ganha uma terceira entrada, a do card, que não
  mexe em duração nem toca na trava de toque do ADR-013.
- A medida no navegador (Chromium e WebKit do Playwright, as histórias do
  `Deck` e das `Tabs`, claro e escuro, janela de 320px): o axe nas regras do
  WCAG A/AA não acha nada; as setas medem 44×44 e as abas 44px de altura; a
  página não rola de lado, nem a 160px (320px com zoom de 200%), com a fileira
  de abas rolando dentro de si; o painel de "Preparo" rola por dentro (522px de
  conteúdo em 173px) e o End, com o foco nele, leva-o para baixo; a seta, o
  teclado e o arrasto trocam de card, e o foco chega ao card novo.

## Adendo (2026-11-12) — o painel é alvo, e não mede menos que o piso

O painel das `Tabs` é parada do Tab (`tabIndex={0}`, acima), e toda parada do
Tab é um alvo. Ele encolhia até zero (`min-height: 0`), e com conteúdo curto
ficava abaixo do piso: a guarda de UX do Basalto mediu 22,5px na aba "Preparo"
com um passo só e 43,5px em "Ingredientes" com um alimento
(slipalison/basalto#155), contra 44px no toque e 24px com ponteiro.

O painel passa a encolher até `--co-target-min`, e não até zero:
`min-height: var(--co-target-min)` na própria `.co-tabs__panel`, em qualquer
contexto — solto, num card de altura fixa, com ou sem
`--co-tabs-panel-max-height`, dentro do `Deck` e da folha de altura cheia
(ADR-020). O piso mora na peça, e nenhuma tela precisa lembrar dele (ADR-016).
O que não muda: o painel continua rolando por dentro quando o conteúdo não
cabe, e as `Tabs` (`.co-tabs`) continuam encolhendo.

A medida no navegador (Chromium do Playwright, claro e escuro, 393px com toque
e 1280px com ponteiro): o painel com uma linha de texto, ou com um passo de
preparo, mede 44px (antes, 22,5px); num card de 100px de altura em coluna flex,
44px (antes, 0); com seis linhas, 238px, antes e depois.
