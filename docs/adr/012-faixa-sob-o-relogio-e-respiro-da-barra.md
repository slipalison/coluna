# ADR-012 — A faixa sob o relógio e o respiro da barra

**Data:** 2026-10-01
**Status:** aceito

## Contexto

A 1.6.0 pôs a área segura do aparelho na moldura (ADR-011), e o Basalto
instalado num iPhone com ilha dinâmica passou a recuar o título do relógio e a
barra de abas do indicador de início. O dono usou e mandou duas capturas no
cartão [basalto#46](https://github.com/slipalison/basalto/issues/46), no tema
escuro:

- **a barra de abas sobra embaixo.** O rodapé dela é
  `max(var(--co-space-10), var(--co-safe-bottom))`: no iPhone, os 34px inteiros
  que o sistema reserva para o indicador. Os rótulos ficam 34px acima do fim da
  tela, e a barra parece flutuar sobre um vão;
- **o conteúdo rolado passa por baixo do relógio.** A moldura recua o título em
  repouso, mas, com a tela rolada, o texto sobe até a borda e fica atrás do
  relógio e da ilha — ilegível para os dois;
- e uma terceira, que não é daqui: em tela curta, no modo instalado, a barra
  fixa não encosta no fim da tela, porque o viewport do WebKit deixa a área de
  baixo de fora. Isso é altura do documento do aplicativo, e o Basalto conserta
  no `app.css` dele.

As duas primeiras são geometria de tela, do mesmo tipo que a área segura, e
peça que falta no Basalto vem para cá (ADR-009). Elas saem juntas, na 1.7.0.

## Decisão

### 1. Os destinos da barra entram 14px na área de baixo

```css
.co-tabbar {
  padding: var(--co-space-10) var(--co-space-10);
  padding-bottom: max(var(--co-space-10), calc(var(--co-safe-bottom) - var(--co-space-14)));
}
```

- **Por que entrar na área.** O gesto do indicador de início dispara nos
  últimos milímetros da borda física, e não nos 34px inteiros que o iPhone
  reserva: a área segura é a margem que o sistema GARANTE livre, não a faixa
  que o gesto ocupa. Com o rodapé em 20px, os rótulos ficam 20px acima do fim
  da tela, ainda longe de onde o polegar arrasta para sair do aplicativo.
- **Por que 14.** É `--co-space-14`, o respiro horizontal do botão, do campo,
  da busca e do aviso — um token que a folha já usa, e não um número solto.
- **O piso continua.** O `max` com `--co-space-10` mantém os 10px de sempre
  quando a área de baixo é pequena ou não existe: `max(10, 0 − 14) = 10`.
- **Depois do `padding`**, como na 1.6.0: o atalho zeraria o lado de baixo.

A reserva da tela com barra acompanha com o MESMO termo:

```css
.co-screen[data-tabbar="true"] {
  --co-screen-bottom: calc(104px - var(--co-space-10) + max(var(--co-space-10), calc(var(--co-safe-bottom) - var(--co-space-14))));
}
```

A barra mede `10 + 52 + 1 + termo` (respiro de cima, destino, fio e rodapé), e
a reserva, `94 + termo`: a última linha fica 31px acima da barra com qualquer
área de baixo, como na 1.5.0 sem área segura (ADR-011). Se um dos dois termos
mudar sem o outro, a folga muda junto — por isso a regra é escrita duas vezes
com o mesmo texto, e o teste confere que é o mesmo.

| área de baixo | rodapé | barra | reserva | folga |
|---|---|---|---|---|
| 0 (sem área segura) | 10 | 73 | 104 | 31 |
| 21 | 10 | 73 | 104 | 31 |
| 30 | 16 | 79 | 110 | 31 |
| 34 (iPhone) | 20 | 83 | 114 | 31 |
| 48 | 34 | 97 | 128 | 31 |
| 1.6.0 no iPhone | 34 | 97 | 128 | 31 |

### 2. A faixa sob o relógio

```css
:root {
  --co-safe-top: env(safe-area-inset-top, 0px);
  --co-safe-right: env(safe-area-inset-right, 0px);
  --co-safe-bottom: env(safe-area-inset-bottom, 0px);
  --co-safe-left: env(safe-area-inset-left, 0px);
  --co-statusbar-height: var(--co-safe-top);
}

.co-screen__statusbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  height: calc(var(--co-statusbar-height) * 4 / 3);
  pointer-events: none;
  background: linear-gradient(to bottom, var(--co-canvas) 0%, var(--co-canvas) 75%, transparent 100%);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 75%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0%, #000 75%, transparent 100%);
}
```

A `Screen` monta a faixa SEMPRE, sem prop nova: um
`<div className="co-screen__statusbar" aria-hidden="true" />` como primeiro
filho, antes do conteúdo. Por ser `fixed`, ela não entra no fluxo e não desloca
nada; sem área segura ela tem 0px e não aparece.

- **Uma propriedade própria, resolvida no `:root`.** `--co-statusbar-height` é
  a altura do que o sistema desenha em cima, e a faixa lê só ela. Como é
  declarada no `:root` a partir de `--co-safe-top`, o valor que desce para a
  tela é o do `:root` — e sobrevive ao zero que o consumidor escreve em
  `--co-safe-top` debaixo de um aviso (ADR-011). É o comportamento certo: o
  zero diz onde o CONTEÚDO começa, e o relógio continua no mesmo lugar da tela
  com ou sem aviso. Uma faixa que lesse `--co-safe-top` direto sumiria com o
  aviso de pé. Declarada SÓ no `:root`, pelo mesmo motivo das quatro
  `--co-safe-*`: repetida na tela, ela leria o zero.
- **A área de cima mais um terço, opaca até 75%.** Com a faixa exatamente da
  altura da área e o gradiente indo ao transparente dentro dela, o relógio, no
  meio da área, fica sobre metade de opacidade, e o texto rolado aparece atrás
  dele — o defeito do cartão. Com `* 4 / 3`, os 75% de cima são a área inteira
  (3/4 de 4/3 = 1): o relógio fica todo sobre `--co-canvas` opaco, e só o terço
  a mais esmaece. Proporção, e não um trecho fixo somado: sem área segura a
  faixa continua com 0px, e um `+ 20px` apareceria no navegador comum.
- **A máscara esmaece o desfoque junto.** O `backdrop-filter` não tem
  gradiente: sem máscara, o desfoque terminaria numa linha dura na base da
  faixa, por baixo do fundo que já esmaeceu. A máscara usa o mesmo gradiente do
  fundo, e o `-webkit-mask-image` vem junto porque o Safari é o motor do
  iPhone. O `#000` da máscara não é cor que chega à tela — a máscara só lê o
  alfa —, então não fere a regra de nenhuma cor literal.
- **`pointer-events: none`.** A faixa é pintura: um toque nela passa ao que está
  atrás. Com a tela rolada, isso é o conteúdo escondido sob o relógio — aceito
  de propósito, porque a alternativa é uma faixa que engole o toque no topo de
  toda tela, inclusive em repouso, onde não há nada atrás dela.
- **Camada 20, dentro da pilha da tela.** O `isolation: isolate` do grão faz da
  `.co-screen` uma pilha própria: a faixa cobre o conteúdo da tela e nada fora
  dela — a barra de abas, um painel, um aviso do consumidor ficam onde estavam.
- **Nada inline, os dois temas pelo token.** O fundo é `--co-canvas`, o fundo
  da própria tela, que o tema troca; e nenhum `style` sai do componente, então
  a CSP com `style-src 'self'` de quem consome continua de pé.

Em repouso nada fica embaixo dela. O título começa em 28px + área (ADR-011) e
fica fora enquanto `28 + t ≥ 4t/3`, isto é, com área de cima de até 84px; a
marca do trilho começa em 20px + área e fica fora até 60px. Com os 59px do
iPhone 16: faixa de 78,67px, título a 87px (8,33px abaixo), marca a 79px
(0,33px abaixo). Com os 24px de um iPad: faixa de 32px, marca a 44px.

Medido no Chromium, com a área segura emulada pelo protocolo do navegador
(`Emulation.setSafeAreaInsetsOverride`), a folha publicada montada com as
classes da `Screen`, da `TabBar` e do `Rail` e com o `app.css` do Basalto:

| caso | faixa (altura × largura) | título | marca | rodapé / barra / reserva / folga |
|---|---|---|---|---|
| sem área segura | 0 × 360 (oculta) | 28 | 29,41 | 10 / 73 / 104 / 31,2 |
| iPhone (59 em cima, 34 embaixo), telefone | 78,66 × 360 | 87 | — | 20 / 83 / 114 / 31,2 |
| iPhone, desktop 1440 | 78,66 × 1440 | 87 | 79 | — |
| iPad (24 em cima) | 32 | 52 | 44 | 10 / 73 / 104 / 31,2 |
| iPhone com o aviso do Basalto de pé | 78,66 | 163 | 164,41 | 20 / 83 / 114 / 31,2 |
| faixa lendo `--co-safe-top` direto, com o aviso | 0 (some) | 163 | — | — |
| 1.6.0 no iPhone | ausente | 87 | 79 | 34 / 97 / 128 / 31,2 |

Com a tela rolada 120px, a faixa continua no topo; a faixa de 20 a 40px da
tela é igual pixel a pixel em repouso e rolada (com a altura igual à área e sem
máscara, ela muda: o texto aparece atrás do relógio). O fundo computado é
`linear-gradient(rgb(242, 238, 248) 0%, rgb(242, 238, 248) 75%, rgba(0, 0, 0, 0) 100%)`
no claro e `linear-gradient(rgb(13, 11, 17) 0%, rgb(13, 11, 17) 75%, rgba(0, 0, 0, 0) 100%)`
no escuro — a cor de fundo da própria tela nos dois.

### O que fica de fora

- **O viewport do modo instalado** (a barra que não encosta no fim em tela
  curta): é altura do documento, e o Basalto resolve no `app.css` dele.
- **A altura dos destinos e os ícones da barra.** Só o rodapé muda; redesenhar
  o item é julgamento visual do dono, se os 20px ainda parecerem sobra.
- **O motor do iPhone de verdade.** O WebKit do Playwright não emula a área
  segura; os números acima são do Chromium, e o olho no aparelho fica com o
  dono.
- **O desktop com área segura (iPad) e o aviso de pé.** A faixa ocupa a largura
  inteira da janela, e por isso pinta o topo do trilho acima da marca; com o
  aviso do Basalto de pé (que começa a 75px), o esmaecimento dela cobre os
  3,67px de cima do aviso. Os dois ficam para o julgamento do dono.

## Consequências

- **Não é quebra de compatibilidade.** Sem área segura nenhuma, cada número é o
  da 1.6.0 — rodapé de 10px, barra de 73px, reserva de 104px — e a faixa tem
  0px. É capacidade nova (a propriedade pública `--co-statusbar-height` e a
  faixa), e por isso a versão é minor.
- **A `Screen` sempre tem um filho a mais.** O primeiro filho dela passa a ser
  a faixa; um consumidor que leia `firstChild` da moldura (em vez do próprio
  conteúdo) passa a receber a faixa. Ela é `aria-hidden` e não entra na ordem
  do Tab.
- **Quem consome simula o aparelho pela propriedade pública.** Fora do
  aparelho, o `env()` vale zero no `:root`, e `--co-statusbar-height` também:
  escrever `--co-safe-top` num contêiner não muda a faixa (é justamente o que a
  deixa sobreviver ao zero). Para simular, escreve-se também
  `--co-statusbar-height`, como a história "No iPhone" faz.
- **`fixed` é relativo à janela, a menos que um ancestral crie um bloco de
  contenção** (`transform`, `filter`, `contain`). A história "No iPhone" usa
  `contain: layout` na moldura do aparelho para conter a faixa ali; um
  consumidor que ponha um `transform` num ancestral da `Screen` verá a faixa
  presa a esse ancestral, e não à janela.
- **O teste de unidade prova a amarração, não o pixel.** O happy-dom resolve o
  `var()` mas não faz conta: `src/area-segura.test.tsx` lê o texto das regras,
  avalia a conta (agora com `*` e `/`) e confere o elemento que a `Screen`
  monta; o número em pixel é do navegador, e no Basalto o teste de ponta a
  ponta mede.

---

## Adendo 1.7.1 (2026-10-01) — o foco não fica atrás da faixa

**O defeito.** Com área segura, a faixa é opaca de 0 a 59px (os 75% de cima dos
78,67px dela). Um controle que já está nessa altura da janela é "visível" para o
navegador: ao receber o foco pelo teclado, a página não rola, e ele fica
inteiro atrás da faixa, com o anel de foco junto. É o critério 2.4.11 do WCAG
2.2 (foco não escondido, nível AA), o caso clássico do cabeçalho fixo. Na 1.6.0
o mesmo controle ficava sob a barra de status translúcida do sistema, e se via;
o axe não mede isso. Achado pela revisão da fase
`barra-no-fundo-e-faixa-sob-o-relogio` do Basalto, que já fixava a 1.7.0.

**O conserto.** O `:root` recua a rolagem da janela pela altura da faixa:

```css
:root {
  /* ...as quatro --co-safe-* e --co-statusbar-height, como acima... */
  scroll-padding-top: calc(var(--co-statusbar-height) * 4 / 3);
}
```

- **O mesmo texto da altura da faixa**, e não um número parecido: se um mudar
  sem o outro, o foco volta a cair atrás dela. Lê `--co-statusbar-height`, a
  única coisa que a faixa lê, e por isso sobrevive ao zero do consumidor.
- **No `:root`**, porque o recuo da janela é o do elemento raiz. Vale para o
  Tab, para a âncora (`#id`) e para o `scrollIntoView`.
- **Sem área segura vale 0**, e a rolagem é exatamente a da 1.7.0.

**A medição.** No Chromium, com o app real do Basalto (a casca dele com 30
botões no conteúdo), a área segura emulada pelo CDP em 59/34, e a folha da
coluna trocada só na linha nova. Foram 25 Shift+Tab e 25 Tab, a partir do topo e
do fim. Conta como escondido o foco cujo retângulo fica inteiro dentro da faixa
(0 a 78,67):

| | telefone (Galaxy S24) | desktop 1440×900 |
|---|---|---|
| 1.7.0, 59/34 | **1** (y −0,13 a 43,88) | **3** (y 0,38–3,38 a 44,38–47,38) |
| 1.7.1, 59/34 | **0** (menor topo de foco: 78,88) | **0** (78,88) |
| 1.7.1 com o aviso do Basalto de pé | 0 | 0 |
| sem área segura | 0 nas duas versões; os 100 passos iguais aos da 1.7.0 | idem |

Os escondidos saem todos do Shift+Tab, quando o foco sobe e a página rola para
pôr o controle na borda de cima. Com o Tab, a página rola para a borda de
baixo: 0 nas duas versões.

**Consequências.** É `fix`, e por isso a versão é patch: nada muda sem área
segura, e nenhuma API nova aparece. O recuo é da JANELA. Um consumidor que role
a tela dentro de um contêiner próprio (`overflow: auto`) precisa do mesmo recuo
nesse contêiner. Um `scroll-padding-top` do consumidor no `:root`, carregado
depois da folha, vence este; no `html`, não, porque `:root` é mais específico.
O teste de unidade (`src/area-segura.test.tsx`)
prova o texto: um `scroll-padding` só na folha, no `:root` do nível de cima,
igual à altura da faixa. Também prova a conta (0, 32 e 78,67) e o valor que o
happy-dom resolve no `:root`. O número da rolagem é do navegador.
