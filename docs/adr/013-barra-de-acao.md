# ADR-013 — A barra de ação

**Data:** 2026-10-06
**Status:** aceito

## Contexto

O cartão [basalto#54](https://github.com/slipalison/basalto/issues/54) pede o
Basalto com o telefone em pé e sem subir e descer: abrir o dia e ter "Nova
refeição" à mão, preencher a Calculadora com "Calcular" sempre à vista, ler a
meta e guardá-la sem rolar até o fim. Hoje cada uma dessas ações mora no fim do
conteúdo, e a tela que rola as leva para baixo da barra de abas ou para fora da
janela.

A fase `telefone-em-retrato-e-sem-subir-e-descer` do Basalto decidiu a peça na
D-2026-10-06-telefone-em-retrato-e-sem-subir-e-descer-8: a `Screen` ganha uma
barra fixa acima da `TabBar`, genérica, sem nome de domínio, sem `style` inline
(a CSP do Basalto é `style-src 'self'`) e com `scroll-padding-bottom`, para o
foco do teclado nunca ficar atrás dela. Nenhuma peça da 1.7.1 cobre isso: a
`Screen` só tem `tabBar` (um `boolean`) e `grain`.

O plano da fase e o preflight dela
(D-2026-10-06-telefone-em-retrato-e-sem-subir-e-descer-10 e -11 do Basalto)
refinaram o contrato, e é por eles que a 1.8.0 traz mais que a prop:

- **A barra chega pela casca.** Quem monta a `Screen` no Basalto é a casca, e
  não a tela; a ação de cada tela vai à barra por portal, para um hospedeiro
  que a casca guarda em `useState` pela `ref` de um `Stack` — sem efeito. O
  `Stack` precisa do tipo do `ref`.
- **A ordem do documento é a da tela.** Com a `TabBar` como filho da `Screen` e
  a barra de ação depois de `children`, as abas viriam ANTES da barra no
  documento — e no Tab e no leitor de tela —, embora fiquem embaixo dela na
  tela (WCAG 2.4.3). A `Screen` passa a aceitar a `TabBar` como nó.
- **A barra tem a altura de uma fileira, por token.** O hospedeiro é um
  `Stack direction="row"`: o `Stack` escreve `flex-direction` no próprio
  `style`, e nenhuma regra da folha o vence sem `!important` — dois botões
  empilhados dobrariam a altura. A reserva e o recuo leem um token, e nenhum
  efeito mede a barra montada.
- **A barra vazia não existe.** O hospedeiro fica montado em toda tela do
  telefone, inclusive nas que não mandam ação nenhuma (Ajustes, o Hoje
  enquanto carrega). Vazia é nenhum descendente com conteúdo, atravessando o
  embrulho do aplicativo.
- **As medidas caseiras de um alimento** rolam de lado numa fileira que não
  quebra (`Stack scroll`), para a folha de registrar caber sem rolar; e **os
  três macros do dia** vão para uma faixa de três colunas, onde o `MacroBar`
  empilhado estoura a uns 104px por coluna (`MacroBar layout="compact"`).

Tudo isso é geometria de tela e peça de interface, do mesmo tipo da área
segura (ADR-011) e da faixa sob o relógio (ADR-012): vem para cá, e nada aqui
sabe o que é uma refeição (ADR-003).

## Decisão

### 1. `Screen.actionBar` — o nó vai depois do conteúdo

```tsx
<Screen tabBar={<TabBar … />} actionBar={<Stack direction="row" ref={definir} role="group" aria-label="Ações desta tela" />}>
  {conteudo}
</Screen>
```

```html
<div class="co-screen co-grain" data-tabbar="true" data-actionbar="true">
  <div class="co-screen__statusbar" aria-hidden="true"></div>
  …o conteúdo…
  <div class="co-screen__actionbar">…o nó…</div>
  <nav class="co-tabbar">…</nav>
</div>
```

- **Com nó, a barra; sem nó, a árvore da 1.7.1.** `undefined`, `null`, um
  booleano ou o texto vazio não desenham nada: a `Screen` fica exatamente como
  era, sem a `div` e sem o `data-actionbar`. Um componente que não desenha nada
  ainda é um nó — a barra é montada vazia, e a folha a esconde (§4).
- **Sem `style`, sem `role`, sem rótulo.** A barra é uma `div` com a classe e
  nada mais: posição, altura e reserva vêm da folha, e o nome do grupo é do
  consumidor, que sabe que ações são aquelas. Nenhuma prop de rótulo ou de
  clique entra na `Screen` (ADR-003).

### 2. `Screen.tabBar` aceita nó — a ordem do Tab é a da tela

`tabBar?: boolean | ReactNode`. `true` é a 1.7.1: só a reserva, e a barra vem
de quem consome, onde ele a puser. Um nó reserva igual e entra como o ÚLTIMO
filho, depois da barra de ação. A ordem do documento — que é a do Tab e a do
leitor de tela — fica a mesma da tela vista de cima para baixo: o conteúdo, a
barra de ação, as abas (WCAG 2.4.3, ordem do foco).

### 3. A folha da barra

```css
:root {
  /* …as quatro --co-safe-*, --co-statusbar-height e scroll-padding-top… */
  --co-actionbar-height: calc(var(--co-border-width) + var(--co-space-10) + var(--co-target-min) + var(--co-space-10));
  scroll-padding-bottom: 0px;
}

.co-screen__actionbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: var(--co-space-8);
  box-sizing: border-box;
  height: calc(var(--co-actionbar-height) - var(--co-space-10)
    + max(var(--co-space-10), calc(var(--co-safe-bottom) - var(--co-space-14))));
  padding: var(--co-space-10) max(var(--co-space-16), var(--co-safe-right))
    max(var(--co-space-10), calc(var(--co-safe-bottom) - var(--co-space-14)))
    max(var(--co-space-16), var(--co-safe-left));
  background: var(--co-overlay);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border-top: var(--co-border-width) solid var(--co-overlay-line);
}

.co-screen[data-tabbar="true"] > .co-screen__actionbar {
  bottom: calc(73px - var(--co-space-10)
    + max(var(--co-space-10), calc(var(--co-safe-bottom) - var(--co-space-14))));
  height: var(--co-actionbar-height);
  padding-bottom: var(--co-space-10);
}

.co-screen__actionbar > *,
.co-screen__actionbar .co-button {
  flex: 1 1 0;
  min-width: 0;
}
```

- **Uma fileira, por token.** `--co-actionbar-height` é o fio, o respiro de
  cima, o alvo de 44px e o respiro de baixo: 65px. A barra DECLARA a altura
  (`height`, com `box-sizing: border-box`), em vez de medir o que vem dentro:
  um botão ou dois lado a lado dão a mesma barra, e a reserva da tela e o recuo
  da rolagem, que leem o mesmo token, nunca ficam atrás dela. Nada na folha a
  deixa crescer — nem altura mínima, nem quebra de linha, nem coluna. Um
  `Button size="lg"` (52px) não cabe na fileira, e não é para caber: a barra é
  de botão `md`.
- **Com as abas, ela encosta no topo delas.** A barra de abas mede
  `73px − 10px + max(...)` — o respiro de cima, o destino de 52px, o fio e o
  rodapé (ADR-012) —, e é esse o `bottom` da barra de ação, com o MESMO termo
  `max(...)`. Se um mudar sem o outro, abre-se um vão entre as duas, ou uma
  cobre a outra. Embaixo dela, então, só o respiro de 10px: a área segura já é
  das abas.
- **Sem abas, ela é quem encosta na borda.** O rodapé é o termo `max(...)` da
  barra de abas: o botão entra 14px na área do indicador de início, como os
  destinos (ADR-012), e a barra cresce o que esse termo crescer — 75px com o
  indicador de 34px.
- **O vidro é o das abas**: o mesmo fundo com alfa, o mesmo desfoque, o mesmo
  fio em cima. Onde o filtro não existe, fica opaca, nunca ilegível.
- **A calha é a da tela**, com o entalhe em paisagem: os botões começam e
  terminam onde o conteúdo começa e termina.
- **Os botões dividem a largura.** O primeiro nível é o que o consumidor pôs
  na barra — os botões, ou o hospedeiro que os guarda, que se estica —, e todo
  `Button` dentro dela divide a fileira: um sozinho a ocupa, dois ficam meio a
  meio.
- **Camada 20**, a das abas, dentro da pilha da tela: abaixo do véu do `Sheet`
  (40), que cobre as duas.

A reserva da tela soma UMA fileira, e a última linha fica 31px acima da barra
de ação, com e sem área segura:

```css
.co-screen[data-actionbar="true"]:has(> .co-screen__actionbar :not(:empty)) {
  --co-screen-bottom: calc(31px + var(--co-actionbar-height) - var(--co-space-10)
    + max(var(--co-space-10), calc(var(--co-safe-bottom) - var(--co-space-14))));
}

.co-screen[data-tabbar="true"][data-actionbar="true"]:has(> .co-screen__actionbar :not(:empty)) {
  --co-screen-bottom: calc(104px - var(--co-space-10)
    + max(var(--co-space-10), calc(var(--co-safe-bottom) - var(--co-space-14)))
    + var(--co-actionbar-height));
}
```

A reserva das abas sozinhas (`.co-screen[data-tabbar="true"]`, ADR-012) não
muda uma letra; com a barra de ação, ela ganha a fileira.

| área de baixo | abas | barra de ação | reserva com as duas | folga | barra sozinha | reserva sem abas | folga |
|---|---|---|---|---|---|---|---|
| 0 (sem área segura) | 73 | 65 | 169 | 31 | 65 | 96 | 31 |
| 21 | 73 | 65 | 169 | 31 | 65 | 96 | 31 |
| 34 (iPhone) | 83 | 65 | 179 | 31 | 75 | 106 | 31 |
| 48 | 97 | 65 | 193 | 31 | 89 | 120 | 31 |

### 4. A barra vazia não pinta e não reserva

```css
.co-screen__actionbar:not(:has(:not(:empty))) {
  display: none;
}
```

Vazia é nenhum descendente com conteúdo. `:not(:empty)` é um elemento com
filho — outro elemento ou texto —, então o botão com o rótulo dele conta, e o
hospedeiro vazio de um portal não: a condição atravessa o embrulho do
consumidor. Vazia, a barra sai da tela e da árvore de acessibilidade, e a
reserva da tela não cresce — as regras da reserva (§3) e do recuo (§5) fazem a
MESMA pergunta, escrita do lado de fora, porque `:has()` não se aninha.

- **Atravessa UM embrulho.** Um elemento vazio dentro de outro já é conteúdo
  para o CSS, que vê filho, e não texto: um hospedeiro com uma `div` vazia
  dentro pinta a barra. Um `input` solto direto na barra, que nunca tem filho,
  conta como vazio. A barra é de `Button`, e o `Button` sempre tem um rótulo.
- **Sem `:has()`** (Safari antes de 15.4, Chrome antes de 105, Firefox antes de
  121), a regra da barra vazia cai inteira e a barra aparece sempre; as da
  reserva e do recuo também caem, e a tela reserva só as abas.

### 5. O recuo de baixo da rolagem — o foco não fica atrás das barras

```css
:root:has(.co-screen[data-tabbar="true"]) {
  scroll-padding-bottom: calc(104px - var(--co-space-10)
    + max(var(--co-space-10), calc(var(--co-safe-bottom) - var(--co-space-14))));
}

:root:has(.co-screen[data-actionbar="true"] > .co-screen__actionbar :not(:empty)) {
  scroll-padding-bottom: /* o texto da reserva sem abas */;
}

:root:has(.co-screen[data-tabbar="true"][data-actionbar="true"] > .co-screen__actionbar :not(:empty)) {
  scroll-padding-bottom: /* o texto da reserva com as duas */;
}
```

É a lição do adendo 1.7.1 do ADR-012, embaixo. Uma barra fixa embaixo cobre o
controle que o Tab leva até a borda de baixo da janela: o navegador rola a
página só até o controle aparecer, e ele aparece ATRÁS do vidro, com o anel de
foco junto (WCAG 2.2, 2.4.11, foco não escondido, AA). O recuo de baixo da
janela faz o Tab, a âncora e o `scrollIntoView` pararem acima das barras.

- **0 sem barras, o termo da reserva com elas.** O `:root` declara 0px, e cada
  regra `:root:has(...)` troca o zero pelo MESMO texto da reserva do mesmo
  caso, com a mesma condição: o controle que o Tab traz fica onde a última
  linha fica em repouso, 31px acima do vidro.
- **No `:root`, perguntando à tela.** O recuo da janela é do elemento raiz, e
  uma custom property não sobe da tela até ele.
- **Vale também sem a barra de ação.** A 1.7.1 não tinha recuo de baixo para
  a barra de abas, e o foco caía atrás dela (medido abaixo). A 1.8.0 conserta
  isso junto, pela primeira regra.
- **Entrar na barra não rola a página.** O foco que vai do conteúdo para um
  botão da barra, ou das abas, deixa a rolagem onde estava (medido).

### 6. `Stack` — o `ref` e a fileira que rola

- **`ref?: Ref<HTMLElement>`.** No React 19 o `ref` já chega ao elemento pelo
  resto das props; faltava o tipo. Serve ao hospedeiro do portal, guardado em
  `useState` pela `ref`, e ao foco ao montar — sem efeito e sem `forwardRef`.
  Com a função, o React a chama com o elemento ao montar e com `null` ao
  desmontar.
- **`scroll?: boolean`.** Uma fileira que não quebra: o que não cabe fica ao
  lado, e ela rola no eixo x. O `nowrap` e o `overflow-x: auto` vão no mesmo
  `style` (CSSOM) que o `Stack` já escreve, e o `scroll` vence o `wrap`. O que
  um `style` não alcança mora na folha, por `data-scroll="true"`: os filhos não
  encolhem (num `nowrap`, cada um encolheria até a palavra mais longa do
  rótulo, e a fileira viraria uma pilha de rótulos quebrados), e a caixa ganha
  4px de respiro em volta, devolvidos como margem negativa, para o anel de foco
  caber dentro da caixa que rola sem os filhos saírem do lugar. Quem a põe
  precisa de 4px de folga em volta — a calha de qualquer contêiner do sistema
  já dá.

### 7. `MacroBar layout="compact"`

Ponto e nome, o número embaixo, a barra curta embaixo dele, empilhados numa
coluna estreita — a faixa de três macros do telefone. Sem a altura mínima de
56px da linha de lista e sem o respiro de 20px de cada lado: quem dá a calha é
a grade que põe as três lado a lado. O texto que não cabe quebra
(`overflow-wrap: anywhere`), em vez de vazar para a coluna do vizinho. A cor
continua não sendo sinal sozinha (ADR-005): o nome, o número e o nome da barra
(`"Carboidrato líquido: 222,2 de 222 g"`) se leem.

### A medição

No Chromium do Playwright 1.63, com a área segura emulada pelo protocolo do
navegador (`Emulation.setSafeAreaInsetsOverride`), a folha publicada
(`dist/styles.css`) e as peças do `dist/coluna.js` desta versão, montadas numa
página de 393×852, tema escuro, com 30 botões e 6 parágrafos no conteúdo,
rolada até o fim:

| caso | sem área segura: barra / abas / vão / folga / reserva / recuo | 59/34: barra / abas / vão / folga / reserva / recuo |
|---|---|---|
| abas + barra, um botão | 65 / 73 / 0 / 30,7 / 169 / 169 | 65 / 83 / 0 / 30,7 / 179 / 179 |
| abas + barra, dois botões | 65 / 73 / 0 / 30,7 / 169 / 169 | 65 / 83 / 0 / 30,7 / 179 / 179 |
| só a barra | 65 / — / 0 da borda / 30,7 / 96 / 96 | 75 / — / 0 da borda / 30,7 / 106 / 106 |
| abas + hospedeiro vazio | `display: none`, 0 / 73 / — / 30,7 / 104 / 104 | `display: none`, 0 / 83 / — / 30,7 / 114 / 114 |
| só abas | — / 73 / — / 30,7 / 104 / 104 | — / 83 / — / 30,7 / 114 / 114 |
| sem barras | — / — / — / 39,7 / 40 / 0 | — / — / — / 73,7 / 74 / 0 |

A folga é a da última linha até o topo da barra que pinta mais alto; os 0,3px
abaixo de 31 são o resto subpixel da rolagem (a altura do documento é inteira)
e aparecem igual no caso só com abas, como os 31,2 do ADR-012. A barra não tem
atributo `style` em caso nenhum.

O foco, com 45 Tab a partir do topo e 45 Shift+Tab a partir do fim. Conta como
escondido o controle (fora das barras) cujo retângulo fica inteiro fora da área
entre a faixa sob o relógio e a barra mais alta de baixo; e como parcial, o que
tem o anel (4px em volta) cortado por uma das bordas:

| | sem área segura | 59/34 |
|---|---|---|
| 1.7.1, só abas, Tab do topo | **2 escondidos** e 3 parciais embaixo | **3 escondidos** e 4 parciais embaixo |
| 1.8.0, cada caso acima, Tab do topo | 0 escondidos, 0 parciais | 0 escondidos, 0 parciais |
| 1.8.0, cada caso, Shift+Tab do fim | 0 escondidos, 0 parciais embaixo | 0 escondidos, 0 parciais embaixo |
| rolagem ao entrar na barra | 0px | 0px |

Os escondidos da 1.7.1 são o controle que o Tab leva à borda de baixo da
janela: 807,8 a 851,8, atrás da barra de abas que começa em 779 (769 com a área
de baixo). Com o Shift+Tab, todas as versões têm de 3 a 5 parciais EM CIMA — o
anel do controle que para exatamente no recuo de cima encosta na faixa ou na
borda da janela —, igual na 1.7.1; isso é do ADR-012, e fica fora daqui.

O `compact`, com os três lado a lado num `Grid columns={3} gap={8}` dentro da
`Screen`, "Carboidrato líquido" e "222,2 de 222 g" na coluna do meio, nas
fontes que a caixa tem para o lugar da Archivo (o padrão do sistema, a
Liberation Sans, de métrica da Helvetica, e a FreeSans):

| largura | coluna | altura | transborda (`scrollWidth > clientWidth`) | o nome | o número |
|---|---|---|---|---|---|
| 360 | 104 | 71 | 0 elementos; grade 328/328, documento 360/360 | 2 linhas | 1 linha |
| 320 | 90,67 | 92 | 0 elementos; grade 288/288, documento 320/320 | 2 linhas | 2 linhas |

O axe (`@axe-core/playwright`) nas histórias "Padrões/Tela do diário › Com a
barra de ação" e "› Com a barra de ação, no iPhone", "› Diário" e "› No
iPhone" (que trocaram de código) e "Moléculas/MacroBar › Compacta, em três
colunas", nos temas claro e escuro: 0 violações.

### O que fica de fora

- **A barra no desktop.** A folha não a limita a uma largura: numa tela larga,
  o botão se estica pela janela inteira. O Basalto só a passa no telefone; no
  desktop, a ação fica no conteúdo, onde já está.
- **Mais de uma fileira.** Três ações, um `Button size="lg"`, um texto ao lado
  dos botões: a altura é de uma fileira de botão `md`, e o resto transborda.
  Quem precisar disso precisa de outra peça.
- **O motor do iPhone de verdade.** O WebKit do Playwright não emula a área
  segura; os números com área são do Chromium, e o olho no aparelho fica com o
  dono.
- **A fonte do produto.** A Archivo não está na máquina que mediu; o `compact`
  foi medido com as que estavam, nas larguras de 360 e 320, e não transbordou
  em nenhuma.
- **O anel em cima com o Shift+Tab** (acima): é do recuo de cima, do ADR-012.

## Consequências

- **Minor, e não quebra.** As props são novas (`actionBar`, o nó em `tabBar`,
  `Stack.ref` e `Stack.scroll`, o `compact`), e sem elas a árvore da `Screen`
  é a da 1.7.1, letra por letra. Nenhuma regra da 1.7.1 mudou; a folha só
  ganhou regras, e o `tokens.css` publicado é o mesmo.
- **Muda o foco de quem já usa `tabBar`.** Com a barra de abas, o `:root`
  passa a recuar a rolagem de baixo (104px sem área segura): o Tab para o
  controle acima das abas, e não atrás delas. É o conserto de um defeito
  medido, e nada muda de lugar na tela.
- **O recuo é da JANELA.** Quem rola dentro de um contêiner próprio
  (`overflow: auto`) põe o mesmo recuo nele, como no adendo do ADR-012.
- **`fixed` é relativo à janela**, a menos que um ancestral crie bloco de
  contenção (`transform`, `filter`, `contain`) — as histórias usam
  `contain: layout` na moldura do aparelho para conter ali a faixa, a barra de
  ação e as abas.
- **O teste de unidade prova a amarração, não o pixel.** A leitura da folha e
  a conta avaliada saíram de `src/area-segura.test.tsx` para
  `src/test/folha.ts`, sem mudar uma linha da conta, porque
  `src/barra-de-acao.test.tsx` prova a reserva com ela; as listas fechadas do
  primeiro ganharam as regras novas. O happy-dom erra as duas metades da
  condição da barra vazia — casa todo `:has()` com seletor composto (até o do
  `:root` de uma página sem tela) e dá por vazio um elemento só com texto —,
  então ela é avaliada à mão, na forma que a folha escreve, contra a árvore que
  a `Screen` monta. O pixel é do navegador, e no Basalto o E2E mede a caixa
  pintada da barra (`.co-screen__actionbar`).
- **O consumidor ganha duas formas de pôr as abas**, e as duas ficam: `true`
  com a `TabBar` onde ele quiser (a 1.7.1), ou o nó, com a ordem certa de
  graça. Com a barra de ação, só o nó dá a ordem certa.

## Adendo 1.8.1 (2026-10-06) — a ação recém-chegada se arma

**O defeito.** A barra fica no mesmo lugar de uma tela para a outra, e a ação
da tela seguinte nasce exatamente embaixo do dedo que tocou a da anterior. Na
verificação da fase `telefone-em-retrato-e-sem-subir-e-descer` do Basalto
(achado F3, [basalto#54](https://github.com/slipalison/basalto/issues/54)), com
a 1.8.0 no app real, um toque duplo em "Calcular" (o segundo 150ms depois do
primeiro, no mesmo ponto) caiu em "Guardar esta meta". A tela do resultado
tinha posto esse botão no mesmo lugar da barra, e o toque guardou uma meta que
a pessoa não pediu: um `PUT /api/v1/me/goal`. A ação nova aparece pronta para
o toque, no ponto exato onde o dedo ainda está.

**O conserto.** O controle que acabou de chegar à barra não aceita PONTEIRO
por 400ms:

```css
.co-screen__actionbar button,
.co-screen__actionbar a,
.co-screen__actionbar [role="button"] {
  animation: co-acao-armando 400ms step-end;
}

@keyframes co-acao-armando {
  from { pointer-events: none; }
  to { pointer-events: auto; }
}

@media (prefers-reduced-motion: reduce) {
  /* …o zero de `.co-root *`, como antes… */
  .co-screen__actionbar button,
  .co-screen__actionbar a,
  .co-screen__actionbar [role="button"] {
    animation-duration: 400ms !important;
  }
}
```

- **Uma animação, e não um efeito.** Ela começa quando o elemento entra no
  documento, ou quando a barra vazia volta a pintar. Não há JS novo, nem
  atributo `style`, nem prop. `pointer-events` anima como discreto: `step-end`
  segura o `from` pela janela inteira (com a curva padrão, o valor viraria na
  metade, aos 200ms). Sem atraso, sem repetição e sem `fill-mode`, o fim da
  janela devolve o `pointer-events` da cascata.
- **Só ponteiro.** O toque que chega dentro da janela cai no vidro da barra (no
  hospedeiro do consumidor, ou na própria barra), que não faz nada, e não
  atravessa para o conteúdo atrás dela. O teclado (Enter, Espaço) e o leitor de
  tela acionam na hora: o toque duplo é coisa de dedo, e quem chegou pelo Tab
  escolheu o botão. Nada muda na aparência: um botão que se mostrasse desligado
  por 400ms chamaria atenção para nada.
- **400ms** é mais que o intervalo do toque duplo medido (150ms), e é pouco
  para quem leu o rótulo novo e quer mesmo tocar.
- **Os controles da barra, e só eles.** O botão, o link e o `role="button"`
  em qualquer nível dentro da barra, inclusive no hospedeiro de um portal. O
  conteúdo da tela, as abas e o que está fora da `Screen` não mudam. Um `input`
  solto não é pego, porque a barra é de `Button` (§4).
- **O que JÁ estava na barra não se rearma** quando outro controle chega.
- **Vale com movimento reduzido.** A trava não move nada, e zerá-la devolveria
  o toque duplo justamente a quem pediu menos movimento. A exceção usa os
  mesmos três seletores, mais específicos que o `.co-root *` do zero. Como as
  duas declarações são `!important`, vence a especificidade.

**O limite: a janela é da ENTRADA no documento.** Se o consumidor troca a
ação de uma tela pela da outra no MESMO elemento (o mesmo portal, um `Button`
no mesmo lugar, outro rótulo e outro clique), o React reaproveita o `<button>`,
e nada entra no documento. Aí o toque duplo volta (medido abaixo, linha
"mesmo `<button>`"). Uma `key` diferente para cada ação faz o React montar um
nó novo, e a trava volta a valer. No Basalto, cada tela tem o próprio portal
(`CalculatorForm` e `GoalResult`, este dentro de `PhoneResult`), e a troca de
tela desmonta um e monta o outro: o "Guardar esta meta" é um nó novo.

**A medição.** No Chromium e no WebKit do Playwright 1.63, com o
`dist/styles.css` e o `dist/coluna.js` desta versão montados numa página de
393×852 com toque. A página tem um `ThemeProvider`, uma `Screen` com a
`TabBar` e um `Stack` hospedeiro guardado por `ref` como `actionBar`, e as
ações chegam por portal, como no Basalto. O ponteiro vai por coordenada
(`mouse.click` e `touchscreen.tap`), sem a espera de acionabilidade do
Playwright, e o tempo é o do `pointerdown` contado da entrada do botão.

| caso | Chromium, clique / toque | WebKit, clique / toque |
|---|---|---|
| (1) entra, ponteiro aos ~150ms | não dispara (160,9 / 153,2ms); cai no hospedeiro | não dispara (158 / 158ms); cai no hospedeiro |
| (2) entra, ponteiro aos ~500ms | dispara (505,3 / 504,5ms) | dispara (507 / 507ms) |
| (3) foco ao entrar, Enter / Espaço aos ~50ms | dispara (57,9 / 52,2ms) | dispara (52 / 57ms) |
| (4) movimento reduzido, ~150ms | não dispara (151,2 / 154,4ms) | não dispara (155 / 155ms) |
| (4) movimento reduzido, ~500ms | dispara (502,5 / 504,1ms) | dispara (505 / 504ms) |
| (5) A já estava, B chega; os dois aos ~150ms de B | A dispara, B não | A dispara, B não |
| o toque duplo do F3, segundo toque aos ~155ms | "Guardar esta meta": 0 | 0 |
| o mesmo, terceiro toque aos ~505ms | "Guardar esta meta": 1 | 1 |
| o F3 com o mesmo `<button>` reaproveitado | "Guardar esta meta": **1** | **1** |
| o mesmo, com `key` | 0 | 0 |
| a 1.8.0 (o `dist/styles.css` da tag), (1) e o F3 | dispara; "Guardar esta meta": **1** | dispara; **1** |

Com o movimento reduzido emulado, a transição do botão do conteúdo cai para
`1e-05s` no Chromium e `0.00001s` no WebKit, então o zero está valendo. O
botão da barra continua com `co-acao-armando 0.4s`.

**Consequências.** É `fix`, e por isso a versão é patch: nenhuma API nova, e a
árvore da `Screen` é a da 1.8.0, letra por letra. A folha ganha a regra, o
`@keyframes` e a exceção dentro do `@media` de movimento reduzido.

- Uma animação própria num controle da barra precisa de um seletor mais
  específico, e com ele desliga a trava daquele controle. Para manter as duas,
  liste as duas: `animation: co-acao-armando 400ms step-end, a-minha …`.
- O teste de unidade (`src/barra-de-acao.test.tsx`) prova o texto. Uma regra
  só usa a animação, com os três seletores da barra. O `@keyframes` só mexe em
  `pointer-events`. O atalho tem três partes (nome, 400ms, `step-end`). A
  exceção do movimento reduzido tem os mesmos seletores, a mesma duração e mais
  especificidade que o zero. O teste prova também a cascata do happy-dom: o
  atalho chega aos três controles da barra e a nenhum outro, e com
  `prefersReducedMotion: "reduce"` o resto da página fica em 0.01ms e a barra
  em 400ms. O clique ignorado é do navegador, porque o happy-dom não testa onde
  o ponteiro acerta.
- `src/test/folha.ts` ganha `dentroDe()`: as regras de dentro de UMA at-rule,
  pelo cabeçalho. `REGRAS` sabe que uma regra mora numa at-rule, mas não em
  qual.
