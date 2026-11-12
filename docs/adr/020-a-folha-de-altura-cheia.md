# ADR-020 — A folha de altura cheia

**Data:** 2026-11-12
**Status:** aceito

## Contexto

O Basalto (cartão slipalison/basalto#155) abre a receita de uma refeição, no
telefone, num card flutuante em tela cheia: um carrossel de receitas, cada uma
com as abas de ingredientes, preparo e macros, e as ações no rodapé. A `Sheet`
em `overlay` já é o diálogo certo — `aria-modal`, foco preso, Esc, ✕, foco que
volta —, mas a altura dela é a do conteúdo, com teto de 88% da janela.

Medido com a folha `auto`, que é a da 1.12.0, e a composição da receita numa
janela de 393×852: o painel tem 398px na aba "Preparo", 532px em "Macros" e
644px em "Ingredientes". A cada troca de aba o painel muda de tamanho, e o
cabeçalho, o ✕ e as setas do carrossel saem de baixo do dedo.

Tamanho de peça mora aqui, e não num override de classe `co-*` no app
(ADR-016).

## Decisão

**A `Sheet` ganha `size?: "auto" | "full"`. `auto` é o padrão e o
comportamento de sempre, nó por nó. `full`, em `overlay`, é o card flutuante em
tela cheia, e marca o painel com `data-size="full"`.**

- **A altura é a da janela menos uma faixa do véu no topo**:
  `calc(100% - var(--co-statusbar-height) - var(--co-space-24))`. É o que faz
  dele um card flutuante, e não uma tela: 24px do véu ficam à vista abaixo do
  relógio e da ilha. É `height`, e não `max-height`: **a altura é estável**, e
  não muda com o conteúdo.
- **Ela lê `--co-statusbar-height`**, e não `--co-safe-top`. A folha é da
  janela, como a faixa sob o relógio (ADR-012): o app que zera `--co-safe-top`
  debaixo de um aviso diz onde o conteúdo começa, e o relógio continua no mesmo
  lugar. A folha de altura cheia é a terceira leitora dessa altura, e a lista
  fechada de `area-segura.test.tsx` passa a nomeá-la. A área segura de baixo
  continua sendo o `padding-bottom` da folha de sempre, por dentro da altura.
- **O cabeçalho e o `footer` ficam fixos; o corpo ocupa o resto e rola
  inteiro.** O corpo vira coluna flex (`flex: 1 1 auto; min-height: 0`), e nada
  que está direto nele encolhe (`flex-shrink: 0`). Sem isso, as `Tabs` — que
  encolhem, para rolar por dentro de um card de altura fixa — cederiam a
  altura, e a 320px ou com a letra a 200% a pessoa rolaria um retângulo de uma
  linha. O painel das abas só rola por dentro quando alguém lhe dá altura (um
  card de altura fixa, `--co-tabs-panel-max-height`), como antes.
- **A largura não muda**: os 520px de teto da folha de sempre, centrada. Numa
  janela larga o painel não estica, e a linha de texto fica em cerca de 36
  caracteres (460px úteis, medidos), bem abaixo dos 80 do piso. O desktop continua sendo da
  `inline` ("largura nunca vira modal"); a `overlay` cheia numa janela larga é
  legível, e não é o caminho recomendado.
- **Em `inline`, `size` não muda nada**, nem a marca: o painel abre no fluxo,
  com a altura do conteúdo, e não há janela para encher.

### O que mudou no `Deck` e nas `Tabs`

A composição do Basalto — `Sheet size="full"` com um `Deck` direto no corpo,
as `Tabs` em cada card e dois botões no `footer` — tem de funcionar sem CSS do
app. Dois ajustes, os dois retrocompatíveis e sem prop nova:

- **A janela do `Deck` cresce e não encolhe** (`flex: 1 0 auto`). Sem altura
  dada, nada muda. Com ela — o `Deck` direto no corpo da folha cheia cresce até
  o rodapé (`flex-grow: 1`) —, as setas ficam embaixo, no mesmo lugar, qualquer
  que seja a altura do card ou da aba aberta. O card nunca é cortado na
  vertical: a janela só corta de lado (`overflow-x: clip`).
- **O painel das `Tabs` dentro de um card do `Deck` leva `touch-action:
  pan-y`.** Era um defeito da 1.12.0, medido aqui: o painel é um contêiner de
  rolagem (`overflow: auto`), e o `touch-action` de quem está dentro dele só se
  soma até ele — o `pan-y` do card não alcançava. O dedo que andava de lado
  sobre os ingredientes era do navegador, que não achava o que rolar e
  cancelava o ponteiro: o card só se arrastava pelo título. Com a regra, de
  lado é do carrossel também sobre o conteúdo da aba, e na vertical rola quem
  rola (o corpo da folha).

## O que ficou de fora

- **Um componente novo** (`FullSheet`, `Modal`). É o mesmo diálogo, e duas
  peças divergem no primeiro ajuste feito com pressa — o motivo de a `Sheet`
  ser uma só nas duas larguras.
- **Altura por prop numérica ou por custom property.** O Basalto precisa de uma
  altura, e uma escala de alturas sem segundo caso é contrato que ninguém pediu.
- **Tela cheia de verdade, sem a faixa do véu.** Sem ela o diálogo parece uma
  tela nova, e a pessoa procura o "voltar". A faixa diz que a tela de antes
  continua ali.
- **Margem dos lados e painel solto no meio numa janela larga.** O desktop é da
  `inline`; desenhar um segundo modal para ele contradiz a regra da largura.
- **`touch-action: pan-y` na fileira de abas.** Com nomes compridos ou a letra
  a 200%, a fileira rola de lado dentro de si, e é pelo dedo que se alcança a
  aba fora da vista. Sobre a fileira, de lado continua sendo dela.
- **O painel da aba, dentro de um card do `Deck`, não se rola mais de lado com
  o dedo.** Ele continua rolando pelo teclado (é parada do Tab) e na vertical.
  O texto quebra em qualquer ponto (`overflow-wrap: anywhere`), então só um
  conteúdo que não quebra (uma tabela larga) chegaria a rolar de lado — e
  dentro de um carrossel esse gesto é do carrossel.

## Consequências

- Versão menor nova pela esteira (`feat`); o Basalto fixa essa versão no cartão
  #155 e monta a composição da história **"Receita em tela cheia"**
  (`Moléculas/Sheet`, claro e escuro), que é a referência.
- A prova de `src/folha-cheia.test.tsx`: a marca (`data-size="full"` só em
  `overlay` + `full`; `auto` e a falta da prop dão a mesma árvore, e a `inline`
  também); o foco que entra, o Esc e o ✕ que fecham, o foco que volta e o Tab
  que dá a volta, na folha cheia; o axe nos dois temas; e, pela folha de
  estilo, a altura avaliada (769px num iPhone 16 com 59px em cima, 828px sem
  área segura), a lista fechada do que as regras da cheia declaram (nenhuma
  largura, cor, animação ou transição), o corpo que rola, o `flex-shrink: 0` e
  o `touch-action`.
- A medida no navegador (Chromium e WebKit do Playwright, a história "Receita
  em tela cheia", claro e escuro), que o happy-dom não faz:
  - **393×852**: painel de 24 a 852 (828px); cabeçalho 64px, rodapé 73px, corpo
    691px sem rolagem (691/691); as seis linhas de ingrediente à vista, na
    primeira e na segunda receita, e nenhum elemento da folha com rolagem. A altura do painel
    (828) e o topo das setas (719) não mudam nas três abas nem ao trocar de
    receita. Sem a marca (o controle), o painel mede 398, 532 e 644px conforme
    a aba.
  - **393×852 com a área segura do iPhone 16** (59px em cima e 34px embaixo, só
    no Chromium, pelo `Emulation.setSafeAreaInsetsOverride`): painel de 83 a
    852 (769px), rodapé terminando em 818, corpo de 598px sem rolagem, seis
    linhas à vista.
  - **320×568**: quem rola é o corpo (407px para 507px de conteúdo), e só ele;
    o painel da aba tem a altura do conteúdo (336/336); o End, com o foco no
    corpo, leva-o ao fim (100 de 100).
  - **Letra a 200%** (janelas de 196×426 e 160×284, que são 393×852 e 320×568
    com o zoom em 200%): o corpo rola inteiro (265px para 591px; 123px para
    829px no Chromium e 846px no WebKit), o painel da aba não rola por dentro,
    e a página não rola de lado.
  - **A isca do `flex-shrink`**, a 320×568, com as `Tabs` direto no corpo
    abaixo de um bloco de 300px: com a regra, o corpo rola (407/718) e o painel
    da aba fica inteiro (336/336); com `flex-shrink: 1`, o corpo para de rolar
    e o painel da aba rola por dentro com 159px, nos dois motores.
  - **1280×800**: painel de 520px de largura, centrado, de 24 a 800.
  - **O toque** (Chromium, 320×568, toque emulado pelo CDP): o dedo que anda
    160px de lado sobre uma linha de ingrediente troca de receita (antes da
    regra, não trocava; pelo título do card, sempre trocou), e o que sobe 150px
    rola o corpo, sem trocar de receita.
  - **O alvo**: nenhum botão da folha abaixo de 44×44; o axe nas regras do WCAG
    A/AA não acha nada, a 393 e a 320px.
  - **Movimento reduzido**: a entrada do painel dura 0,01ms.
- Não foi medido: um aparelho de verdade (a área segura no WebKit do Playwright
  não se emula, e o toque só foi emulado no Chromium), e o teclado virtual
  aberto sobre a folha cheia — a receita não tem campo.
